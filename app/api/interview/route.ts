import { NextResponse } from "next/server";
import { applyTurn, nextQuestion } from "@/lib/agent/interviewer";
import { kickOffVerification } from "@/lib/agent/orchestrate";
import { createSession, getParsedResume, getSession, saveSession } from "@/lib/session";

/**
 * One turn of the interview.
 *
 * Request:  { sessionId?: string, said?: string }
 *           Omit sessionId to start a new interview.
 * Response: { sessionId, say, endInterview, resume }
 *
 * This contract is stable — build the voice UI against it.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: string;
      said?: string;
      /** From /api/parse-resume — interview an uploaded résumé instead of the seed. */
      resumeId?: string;
    };

    let state = body.sessionId ? getSession(body.sessionId) : undefined;
    if (!state) {
      if (body.sessionId) {
        return NextResponse.json(
          { error: "Session not found — start a new one." },
          { status: 404 },
        );
      }
      if (body.resumeId && !getParsedResume(body.resumeId)) {
        // Never fall back to the demo résumé for a real applicant.
        return NextResponse.json(
          { error: "Your uploaded résumé is no longer available — please apply again." },
          { status: 404 },
        );
      }
      state = createSession(body.resumeId);
    }

    // Fold the candidate's utterance in before asking for the next question,
    // so the model sees it when deciding what to probe next.
    if (body.said) {
      state = {
        ...state,
        transcript: [
          ...state.transcript,
          { speaker: "candidate" as const, text: body.said },
        ],
      };
    }

    const result = await nextQuestion(state);
    state = applyTurn(state, result);
    saveSession(state);

    // Verification runs in the background against whichever claims the agent
    // has chosen to interrogate, so external evidence is ready by the time the
    // conversation ends rather than adding latency to the report.
    if (result.targetBulletId) {
      void kickOffVerification(state.sessionId, result.targetBulletId);
    }

    return NextResponse.json({
      sessionId: state.sessionId,
      say: result.say,
      endInterview: result.endInterview,
      resume: state.resume,
    });
  } catch (err) {
    console.error("[/api/interview]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interview turn failed" },
      { status: 500 },
    );
  }
}
