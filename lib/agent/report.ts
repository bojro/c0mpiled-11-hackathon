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

Write the screening report. Include one finding per résumé bullet — including bullets the interview never reached, which should be marked unverified with that stated plainly as the reason.`,
      },
    ],
  });

  return parseStructured<ScreeningReport>(response.content);
}
