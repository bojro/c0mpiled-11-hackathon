import { anthropic } from "./client";
import { interviewerSystemPrompt } from "./prompts";
import { modelParams, parseStructured } from "@/lib/model";
import type { InterviewState, InterviewTurnResult } from "@/lib/types";

/**
 * Schema for a single interview turn. Structured output here is doing real
 * work: the turn has to produce both something to *say* and control flow
 * (which probe is active, whether to move on) in one round trip. Free-text
 * parsing of that would be a coin flip at 9:50 PM.
 */
const TURN_SCHEMA = {
  type: "object",
  properties: {
    say: {
      type: "string",
      description:
        "The question to speak aloud. One or two sentences, conversational.",
    },
    targetBulletId: {
      type: ["string", "null"],
      description: "Which résumé bullet this question attacks, or null.",
    },
    closeCurrentProbe: {
      type: "boolean",
      description: "True when the current claim is settled and you're moving on.",
    },
    endInterview: {
      type: "boolean",
      description: "True when you have enough evidence to write the report.",
    },
  },
  required: ["say", "targetBulletId", "closeCurrentProbe", "endInterview"],
  additionalProperties: false,
} as const;

/**
 * Produce the agent's next question given everything said so far.
 *
 * The full transcript goes in every turn rather than a running summary — the
 * consistency check depends on the model seeing answer 2 and answer 5 side by
 * side, which a summary would flatten away.
 */
export async function nextQuestion(
  state: InterviewState,
): Promise<InterviewTurnResult> {
  const messages = state.transcript.map((turn) => ({
    role: turn.speaker === "agent" ? ("assistant" as const) : ("user" as const),
    content: turn.text,
  }));

  // The model needs a user turn to respond to; on the very first call there
  // is no candidate utterance yet, so we prompt it to open the conversation.
  if (messages.length === 0 || messages[messages.length - 1].role === "assistant") {
    messages.push({
      role: "user",
      content:
        messages.length === 0
          ? "[The candidate has joined and is ready. Greet them briefly and ask your first question.]"
          : "[No response yet — the candidate is still thinking.]",
    });
  }

  const response = await anthropic.messages.create({
    ...modelParams("interview", TURN_SCHEMA),
    system: interviewerSystemPrompt(state),
    messages,
  });

  return parseStructured<InterviewTurnResult>(response.content);
}

/** Fold a completed turn back into the session state. */
export function applyTurn(
  state: InterviewState,
  result: InterviewTurnResult,
  candidateSaid?: string,
): InterviewState {
  const transcript = [...state.transcript];
  if (candidateSaid) {
    transcript.push({ speaker: "candidate", text: candidateSaid });
  }
  transcript.push({ speaker: "agent", text: result.say });

  const probes = [...state.probes];
  const targetId = result.targetBulletId;

  if (targetId) {
    const existing = probes.find((p) => p.bulletId === targetId);
    if (existing) {
      existing.depth += 1;
      if (result.closeCurrentProbe) existing.status = "resolved";
    } else {
      probes.push({
        bulletId: targetId,
        rationale: "Selected by the interviewer as worth interrogating.",
        depth: 1,
        status: "open",
        evidence: [],
      });
    }
  }

  return {
    ...state,
    transcript,
    probes,
    activeProbeId: result.closeCurrentProbe ? null : targetId,
    phase: result.endInterview ? "wrapping_up" : "interviewing",
  };
}
