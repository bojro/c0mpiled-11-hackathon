/**
 * The report data contract. This is the shared boundary between the interview
 * agent (writes it) and the recruiter console (reads it).
 *
 * Agree on changes before editing — both halves of the build depend on this file.
 */

/** Verdict per résumé bullet. `unverified` is deliberate: it lets the agent say
 *  "no external record found" without implying the candidate lied. */
export type Verdict = "green" | "yellow" | "red" | "unverified";

/** The "I vs we" axis — the highest-signal question in behavioral screening.
 *  Surfaced as its own column, not buried in evidence prose. */
export type OwnershipSignal = "drove" | "contributed" | "adjacent" | "unclear";

export type EvidenceKind =
  /** Something the candidate said in the interview. */
  | "transcript"
  /** Employer / title / dates checked against CrustData's person API. */
  | "crustdata"
  /** Commits, repos, or contribution history checked against GitHub. */
  | "github"
  /** The story changed between one answer and a later one. */
  | "consistency";

export type Evidence = {
  kind: EvidenceKind;
  /** One line the recruiter reads in the collapsed state. */
  summary: string;
  /** The actual exchange or record, shown when the row is expanded.
   *  This is what makes a verdict credible instead of a black box. */
  excerpt?: string;
};

export type BulletFinding = {
  /** Verbatim from the résumé, so the recruiter can anchor to what they read. */
  bulletText: string;
  /** Which role this bullet sits under — used to group the console's left column. */
  company: string;
  title: string;
  verdict: Verdict;
  /** The one line that explains the verdict at a glance. */
  headline: string;
  ownershipSignal: OwnershipSignal;
  evidence: Evidence[];
};

export type TranscriptTurn = {
  speaker: "agent" | "candidate";
  text: string;
};

export type ScreeningReport = {
  candidate: {
    name: string;
    roleAppliedFor: string;
  };
  /** Recruiter-facing summary. Informational — the system never decides. */
  overallSummary: string;
  findings: BulletFinding[];
  transcript: TranscriptTurn[];
  /** Present only if we captured audio; the transcript alone is sufficient. */
  audioUrl?: string;
};

/**
 * JSON Schema for Claude's structured output on the report-generation call.
 * Kept in lockstep with the types above.
 *
 * Constraints that matter: every object needs `additionalProperties: false`
 * and an explicit `required` list, or the API rejects the schema.
 */
export const SCREENING_REPORT_SCHEMA = {
  type: "object",
  properties: {
    candidate: {
      type: "object",
      properties: {
        name: { type: "string" },
        roleAppliedFor: { type: "string" },
      },
      required: ["name", "roleAppliedFor"],
      additionalProperties: false,
    },
    overallSummary: {
      type: "string",
      description:
        "Neutral summary for the recruiter. Describe what was and was not " +
        "substantiated. Do not recommend hiring or rejecting.",
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          bulletText: {
            type: "string",
            description: "The résumé bullet verbatim, unedited.",
          },
          company: {
            type: "string",
            description: "The employer this bullet sits under on the résumé.",
          },
          title: {
            type: "string",
            description: "The candidate's title for that role.",
          },
          verdict: {
            type: "string",
            enum: ["green", "yellow", "red", "unverified"],
            description:
              "green: substantiated under questioning. yellow: partially " +
              "substantiated or contribution narrower than stated. red: " +
              "contradicted by evidence or collapsed under follow-up. " +
              "unverified: no external record found — not an accusation.",
          },
          headline: {
            type: "string",
            description: "One line explaining the verdict at a glance.",
          },
          ownershipSignal: {
            type: "string",
            enum: ["drove", "contributed", "adjacent", "unclear"],
            description:
              "Whether the candidate drove the work, contributed to it, was " +
              "adjacent to it, or could not be determined.",
          },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                  enum: ["transcript", "crustdata", "github", "consistency"],
                },
                summary: { type: "string" },
                excerpt: {
                  type: "string",
                  description:
                    "The actual exchange or record backing this. Shown when " +
                    "the recruiter expands the row.",
                },
              },
              required: ["kind", "summary"],
              additionalProperties: false,
            },
          },
        },
        required: [
          "bulletText",
          "company",
          "title",
          "verdict",
          "headline",
          "ownershipSignal",
          "evidence",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["candidate", "overallSummary", "findings"],
  additionalProperties: false,
} as const;
