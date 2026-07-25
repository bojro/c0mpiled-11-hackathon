import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { interviewerSystemPrompt } from "@/lib/agent/prompts";

/**
 * Mint an ephemeral OpenAI Realtime client secret bound to a fresh interview
 * session. GPT Realtime carries the voice conversation; the interrogation
 * protocol rides in as session instructions, and tool calls sync state back
 * into our engine (probe tracking → Claude-run verification → Claude report).
 */
export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured — add it to .env.local and restart." },
      { status: 500 },
    );
  }

  // Optional: interview an uploaded résumé (from /api/parse-resume) instead of the seed.
  const body = (await req.json().catch(() => ({}))) as { resumeId?: string };
  const state = createSession(body.resumeId);

  const instructions = `${interviewerSystemPrompt(state)}

## Voice-conversation additions (you are speaking aloud in real time)

- Keep every question to one or two short spoken sentences. Never read lists.
- React naturally ("mm-hm", "got it") but briefly — you are warm, not chatty.
- Open warmly: greet the candidate by first name, one sentence of welcome,
  THEN your first question. Do not open with a bare question.
- If you can't hear them clearly, ask them to repeat at most once — never
  repeatedly comment on audio quality.
- The candidate may be in a noisy room. If you hear a fragment, side-chatter
  clearly not addressed to you, or someone else's voice, do not treat it as an
  answer — say nothing about it and simply continue waiting, or gently re-ask
  your question. Only engage with substantive answers directed at you.

## Tools — use them exactly like this

- The FIRST time you start interrogating a résumé claim, call record_probe with
  that claim's bullet id (b1–b${state.resume.bullets.length}). Call it once per
  claim, when you first target it — this triggers background verification
  against outside records while you keep talking. Do not mention the tools or
  the verification to the candidate.
- Verification results arrive MID-CALL as system notes marked
  "[Background verification result …]". Handle them per your "Live background
  verification" guidance above: confront a discrepancy in a public-artifact
  claim directly and neutrally when that claim is next in play; stay silent
  about corroboration and about absent records for private work. Don't
  interrupt yourself to raise one — finish the current thread first.
- When you have real evidence on your chosen claims and the conversation is
  complete, say a brief warm goodbye and then call end_interview.`;

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 900 },
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1",
        instructions,
        audio: {
          input: {
            // gpt-4o-transcribe hallucinates far less than whisper on faint audio
            transcription: { model: "gpt-4o-transcribe" },
            // semantic VAD waits for complete thoughts — right fit for interview
            // answers, and much less twitchy against speaker echo
            turn_detection: { type: "semantic_vad", eagerness: "low" },
          },
          output: { voice: "marin" },
        },
        tools: [
          {
            type: "function",
            name: "record_probe",
            description:
              "Record that you are now interrogating a specific résumé claim. Call once per claim, the first time you target it.",
            parameters: {
              type: "object",
              properties: {
                bulletId: {
                  type: "string",
                  description: "The résumé bullet id, e.g. b1",
                },
              },
              required: ["bulletId"],
            },
          },
          {
            type: "function",
            name: "end_interview",
            description:
              "Call after your spoken goodbye, when the interview is complete.",
            parameters: { type: "object", properties: {} },
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[realtime/session]", res.status, detail.slice(0, 500));
    return NextResponse.json(
      { error: `Failed to mint realtime session (${res.status})` },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { value: string };
  return NextResponse.json({
    sessionId: state.sessionId,
    clientSecret: data.value,
    candidateName: state.resume.candidateName,
  });
}
