"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Resume } from "@/lib/types";

/**
 * Candidate-facing application. Accepts a résumé PDF (drag or click) and
 * parses it for real: the PDF goes to /api/parse-resume, Claude reads the
 * document natively, and the extracted claims come back for a quick preview
 * before the candidate starts the conversation. The interview, verification,
 * and report all run against what was uploaded here.
 */

type Stage =
  | { step: "empty" }
  | { step: "parsing"; fileName: string }
  | { step: "parsed"; fileName: string; resumeId: string; resume: Resume }
  | { step: "error"; message: string };

export default function ApplyPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ step: "empty" });
  const [dragOver, setDragOver] = useState(false);

  const accept = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setStage({ step: "parsing", fileName: file.name });
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: form });
      const data = (await res.json()) as {
        resumeId?: string;
        resume?: Resume;
        error?: string;
      };
      if (!res.ok || !data.resumeId || !data.resume) {
        throw new Error(data.error ?? `Parsing failed (${res.status})`);
      }
      setStage({
        step: "parsed",
        fileName: file.name,
        resumeId: data.resumeId,
        resume: data.resume,
      });
    } catch (e) {
      setStage({
        step: "error",
        message: e instanceof Error ? e.message : "Couldn't read that PDF.",
      });
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-8 py-4">
        <span className="font-mono text-sm font-medium tracking-widest text-ink uppercase">
          Debrief
        </span>
        <span className="font-mono text-xs text-ink-muted">
          Backend Engineer (New Grad) · Application
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Apply with your résumé
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            No forms to re-type. We read your résumé, and instead of a keyword
            filter you get a short conversation — a chance to talk about the
            work like you would with an engineer.
          </p>

          {stage.step !== "parsed" && (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void accept(e.dataTransfer.files[0]);
              }}
              className={`mt-8 flex min-h-44 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 transition-colors ${
                dragOver
                  ? "border-accent bg-accent-dim"
                  : "border-line-strong bg-surface hover:border-accent/50"
              }`}
            >
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => void accept(e.target.files?.[0] ?? undefined)}
              />
              <AnimatePresence mode="wait">
                {stage.step === "parsing" ? (
                  <motion.div
                    key="parsing"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <p className="font-mono text-sm text-accent">{stage.fileName}</p>
                    <p className="mt-2 font-mono text-xs text-ink-secondary">
                      Reading your résumé…
                    </p>
                  </motion.div>
                ) : stage.step === "error" ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <p className="font-mono text-xs text-red-400">{stage.message}</p>
                    <p className="mt-2 text-sm text-ink">
                      Try another PDF, or the same one again
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="empty" exit={{ opacity: 0 }} className="text-center">
                    <p className="text-sm text-ink">
                      Drop your résumé here, or click to choose
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-ink-muted">
                      PDF · never shared outside this application
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </label>
          )}

          {stage.step === "parsed" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-8 w-full rounded-xl border border-line-strong bg-surface p-6"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-ink">
                  {stage.resume.candidateName}
                </p>
                <p className="font-mono text-[11px] text-ink-muted">{stage.fileName}</p>
              </div>
              <p className="mt-1 font-mono text-xs text-ink-secondary">
                {stage.resume.bullets.length} claims we&apos;ll talk about
                {stage.resume.githubUsername
                  ? ` · github.com/${stage.resume.githubUsername}`
                  : ""}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {stage.resume.bullets.slice(0, 5).map((b) => (
                  <li
                    key={b.id}
                    className="font-mono text-[11px] leading-relaxed text-ink-secondary"
                  >
                    <span className="text-ink-muted">[{b.company}]</span>{" "}
                    {b.text.length > 110 ? `${b.text.slice(0, 110)}…` : b.text}
                  </li>
                ))}
                {stage.resume.bullets.length > 5 && (
                  <li className="font-mono text-[11px] text-ink-muted">
                    +{stage.resume.bullets.length - 5} more
                  </li>
                )}
              </ul>
              <div className="mt-5 flex items-center gap-4">
                <button
                  onClick={() => router.push(`/interview?resume=${stage.resumeId}`)}
                  className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-medium text-black transition-opacity hover:opacity-90"
                >
                  Start the conversation
                </button>
                <button
                  onClick={() => setStage({ step: "empty" })}
                  className="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
                >
                  use a different résumé
                </button>
              </div>
            </motion.div>
          )}

          <p className="mt-6 font-mono text-[11px] leading-relaxed text-ink-muted">
            What happens next: we verify what we can from public and employment
            records while you talk, then a report of the conversation goes to a
            human. A human makes every decision.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
