"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

/**
 * The candidate's application tracker — the Workday journey, minus Workday.
 *
 * Steps advance on a timer to play the pipeline out for the demo: parse →
 * external checks (with live-feeling log lines) → OA invitation "sent" →
 * ready. The email is simulated; the OA button goes to the voice interview.
 */

const CHECK_LINES = [
  "Parsing résumé … 5 claims selected for verification",
  "Employment records · F500 Company · title + dates consistent",
  "Employment records · Startup (YC S20) · window consistent",
  "GitHub · kencarson · nba-win-prob: 69 tests, CI, July 2026 activity",
  "Preparing interview plan · 4 probes across 3 roles",
];

export default function StatusPage() {
  const [step, setStep] = useState(0); // 0 applied, 1 checks, 2 oa sent, 3 ready
  const [lines, setLines] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 900),
      ...CHECK_LINES.map((_, i) =>
        setTimeout(() => setLines(i + 1), 1600 + i * 850),
      ),
      setTimeout(() => setStep(2), 1600 + CHECK_LINES.length * 850 + 400),
      setTimeout(() => setStep(3), 1600 + CHECK_LINES.length * 850 + 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = [
    { label: "Application received", done: step >= 0 },
    { label: "Verification checks", done: step >= 2, active: step === 1 },
    { label: "Interview invitation sent", done: step >= 3, active: step === 2 },
    { label: "Your conversation", done: false, active: step === 3 },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-8 py-4">
        <span className="font-mono text-sm font-medium tracking-widest text-ink uppercase">
          Debrief
        </span>
        <span className="font-mono text-xs text-ink-muted">
          Ken Carson · Backend Engineer (New Grad)
        </span>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-8 py-12">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Your application
        </h1>

        {/* Step tracker */}
        <ol className="mt-8 flex flex-col">
          {steps.map((s, i) => (
            <li key={s.label} className="flex gap-4">
              {/* Rail */}
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors duration-500 ${
                    s.done
                      ? "border-accent bg-accent-dim text-accent"
                      : s.active
                        ? "animate-pulse border-accent/60 text-accent"
                        : "border-line-strong text-ink-muted"
                  }`}
                >
                  {s.done ? "✓" : i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className={`w-px flex-1 transition-colors duration-500 ${
                      s.done ? "bg-accent/40" : "bg-line"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pb-7">
                <p
                  className={`pt-0.5 text-sm font-medium ${
                    s.done || s.active ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {s.label}
                </p>

                {/* Live check lines under step 2 */}
                {i === 1 && lines > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-4">
                    {CHECK_LINES.slice(0, lines).map((line) => (
                      <motion.p
                        key={line}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="font-mono text-[11px] leading-relaxed text-ink-secondary"
                      >
                        <span className="text-v-green">✓</span> {line}
                      </motion.p>
                    ))}
                  </div>
                )}

                {/* Simulated email under step 3 */}
                {i === 2 && step >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-lg border border-line bg-surface p-4"
                  >
                    <p className="font-mono text-[11px] text-ink-muted">
                      to: Ken@usc.edu · just now
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink">
                      Hi Ken — your background checks are done. When you're
                      ready, we'd love to hear about your work in your own
                      words. It's a ~10 minute voice conversation with our
                      interviewer. No trick questions — just the chance a
                      résumé never gives you.
                    </p>
                  </motion.div>
                )}

                {/* OA entry under step 4 */}
                {i === 3 && step >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3"
                  >
                    <Link
                      href="/interview"
                      className="inline-block rounded-md border border-accent/60 bg-accent-dim px-4 py-2 font-mono text-sm text-accent transition-colors hover:bg-accent/20"
                    >
                      Start your conversation →
                    </Link>
                    <p className="mt-2 font-mono text-[11px] text-ink-muted">
                      Take it when you're ready — there's no timer on this.
                    </p>
                  </motion.div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
