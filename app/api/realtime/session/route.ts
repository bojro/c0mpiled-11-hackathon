import { NextResponse } from "next/server";
import { createSession, getParsedResume } from "@/lib/session";
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
  if (body.resumeId && !getParsedResume(body.resumeId)) {
    // Never fall back to the demo résumé for a real applicant.
    return NextResponse.json(
      { error: "Your uploaded résumé is no longer available — please apply again." },
      { status: 404 },
    );
  }
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
- This interview is in English ONLY. You always speak English, no matter what.
  If an utterance arrives that appears to be in another language, it is
  background noise that was mis-transcribed — it is NOT the candidate. Do not
  respond to it, do not translate it, do not switch languages; keep waiting
  for the candidate's real answer, or re-ask your question in English.

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
            // gpt-4o-transcribe hallucinates far less than whisper on faint
            // audio. language pins the decode to English and the prompt biases
            // it further — but neither is a hard guarantee (Korean/Spanish
            // still slipped through in .debug/realtime.jsonl), so the client
            // additionally drops and deletes non-English transcripts.
            transcription: {
              model: "gpt-4o-transcribe",
              language: "en",
              prompt:
                "An English-language job interview. The candidate speaks only English. Background noise, breaths, and unclear audio are not speech.",
            },
            // server VAD with an explicit silence floor: the turn can only end
            // after 2s of real silence, so a thinking pause never cuts the
            // candidate off. threshold 0.7 keeps room noise from registering
            // as speech at all, and interrupt_response keeps a noise blip from
            // truncating the agent's question mid-sentence.
            turn_detection: {
              type: "server_vad",
              threshold: 0.7,
              prefix_padding_ms: 300,
              silence_duration_ms: 2000,
              interrupt_response: false,
            },
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
