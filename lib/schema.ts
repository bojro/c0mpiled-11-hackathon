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

/**
 * One atomic sub-claim inside a bullet, judged on its own. A bullet like
 * "Led migration of payment infrastructure serving 2M users" packs three
 * separately-checkable assertions — the work happened, THEY led it, the 2M
 * scale — and they routinely earn different verdicts. Facets let the report
 * flag exactly which words didn't hold up ("Led") instead of dragging the
 * whole sentence into one undifferentiated color.
 */
export type FacetFinding = {
  /** The atomic assertion, self-contained: "led the migration effort". */
  claim: string;
  /** Shortest verbatim substring of the bullet carrying this facet ("Led",
   *  "40%") — lets the UI point at the exact words. Null when the facet
   *  isn't tied to a specific phrase. */
  span: string | null;
  verdict: Verdict;
  /** One line: why this facet got its verdict. */
  note: string;
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
  /** Per-facet breakdown. Optional in the type so older fixtures compile;
   *  the generation schema requires it, and the bullet verdict is enforced
   *  in code to be no more generous than the worst facet. */
  facets?: FacetFinding[];
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
          facets: {
            type: "array",
            description:
              "The bullet decomposed into 1-4 atomic sub-claims, each judged " +
              "on its own. Required for every finding.",
            items: {
              type: "object",
              properties: {
                claim: {
                  type: "string",
                  description:
                    "The atomic assertion, self-contained: 'led the migration effort'.",
                },
                span: {
                  type: ["string", "null"],
                  description:
                    "Shortest VERBATIM substring of bulletText carrying this " +
                    "facet ('Led', '40%') — exact characters, so the UI can " +
                    "mark the words. Null if not tied to a specific phrase.",
                },
                verdict: {
                  type: "string",
                  enum: ["green", "yellow", "red", "unverified"],
                },
                note: {
                  type: "string",
                  description: "One line: why this facet got its verdict.",
                },
              },
              required: ["claim", "span", "verdict", "note"],
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
          "facets",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["candidate", "overallSummary", "findings"],
  additionalProperties: false,
} as const;
