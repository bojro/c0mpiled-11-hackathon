import { anthropic } from "./client";
import { reportSystemPrompt } from "./prompts";
import { modelParams, parseStructured } from "@/lib/model";
import { SCREENING_REPORT_SCHEMA, type ScreeningReport } from "@/lib/schema";
import type { InterviewState } from "@/lib/types";

/**
 * Turn a finished interview plus verification evidence into the report.
 *
 * This is the deliverable — it runs at the highest effort tier and is the one
 * call worth spending latency on.
 */
export async function generateReport(
  state: InterviewState,
): Promise<ScreeningReport> {
  const transcriptText = state.transcript
    .map((t) => `${t.speaker === "agent" ? "Interviewer" : "Candidate"}: ${t.text}`)
    .join("\n\n");

  const bulletList = state.resume.bullets
    .map((b) => `[${b.id}] "${b.text}" — ${b.title}, ${b.company}, ${b.dates}`)
    .join("\n");

  const externalEvidence = state.probes
    .flatMap((p) =>
      p.evidence.map(
        (e) => `[${p.bulletId}] (${e.kind}) ${e.summary}${e.excerpt ? `\n    ${e.excerpt}` : ""}`,
      ),
    )
    .join("\n");

  const response = await anthropic.messages.create({
    ...modelParams("report", SCREENING_REPORT_SCHEMA),
    system: reportSystemPrompt(),
    messages: [
      {
        role: "user",
        content: `Candidate: ${state.resume.candidateName}
Role applied for: ${state.job.roleTitle} at ${state.job.company}

## Résumé bullets

${bulletList}

## Interview transcript

${transcriptText}

## External verification

${externalEvidence || "(no external checks completed)"}

Write the screening report. Produce findings ONLY for claims that were actually examined — interrogated in the interview, or checked against external records. Bullets the interview never reached get no finding at all: on the report, an unmarked bullet already communicates "not examined." Reserve the unverified verdict for claims that WERE checked and where no record exists either way.`,
      },
    ],
  });

  const report = parseStructured<ScreeningReport>(response.content);
  return enforceFacetConsistency(report);
}

/** Severity used only for the facet → bullet rollup. Green and unverified sit
 *  at the same level on purpose: an unverified facet is not a downgrade
 *  ("no public record" must never read as an accusation). */
const ROLLUP_SEVERITY = { red: 3, yellow: 2, green: 1, unverified: 1 } as const;

/**
 * Code-enforced invariants the prompt asks for but generation can't guarantee:
 * a bullet verdict is never more generous than its worst facet, and a facet
 * `span` the UI can't actually find in the bullet text is nulled rather than
 * trusted. Deterministic — the same report always rolls up the same way.
 */
function enforceFacetConsistency(report: ScreeningReport): ScreeningReport {
  for (const finding of report.findings) {
    if (!finding.facets?.length) continue;
    for (const facet of finding.facets) {
      if (facet.span && !finding.bulletText.includes(facet.span)) {
        facet.span = null;
      }
    }
    const worst = Math.max(
      ...finding.facets.map((f) => ROLLUP_SEVERITY[f.verdict]),
    );
    if (worst >= 3 && finding.verdict !== "red") {
      finding.verdict = "red";
    } else if (worst === 2 && finding.verdict === "green") {
      finding.verdict = "yellow";
    }
  }
  return report;
}
