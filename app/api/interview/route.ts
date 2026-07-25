import { NextResponse } from "next/server";
import { applyTurn, nextQuestion } from "@/lib/agent/interviewer";
import { verifyBullet } from "@/lib/agent/verify";
import { createSession, getSession, saveSession } from "@/lib/session";

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
    };

    let state = body.sessionId ? getSession(body.sessionId) : undefined;
    if (!state) {
      if (body.sessionId) {
        return NextResponse.json(
          { error: "Session not found — start a new one." },
          { status: 404 },
        );
      }
      state = createSession();
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

/** Fire-and-forget verification. Failures degrade the report to `unverified`
 *  rather than breaking the interview, which is the right tradeoff live. */
async function kickOffVerification(sessionId: string, bulletId: string) {
  try {
    const state = getSession(sessionId);
    if (!state) return;

    const probe = state.probes.find((p) => p.bulletId === bulletId);
    // Only verify once per claim, on first selection.
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
