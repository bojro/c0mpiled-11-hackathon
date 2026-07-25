import { verifyBullet } from "./verify";
import { getSession, saveSession } from "@/lib/session";
import type { TranscriptTurn } from "@/lib/schema";

/**
 * Shared orchestration between the two voice stacks (browser-native loop and
 * OpenAI Realtime): transcript merging, probe tracking, and background
 * verification. The investigation and report engine is identical either way.
 */

/** Append turns to a session's transcript. */
export function appendTurns(sessionId: string, turns: TranscriptTurn[]): boolean {
  const state = getSession(sessionId);
  if (!state) return false;
  saveSession({ ...state, transcript: [...state.transcript, ...turns] });
  return true;
}

/** Record that the interviewer is probing a claim; fire verification once. */
export function recordProbe(sessionId: string, bulletId: string): void {
  const state = getSession(sessionId);
  if (!state) return;
  const existing = state.probes.find((p) => p.bulletId === bulletId);
  if (existing) {
    existing.depth += 1;
    saveSession(state);
  } else {
    state.probes.push({
      bulletId,
      rationale: "Selected by the interviewer as worth interrogating.",
      depth: 1,
      status: "open",
      evidence: [],
    });
    saveSession(state);
    void kickOffVerification(sessionId, bulletId);
  }
}

/** Fire-and-forget external verification. Failures degrade the report to
 *  `unverified` rather than breaking the interview. */
export async function kickOffVerification(sessionId: string, bulletId: string) {
  try {
    const state = getSession(sessionId);
    if (!state) return;

    const probe = state.probes.find((p) => p.bulletId === bulletId);
    if (!probe || probe.evidence.length > 0) return;

    const bullet = state.resume.bullets.find((b) => b.id === bulletId);
    if (!bullet) return;

    const evidence = await verifyBullet(bullet, state.resume);

    // Re-read: the interview has advanced while this was in flight.
    const fresh = getSession(sessionId);
    if (!fresh) return;
    const target = fresh.probes.find((p) => p.bulletId === bulletId);
    if (target) {
      target.evidence.push(...evidence);
      saveSession(fresh);
    }
  } catch (err) {
    console.error("[verification]", bulletId, err);
  }
}
