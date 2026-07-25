import type { Verdict } from "@/lib/schema";

/**
 * Mock candidate pipeline for the HR view. Ken Carson is the live row —
 * his report exists. Everyone else is summary-only fixture data.
 */

export type Stage = "applied" | "screening" | "oa_sent" | "interview" | "report";

export type PipelineCandidate = {
  name: string;
  appliedAgo: string;
  stage: Stage;
  /** Present once the report exists. */
  verdicts?: Record<Verdict, number>;
  /** One line the recruiter scans — the report's strongest signal. */
  topSignal: string;
  /** Only Ken links to a real report. */
  reportHref?: string;
};

export const STAGE_LABEL: Record<Stage, string> = {
  applied: "Applied",
  screening: "Checks running",
  oa_sent: "OA sent",
  interview: "In interview",
  report: "Report ready",
};

export const PIPELINE_ROLE = "Backend Engineer (New Grad)";

export const PIPELINE: PipelineCandidate[] = [
  {
    name: "Ken Carson",
    appliedAgo: "2h ago",
    stage: "report",
    verdicts: { green: 2, yellow: 1, red: 1, unverified: 1 },
    topSignal: "Attributed metrics honestly under follow-up; GitHub corroborates project claims",
    reportHref: "/report",
  },
  {
    name: "Maya Okafor",
    appliedAgo: "5h ago",
    stage: "report",
    verdicts: { green: 3, yellow: 1, red: 0, unverified: 1 },
    topSignal: "Strong ownership throughout; named rejected alternatives unprompted",
  },
  {
    name: "Tuan Nguyen",
    appliedAgo: "3h ago",
    stage: "report",
    verdicts: { green: 1, yellow: 1, red: 2, unverified: 1 },
    topSignal: "Story drifted on two claims; could not attribute either headline metric",
  },
  {
    name: "Sofia Alvarez",
    appliedAgo: "1h ago",
    stage: "report",
    verdicts: { green: 2, yellow: 2, red: 0, unverified: 2 },
    topSignal: "Solid on implementation depth; leadership claims narrower than phrased",
  },
  {
    name: "Jae Park",
    appliedAgo: "45m ago",
    stage: "interview",
    topSignal: "Voice interview in progress — 3 of 4 probes complete",
  },
  {
    name: "Dmitri Volkov",
    appliedAgo: "1h ago",
    stage: "oa_sent",
    topSignal: "OA invitation sent · employment checks came back clean",
  },
  {
    name: "Priya Raman",
    appliedAgo: "30m ago",
    stage: "oa_sent",
    topSignal: "OA invitation sent · GitHub activity matches claimed stack",
  },
  {
    name: "Chris Ito",
    appliedAgo: "12m ago",
    stage: "screening",
    topSignal: "CrustData employment check running · GitHub pull queued",
  },
  {
    name: "Amara Diallo",
    appliedAgo: "8m ago",
    stage: "screening",
    topSignal: "Résumé parsed · 5 claims selected for verification",
  },
  {
    name: "Leo Fernandez",
    appliedAgo: "3m ago",
    stage: "applied",
    topSignal: "Awaiting résumé parse",
  },
];
