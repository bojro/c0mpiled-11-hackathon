import { DEMO_JOB, DEMO_RESUME } from "@/data/seed";
import type { InterviewState } from "./types";

/**
 * In-memory session store. Deliberately not a database — this is a demo, and a
 * Map is one less thing that can fail on stage.
 *
 * Caveat worth knowing: Next dev-mode hot reload can wipe this. If a session
 * 404s mid-development after an edit, that's why — start a new one.
 */
const sessions = new Map<string, InterviewState>();

export function createSession(): InterviewState {
  const sessionId = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const state: InterviewState = {
    sessionId,
    resume: DEMO_RESUME,
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
