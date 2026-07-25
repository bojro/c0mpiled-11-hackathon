import { appendFileSync, mkdirSync } from "fs";
import { NextResponse } from "next/server";
import path from "path";

/**
 * Dev-only sink: the realtime client ships every event here so the session
 * can be debugged from the server side while someone tests by voice.
 * Appends JSONL to .debug/realtime.jsonl (gitignored).
 */
const DIR = path.join(process.cwd(), ".debug");
const FILE = path.join(DIR, "realtime.jsonl");

export async function POST(req: Request) {
  try {
    const { entries } = (await req.json()) as { entries: unknown[] };
    mkdirSync(DIR, { recursive: true });
    const now = new Date().toISOString();
    for (const e of entries ?? []) {
      appendFileSync(FILE, JSON.stringify({ t: now, ...(e as object) }) + "\n");
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
