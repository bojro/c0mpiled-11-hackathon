/**
 * Interview session state. Distinct from `schema.ts`, which is the *output*
 * contract — this is the working state the agent mutates as it investigates.
 */

import type { Evidence, TranscriptTurn } from "./schema";

export type ResumeBullet = {
  id: string;
  text: string;
  /** Which role on the résumé this bullet sits under. */
  company: string;
  title: string;
  /** Free-text dates as written on the résumé, e.g. "Jan 2023 – Present". */
  dates: string;
};

export type Resume = {
  candidateName: string;
  githubUsername?: string;
  bullets: ResumeBullet[];
};

export type JobDescription = {
  roleTitle: string;
  company: string;
  /** What this role actually needs — the agent probes against these. */
  mustHaves: string[];
};

/**
 * A claim the agent decided to interrogate. The agent picks these itself
 * rather than walking every bullet in order — depth on two or three beats
 * a shallow pass over ten.
 */
export type Probe = {
  bulletId: string;
  /** Why this bullet was selected — shown in the console so the recruiter
   *  can see the agent's reasoning, not just its conclusion. */
  rationale: string;
  /** How many follow-ups have been asked on this claim so far. The Bar Raiser
   *  protocol is 3–5 levels deep; we stop when the claim is resolved or spent. */
  depth: number;
  status: "open" | "resolved" | "exhausted";
  /** Evidence accumulated for this bullet from any source. */
  evidence: Evidence[];
};

export type InterviewState = {
  sessionId: string;
  resume: Resume;
  job: JobDescription;
  transcript: TranscriptTurn[];
  probes: Probe[];
  /** Which probe the agent is currently pursuing. */
  activeProbeId: string | null;
  phase: "not_started" | "interviewing" | "wrapping_up" | "complete";
};

/** What the interviewer model returns each turn. */
export type InterviewTurnResult = {
  /** The question to speak aloud. */
  say: string;
  /** Which bullet this question is attacking, if any. */
  targetBulletId: string | null;
  /** Set when the agent considers the current claim settled and is moving on. */
  closeCurrentProbe: boolean;
  /** Set when the agent has enough to write the report. */
  endInterview: boolean;
};
