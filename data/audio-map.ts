/**
 * Audio for the mock report. Clips are keyed by finding/evidence index and
 * were synthesized from the exact transcript text on screen (two voices:
 * interviewer + candidate). In the live product these come from the recorded
 * voice interview; the player UI is identical either way.
 */

/** `f{findingIndex}-e{evidenceIndex}` → public path */
export const CLIP: Record<string, string> = {
  "f0-e0": "/audio/f0-e0.m4a",
  "f0-e1": "/audio/f0-e1.m4a",
  "f1-e0": "/audio/f1-e0.m4a",
  "f1-e1": "/audio/f1-e1.m4a",
  "f2-e1": "/audio/f2-e1.m4a",
  "f3-e0": "/audio/f3-e0.m4a",
};

export const FULL_AUDIO = "/audio/full.m4a";

export function clipFor(findingIndex: number, evidenceIndex: number): string | undefined {
  return CLIP[`f${findingIndex}-e${evidenceIndex}`];
}
