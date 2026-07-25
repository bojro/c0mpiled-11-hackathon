"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { BulletFinding, Evidence } from "@/lib/schema";
import { EVIDENCE_KIND, VERDICT } from "./verdict";

/**
 * Right column: evidence for the selected bullet.
 *
 * Interview evidence shows its exchange inline. Tool evidence (CrustData,
 * GitHub) collapses to its summary with the raw pulled report behind a
 * click — the recruiter can audit exactly what the agent saw.
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
          style={{
            borderColor: `color-mix(in srgb, ${v.color} 35%, transparent)`,
            background: v.dim,
          }}
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
            <EvidenceCard key={i} evidence={e} order={i} />
          ))}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

function EvidenceCard({ evidence, order }: { evidence: Evidence; order: number }) {
  // Tool reports start collapsed — the summary is the finding, the raw pull
  // is the audit trail. Interview exchanges start open — the quote IS the
  // evidence.
  const isToolReport = evidence.kind === "crustdata" || evidence.kind === "github";
  const [open, setOpen] = useState(!isToolReport);
  const hasExcerpt = Boolean(evidence.excerpt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + order * 0.07, duration: 0.3 }}
      className="rounded-lg border border-line bg-surface"
    >
      <button
        onClick={() => hasExcerpt && setOpen(!open)}
        disabled={!hasExcerpt}
        className={`w-full p-5 text-left ${hasExcerpt ? "cursor-pointer" : "cursor-default"}`}
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] tracking-widest text-accent uppercase">
            {EVIDENCE_KIND[evidence.kind]}
          </span>
          {hasExcerpt && (
            <span className="font-mono text-[10.5px] text-ink-muted">
              {open
                ? "− collapse"
                : isToolReport
                  ? "+ view pulled report"
                  : "+ view exchange"}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-ink-secondary">{evidence.summary}</p>
      </button>

      <AnimatePresence initial={false}>
        {open && hasExcerpt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <blockquote
              className={`mx-5 mb-5 border-l-2 pl-4 ${
                isToolReport ? "border-accent/40" : "border-line-strong"
              }`}
            >
              <pre className="font-mono text-[12px] leading-[1.7] whitespace-pre-wrap text-ink">
                {evidence.excerpt}
              </pre>
            </blockquote>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
