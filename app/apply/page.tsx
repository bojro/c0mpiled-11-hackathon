"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

/**
 * Candidate-facing application. Accepts a résumé PDF (drag or click), plays
 * the parse, then hands off to the status tracker.
 *
 * The parse is simulated — the demo résumé is seeded server-side. The file
 * never leaves the browser.
 */
export default function ApplyPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const accept = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setFileName(file.name);
      // Let the confirmation breathe, then move to the tracker.
      setTimeout(() => router.push("/status"), 1400);
    },
    [router],
  );

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

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              accept(e.dataTransfer.files[0]);
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
              onChange={(e) => accept(e.target.files?.[0] ?? undefined)}
            />
            <AnimatePresence mode="wait">
              {fileName ? (
                <motion.div
                  key="accepted"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <p className="font-mono text-sm text-accent">{fileName}</p>
                  <p className="mt-2 font-mono text-xs text-ink-secondary">
                    Reading your résumé…
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

          <p className="mt-6 font-mono text-[11px] leading-relaxed text-ink-muted">
            What happens next: we verify what we can from public and employment
            records, then email you an invitation to a 10-minute voice
            conversation about your work. A human makes every decision.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
