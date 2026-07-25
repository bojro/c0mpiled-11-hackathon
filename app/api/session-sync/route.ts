import { NextResponse } from "next/server";
import { appendTurns, recordProbe } from "@/lib/agent/orchestrate";
import { getSession, saveSession } from "@/lib/session";
import type { TranscriptTurn } from "@/lib/schema";

/**
 * Sync endpoint for the Realtime voice stack: the browser mirrors transcript
 * turns and tool calls here so our engine (probes, verification, report)
 * stays the source of truth regardless of which model carries the voice.
 *
 * Body: { sessionId, turns?: TranscriptTurn[], probeBulletId?: string, end?: boolean }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      turns?: TranscriptTurn[];
      probeBulletId?: string;
      end?: boolean;
    };
    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    if (body.turns?.length) {
      const ok = appendTurns(body.sessionId, body.turns);
      if (!ok) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
    }

    if (body.probeBulletId) {
      recordProbe(body.sessionId, body.probeBulletId);
    }

    if (body.end) {
      const state = getSession(body.sessionId);
      if (state) saveSession({ ...state, phase: "wrapping_up" });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/session-sync]", err);
    return NextResponse.json({ error: "sync failed" }, { status: 500 });
  }
}
