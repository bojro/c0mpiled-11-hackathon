"use client";

import { AnimatePresence, motion } from "motion/react";
import type { BulletFinding } from "@/lib/schema";
import { EVIDENCE_KIND, VERDICT } from "./verdict";

/**
 * Right column: the evidence for the selected bullet. The quote is the
 * payload — candidate's actual words in mono, given room. Crossfade+slide
 * on selection change.
 */
export function EvidencePanel({
  finding,
  index,
}: {
  finding: BulletFinding;
  index: number;
}) {
  const v = VERDICT[finding.verdict];

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={index}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        aria-label="Evidence"
        className="flex flex-col gap-5"
      >
        {/* Verdict headline */}
        <div
          className="rounded-lg border p-5"
          style={{ borderColor: `color-mix(in srgb, ${v.color} 35%, transparent)`, background: v.dim }}
        >
          <p
            className="font-mono text-[11px] tracking-widest uppercase"
            style={{ color: v.color }}
          >
            {v.label}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">
            {finding.headline}
          </p>
        </div>

        {/* Evidence items */}
        <div className="flex flex-col gap-4">
          {finding.evidence.map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.07, duration: 0.3 }}
              className="rounded-lg border border-line bg-surface p-5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] tracking-widest text-accent uppercase">
                  {EVIDENCE_KIND[e.kind]}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{e.summary}</p>

              {e.excerpt && (
                <blockquote className="mt-4 border-l-2 border-line-strong pl-4">
                  <pre className="font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap text-ink">
                    {e.excerpt}
                  </pre>
                </blockquote>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
