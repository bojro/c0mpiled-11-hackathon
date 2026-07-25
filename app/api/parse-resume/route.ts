import { NextResponse } from "next/server";
import { parseResumePdf } from "@/lib/agent/parse";
import { stashResume } from "@/lib/session";

/**
 * The front door: résumé PDF in, parsed claims out.
 *
 * Request:  multipart/form-data with a "file" field (the PDF).
 * Response: { resumeId, resume } — the apply page previews `resume` and hands
 *           `resumeId` to /interview, where both voice stacks pass it into
 *           session creation.
 */
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB — far above any real résumé

export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Upload a PDF as the 'file' field." }, { status: 400 });
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF too large (10MB max)." }, { status: 413 });
    }
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF résumés are supported." }, { status: 415 });
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const resume = await parseResumePdf(base64);

    if (resume.bullets.length === 0) {
      return NextResponse.json(
        { error: "Couldn't find any work or project claims in that PDF." },
        { status: 422 },
      );
    }

    const resumeId = stashResume(resume);
    return NextResponse.json({ resumeId, resume });
  } catch (err) {
    console.error("[/api/parse-resume]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Résumé parsing failed" },
      { status: 500 },
    );
  }
}
