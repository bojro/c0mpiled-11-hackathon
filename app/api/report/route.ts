import { NextResponse } from "next/server";
import { generateReport } from "@/lib/agent/report";
import { getSession, saveSession } from "@/lib/session";

/**
 * Generate the screening report for a finished interview.
 *
 * Request:  { sessionId: string }
 * Response: ScreeningReport  (see lib/schema.ts)
 */
export async function POST(req: Request) {
  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const state = getSession(sessionId);
    if (!state) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const report = await generateReport(state);
    saveSession({ ...state, phase: "complete" });

    return NextResponse.json(report);
  } catch (err) {
    console.error("[/api/report]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Report generation failed" },
      { status: 500 },
    );
  }
}
