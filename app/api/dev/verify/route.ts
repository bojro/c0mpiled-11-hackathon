import { NextResponse } from "next/server";
import { verifyBullet } from "@/lib/agent/verify";
import { DEMO_RESUME } from "@/data/seed";

/**
 * Dev harness: run the live verification agent on one résumé bullet and
 * return exactly what it pulled and concluded.
 *
 *   GET /api/dev/verify?bullet=b4
 *
 * b4 is the NBA project — the GitHub-relevant claim. This is also a good
 * on-stage receipt for "the verification is real."
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("bullet") ?? "b4";
  const bullet = DEMO_RESUME.bullets.find((b) => b.id === id);
  if (!bullet) {
    return NextResponse.json(
      { error: `Unknown bullet id "${id}". Try b1–b5.` },
      { status: 400 },
    );
  }

  const started = Date.now();
  try {
    const evidence = await verifyBullet(bullet, DEMO_RESUME);
    return NextResponse.json({
      bullet: bullet.text,
      githubUsername: DEMO_RESUME.githubUsername,
      tookMs: Date.now() - started,
      evidence,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
