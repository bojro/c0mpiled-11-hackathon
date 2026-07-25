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

/**
 * GET /api/session-sync?sessionId=...&after=N
 *
 * Verification evidence, flattened in stable order (probes in creation order,
 * evidence in arrival order), skipping the first N entries. The Realtime voice
 * client polls this and injects new results into the live conversation — the
 * realtime stack bakes its instructions at mint time, so evidence that lands
 * mid-interview has to travel this path to reach the model that is talking.
 * (The browser-native loop doesn't need it: it rebuilds the system prompt from
 * session state every turn.)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const after = Math.max(0, Number(url.searchParams.get("after") ?? "0") || 0);
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const state = getSession(sessionId);
  if (!state) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const flat = state.probes.flatMap((p) =>
    p.evidence.map((e) => ({
      bulletId: p.bulletId,
      kind: e.kind,
      summary: e.summary,
      excerpt: e.excerpt,
    })),
  );
  return NextResponse.json({ evidence: flat.slice(after), total: flat.length });
}
