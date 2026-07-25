import { anthropic } from "./client";
import { modelParams, parseStructured } from "@/lib/model";
import type { Resume } from "@/lib/types";

/**
 * The front door: a résumé PDF in, our `Resume` working shape out.
 *
 * The PDF goes to Claude as a native document block — no pdf-parse dependency,
 * no text-extraction step to mangle two-column layouts. The model reads the
 * document the way a person does, which is exactly what résumés (a visual
 * format) need.
 *
 * Everything downstream — interviewer, probes, verification, report — already
 * runs off `Resume`, so this one call turns the seeded demo into a product
 * that takes anyone's résumé.
 */

interface RawBullet {
  text: string;
  company: string;
  title: string;
  dates: string;
}
interface RawParse {
  candidateName: string;
  githubUsername: string | null;
  bullets: RawBullet[];
}

const PARSE_SCHEMA = {
  type: "object",
  properties: {
    candidateName: { type: "string" },
    githubUsername: {
      type: ["string", "null"],
      description:
        "GitHub username if one appears anywhere on the résumé (github.com/<username> in the contact line counts), else null. Username only, not the URL.",
    },
    bullets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The bullet verbatim as written, unedited.",
          },
          company: {
            type: "string",
            description:
              "The employer / lab / program / project name this bullet sits under.",
          },
          title: {
            type: "string",
            description: "The candidate's role for that entry.",
          },
          dates: {
            type: "string",
            description: 'Free-text dates as written, e.g. "June 2024 – August 2024".',
          },
        },
        required: ["text", "company", "title", "dates"],
        additionalProperties: false,
      },
    },
  },
  required: ["candidateName", "githubUsername", "bullets"],
  additionalProperties: false,
} as const;

const PARSE_SYSTEM = `You are the résumé-intake stage of an AI screening interview. Extract the claims the interviewer will interrogate.

What counts as a bullet: every statement describing work the candidate did — jobs, internships, research, personal or open-source projects. Keep the text VERBATIM; the recruiter report anchors to the exact wording. Carry each bullet's employer/org, title, and dates from the entry it sits under.

What to skip: pure biographical lines with nothing to interrogate — GPA, test scores, coursework lists, skills lists, awards without a described accomplishment, and education entries that only state enrollment.

Completeness over structure: résumé PDFs often have multi-column layouts and dense formatting. Reconstruct the document's intent — every organization or project named as a place the candidate worked gets its bullets captured, even if the layout separates them. If an org is named with no bullet at all, synthesize one bullet of the form "Worked at <org> as <title>" so the interviewer can still ask about it. Do not drop anything that names real work.`;

/** Parse a résumé PDF (base64) into the working Resume shape. Bullet ids are
 *  assigned here (b1..bN) — stable, and the shape the whole engine keys on. */
export async function parseResumePdf(pdfBase64: string): Promise<Resume> {
  const response = await anthropic.messages.create({
    ...modelParams("parse", PARSE_SCHEMA as unknown as Record<string, unknown>),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          { type: "text", text: "Extract this résumé." },
        ],
      },
    ],
  });

  const raw = parseStructured<RawParse>(response.content);
  return {
    candidateName: raw.candidateName,
    githubUsername: raw.githubUsername ?? undefined,
    bullets: raw.bullets.map((b, i) => ({
      id: `b${i + 1}`,
      text: b.text,
      company: b.company,
      title: b.title,
      dates: b.dates,
    })),
  };
}
