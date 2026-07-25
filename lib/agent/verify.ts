import { betaTool } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import { anthropic } from "./client";
import { modelParams } from "@/lib/model";
import type { Evidence } from "@/lib/schema";
import type { Resume, ResumeBullet } from "@/lib/types";

/**
 * Verification runs as a real agentic loop: the model decides which sources to
 * consult and how to combine them, rather than us hard-coding a checklist.
 * This runs concurrently with the interview — by the time the candidate stops
 * talking, the external evidence is already in hand.
 *
 * Both tools degrade honestly. A missing API key produces "unverified", never
 * a fabricated result and never an implied accusation.
 */

const GITHUB_API = "https://api.github.com";

/** Public GitHub, no key required (60 req/hr unauthenticated — fine for a demo).
 *  Set GITHUB_TOKEN to raise the limit. */
const githubTool = betaTool({
  name: "lookup_github_activity",
  description:
    "Look up a candidate's public GitHub profile and recent repositories. " +
    "Use this to check whether a technical claim is reflected in public work. " +
    "Absence of evidence is not evidence of absence — most professional work " +
    "happens in private repos.",
  inputSchema: {
    type: "object",
    properties: {
      username: { type: "string", description: "GitHub username" },
    },
    required: ["username"],
    additionalProperties: false,
  },
  run: async ({ username }: { username: string }) => {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    try {
      const [profileRes, reposRes] = await Promise.all([
        fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, { headers }),
        fetch(
          `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=15`,
          { headers },
        ),
      ]);

      if (profileRes.status === 404) {
        return `No public GitHub account found for "${username}". This is not evidence against the candidate — treat related claims as unverified.`;
      }
      if (!profileRes.ok) {
        return `GitHub lookup failed (HTTP ${profileRes.status}). Treat related claims as unverified.`;
      }

      const profile = await profileRes.json();
      const repos = reposRes.ok ? await reposRes.json() : [];

      const repoLines = (repos as Record<string, unknown>[])
        .map(
          (r) =>
            `  - ${r.name} (${r.language ?? "no language"}, ★${r.stargazers_count}) — ${r.description ?? "no description"}`,
        )
        .join("\n");

      return `GitHub profile for ${username}:
  name: ${profile.name ?? "not set"}
  bio: ${profile.bio ?? "not set"}
  public repos: ${profile.public_repos}
  followers: ${profile.followers}
  account created: ${profile.created_at}

Recent public repositories:
${repoLines || "  (none public)"}`;
    } catch (err) {
      return `GitHub lookup errored: ${String(err)}. Treat related claims as unverified.`;
    }
  },
});

/** CrustData person/company enrichment. Requires CRUSTDATA_API_KEY —
 *  the hackathon credit code is ULUVCRUSTDATA. */
const employmentTool = betaTool({
  name: "verify_employment",
  description:
    "Check a claimed employer, title, and date range against real-world " +
    "company and person data. Use this to confirm the candidate held the role " +
    "they say they held, when they say they held it.",
  inputSchema: {
    type: "object",
    properties: {
      personName: { type: "string" },
      company: { type: "string" },
      title: { type: "string" },
    },
    required: ["personName", "company", "title"],
    additionalProperties: false,
  },
  run: async ({
    personName,
    company,
    title,
  }: {
    personName: string;
    company: string;
    title: string;
  }) => {
    const key = process.env.CRUSTDATA_API_KEY;
    if (!key) {
      return `Employment verification unavailable (no CRUSTDATA_API_KEY configured). Report the claim "${title} at ${company}" as unverified — do not treat this as a negative signal.`;
    }

    try {
      const res = await fetch(
        `https://api.crustdata.com/screener/person/search`,
        {
          method: "POST",
          headers: {
            // Current documented scheme (docs.crustdata.com): Bearer + api version.
            Authorization: `Bearer ${key}`,
            "x-api-version": "2025-11-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filters: [
              // Schema per live API: no FULL_NAME — first/last are separate.
              { filter_type: "CURRENT_COMPANY", type: "in", value: [company] },
              {
                filter_type: "FIRST_NAME",
                type: "in",
                value: [personName.split(" ")[0]],
              },
              {
                filter_type: "LAST_NAME",
                type: "in",
                value: [personName.split(" ").slice(1).join(" ") || personName],
              },
            ],
            page: 1,
          }),
        },
      );

      if (!res.ok) {
        return `Employment lookup failed (HTTP ${res.status}). Report "${title} at ${company}" as unverified.`;
      }

      const data = (await res.json()) as {
        profiles?: { name?: string; default_position_title?: string; headline?: string; location?: string }[];
        total_display_count?: number;
      };
      const profiles = data.profiles ?? [];
      if (profiles.length === 0) {
        return `CrustData person search: no records matching ${personName} at ${company}. This is common for interns and early-career roles — report the claim as unverified, not as contradicted.`;
      }
      const lines = profiles
        .slice(0, 5)
        .map(
          (p) =>
            `  - ${p.name ?? "?"} — ${p.default_position_title ?? p.headline ?? "?"} (${p.location ?? "?"})`,
        )
        .join("\n");
      return `CrustData person search for ${personName} at ${company} (claimed title: ${title}):\n${data.total_display_count ?? profiles.length} match(es):\n${lines}`;
    } catch (err) {
      return `Employment lookup errored: ${String(err)}. Report as unverified.`;
    }
  },
});

/**
 * Investigate one résumé bullet against external sources.
 *
 * The tool runner drives the loop: the model calls whichever tools it judges
 * relevant, reads the results, and may call again before concluding.
 */
export async function verifyBullet(
  bullet: ResumeBullet,
  resume: Resume,
): Promise<Evidence[]> {
  const runner = anthropic.beta.messages.toolRunner({
    ...modelParams("verify"),
    system: `You are verifying a single résumé claim against external sources for a screening report.

Check what you can. Report what you find plainly, including when you find nothing — "no external record" is a legitimate and common result, and must never be phrased as if it implies dishonesty. Most real work leaves no public trace.

Do not speculate beyond what the sources actually say. When you're done, summarize your findings in two or three sentences.`,
    messages: [
      {
        role: "user",
        content: `Candidate: ${resume.candidateName}${
          resume.githubUsername ? ` (GitHub: ${resume.githubUsername})` : ""
        }

Claim to verify:
  "${bullet.text}"
  Stated role: ${bullet.title} at ${bullet.company}, ${bullet.dates}

Verify what you can and summarize.`,
      },
    ],
    tools: [githubTool, employmentTool],
    max_iterations: 6,
  });

  const evidence: Evidence[] = [];

  for await (const message of runner) {
    for (const block of message.content) {
      if (block.type === "tool_use") {
        evidence.push({
          kind: block.name === "lookup_github_activity" ? "github" : "crustdata",
          summary: `Checked ${block.name === "lookup_github_activity" ? "GitHub" : "employment records"} for this claim.`,
        });
      }
    }
  }

  const final = await runner.done();
  const summary = final.content.find((b) => b.type === "text");
  if (summary && summary.type === "text") {
    evidence.push({
      kind: "github",
      summary: "External verification summary",
      excerpt: summary.text,
    });
  }

  return evidence;
}
