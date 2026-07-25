import { DEMO_JOB, DEMO_RESUME } from "@/data/seed";
import type { InterviewState, Resume } from "./types";

/**
 * In-memory session store. Deliberately not a database — this is a demo, and a
 * Map is one less thing that can fail on stage.
 *
 * Caveat worth knowing: Next dev-mode hot reload can wipe this. If a session
 * 404s mid-development after an edit, that's why — start a new one.
 */
const sessions = new Map<string, InterviewState>();

/**
 * Parsed résumés waiting for their interview, keyed by the id /api/parse-resume
 * hands the apply page. Same in-memory philosophy as sessions. Kept (not
 * consumed) on read so a refreshed interview page can start over.
 */
const parsedResumes = new Map<string, Resume>();

export function stashResume(resume: Resume): string {
  const resumeId = `r_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  parsedResumes.set(resumeId, resume);
  return resumeId;
}

export function getParsedResume(resumeId: string): Resume | undefined {
  return parsedResumes.get(resumeId);
}

/** Start a session — against an uploaded résumé when a resumeId is supplied,
 *  or the seeded demo résumé when none is (the explicit demo entry).
 *  A resumeId that no longer resolves (server restart wiped the in-memory
 *  store) throws rather than silently interviewing a real applicant about the
 *  demo candidate's résumé. */
export function createSession(resumeId?: string): InterviewState {
  const sessionId = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  let resume: Resume;
  if (resumeId) {
    const uploaded = parsedResumes.get(resumeId);
    if (!uploaded) {
      throw new Error(
        "Your uploaded résumé is no longer available — please apply again.",
      );
    }
    resume = uploaded;
  } else {
    resume = DEMO_RESUME;
  }
  const state: InterviewState = {
    sessionId,
    resume,
    job: DEMO_JOB,
    transcript: [],
    probes: [],
    activeProbeId: null,
    phase: "not_started",
  };
  sessions.set(sessionId, state);
  return state;
}

export function getSession(sessionId: string): InterviewState | undefined {
  return sessions.get(sessionId);
}

export function saveSession(state: InterviewState): void {
  sessions.set(state.sessionId, state);
}
