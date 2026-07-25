"use client";

import { motion } from "motion/react";
import type { ScreeningReport, Verdict } from "@/lib/schema";
import { RESUME_DOC } from "@/data/resume";
import { VERDICT, VERDICT_ORDER } from "./verdict";

/**
 * Top bar: wordmark, candidate identity, and the verdict counts.
 * Counts only above the fold — the color-coded résumé is the product.
 */
export function CountsStrip({ report }: { report: ScreeningReport }) {
  const counts = report.findings.reduce<Record<Verdict, number>>(
    (acc, f) => {
      acc[f.verdict] += 1;
      return acc;
    },
    { green: 0, yellow: 0, red: 0, unverified: 0 },
  );
  const totalBullets = RESUME_DOC.sections
    .flatMap((s) => s.entries)
    .reduce((n, e) => n + e.bullets.length, 0);

  return (
    <header className="flex items-center justify-between border-b border-line px-8 py-4">
      <div className="flex items-baseline gap-6">
        <span className="font-mono text-sm font-medium tracking-widest text-ink uppercase">
          Debrief
        </span>
        <span className="text-sm text-ink-secondary">
          {report.candidate.name}
          <span className="mx-2 text-ink-muted">·</span>
          {report.candidate.roleAppliedFor}
        </span>
      </div>

      <div className="flex items-center gap-5">
        <span className="font-mono text-xs text-ink-muted">
          {report.findings.length} of {totalBullets} claims examined
        </span>
        <span aria-hidden className="h-4 w-px bg-line-strong" />
        {VERDICT_ORDER.filter((v) => counts[v] > 0).map((v, i) => (
          <motion.div
            key={v}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
            className="flex items-center gap-2"
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: VERDICT[v].color }}
            />
            <span className="font-mono text-sm tabular-nums text-ink">
              {counts[v]}
            </span>
            <span className="text-xs text-ink-muted">{v}</span>
          </motion.div>
        ))}
      </div>
    </header>
  );
}
