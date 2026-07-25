import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { interviewerSystemPrompt } from "@/lib/agent/prompts";

/**
 * Mint an ephemeral OpenAI Realtime client secret bound to a fresh interview
 * session. GPT Realtime carries the voice conversation; the interrogation
 * protocol rides in as session instructions, and tool calls sync state back
 * into our engine (probe tracking → Claude-run verification → Claude report).
 */
export async function POST() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured — add it to .env.local and restart." },
      { status: 500 },
    );
  }

  const state = createSession();

  const instructions = `${interviewerSystemPrompt(state)}

## Voice-conversation additions (you are speaking aloud in real time)

- Keep every question to one or two short spoken sentences. Never read lists.
- React naturally ("mm-hm", "got it") but briefly — you are warm, not chatty.
- Open by greeting the candidate by first name and asking your first question.

## Tools — use them exactly like this

- The FIRST time you start interrogating a résumé claim, call record_probe with
  that claim's bullet id (b1–b5). Call it once per claim, when you first target
  it — this triggers background verification against outside records while you
  keep talking. Do not mention the tools or the verification to the candidate.
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
            transcription: { model: "whisper-1" },
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
