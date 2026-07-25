import { NextResponse } from "next/server";
import { anthropic } from "@/lib/agent/client";
import { modelParams } from "@/lib/model";

/**
 * Demo-only: an AI plays Ken so the interview can run hands-free on stage
 * (?auto=1 on /interview). The persona is scripted to produce one green,
 * one yellow, and one red arc — the same story the mock report tells.
 */

const PERSONA = `You are Ken Carson, a CS master's student interviewing for a backend role. Answer the interviewer's LAST question in ONE to THREE spoken sentences — casual, natural, a real person talking, no lists.

Ground truth you answer from:
- EKS work (real, yours): FastAPI portfolio-data service; you wrote the Dockerfile and K8s manifests. War story: second week, a rollout stalled — readiness probe hit a DB-touching endpoint, a deploy exhausted the connection pool, healthy pods went unready. You split liveness from readiness, pointed readiness at an in-memory check. Redis over in-process cache because three replicas gave inconsistent reads.
- 20% ticket claim (honest yellow): the migration was really yours, but the 20% number came from your manager's review comment — you never saw the dashboard. Say so plainly if asked how it was measured.
- 35% refactor claim (inflated — IMPORTANT, play this arc exactly): the truth is you only updated two endpoints on the device-status service, and the format was designed by a staff engineer — but you are NOT upfront about that. The FIRST TWO times you're asked about this claim, answer confidently and broadly ("I refactored our backend APIs to standardize error handling across the microservices, cut client-side parsing bugs significantly") with zero caveats, zero hedging, no mention of the staff engineer or the two endpoints. Only when the interviewer presses a THIRD time on specifics (which services exactly, what did YOU write, where did 35% come from) does the scope shrink, reluctantly. Never volunteer the truth early — this candidate oversells this claim.
- NBA project (real, yours): split by season to avoid rolling-feature leakage; random splits looked deceptively better; 0.854 AUC on held-out 2025-26 season; 61 commits in 8 days; 69 tests; GitHub Actions CI.

Anything else: improvise plausibly but thinly, like someone who was nearby but not deep.`;

export async function POST(req: Request) {
  try {
    const { history } = (await req.json()) as {
      history: { speaker: string; text: string }[];
    };

    const messages = history.map((h) => ({
      // From Ken's perspective the interviewer is the user speaking to him.
      role: h.speaker === "agent" ? ("user" as const) : ("assistant" as const),
      content: h.text,
    }));
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "history must end with an agent turn" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      ...modelParams("interview"),
      system: PERSONA,
      messages,
    });

    const text = response.content.find((b) => b.type === "text");
    return NextResponse.json({
      say: text && text.type === "text" ? text.text.trim() : "Sorry, could you repeat that?",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "candidate turn failed" },
      { status: 500 },
    );
  }
}
