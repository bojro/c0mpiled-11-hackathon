"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { BulletFinding, Evidence, FacetFinding } from "@/lib/schema";
import { clipFor } from "@/data/audio-map";
import { AudioClip } from "./AudioClip";
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
  total,
  onStep,
}: {
  finding: BulletFinding;
  index: number;
  total: number;
  onStep: (dir: 1 | -1) => void;
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
        {/* Annotation stepper */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">
            Annotation {index + 1} of {total}
          </span>
          <div className="flex items-center gap-1.5">
            <StepButton dir={-1} onStep={onStep} label="Previous annotation" />
            <StepButton dir={1} onStep={onStep} label="Next annotation" />
            <span className="ml-2 hidden font-mono text-[10px] text-ink-muted lg:inline">
              ← → keys
            </span>
          </div>
        </div>

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

        {/* Facet breakdown — which words held up and which didn't */}
        {finding.facets && finding.facets.length > 0 && (
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">
              Claim by claim
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {finding.facets.map((f, i) => (
                <FacetRow key={i} facet={f} />
              ))}
            </div>
          </div>
        )}

        {/* Evidence items */}
        <div className="flex flex-col gap-4">
          {finding.evidence.map((e, i) => (
            <EvidenceCard key={i} evidence={e} order={i} findingIndex={index} />
          ))}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

/** One atomic sub-claim: dot + the exact words it hangs on + why. Color never
 *  carries the verdict alone — the label text is always present. */
function FacetRow({ facet }: { facet: FacetFinding }) {
  const v = VERDICT[facet.verdict];
  return (
    <div className="flex items-baseline gap-2.5">
      <span
        aria-hidden
        className="mt-[3px] h-2 w-2 shrink-0 self-start rounded-full"
        style={{ background: v.color }}
      />
      <div className="min-w-0">
        <p className="text-[13px] leading-snug text-ink">
          {facet.span && (
            <span className="font-mono text-[12px]" style={{ color: v.color }}>
              &ldquo;{facet.span}&rdquo;{" "}
            </span>
          )}
          {facet.claim}
          <span
            className="ml-2 font-mono text-[10px] tracking-wider uppercase"
            style={{ color: v.color }}
          >
            {v.label}
          </span>
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-ink-secondary">
          {facet.note}
        </p>
      </div>
    </div>
  );
}

function EvidenceCard({
  evidence,
  order,
  findingIndex,
}: {
  evidence: Evidence;
  order: number;
  findingIndex: number;
}) {
  // Tool reports start collapsed — the summary is the finding, the raw pull
  // is the audit trail. Interview exchanges start open — the quote IS the
  // evidence.
  const isToolReport = evidence.kind === "crustdata" || evidence.kind === "github";
  const [open, setOpen] = useState(!isToolReport);
  const hasExcerpt = Boolean(evidence.excerpt);
  const clip = evidence.kind === "transcript" ? clipFor(findingIndex, order) : undefined;

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
            {clip && (
              <div className="mx-5 mb-3">
                <AudioClip src={clip} label="interview clip" />
              </div>
            )}
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


function StepButton({
  dir,
  onStep,
  label,
}: {
  dir: 1 | -1;
  onStep: (dir: 1 | -1) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onStep(dir)}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-secondary transition-colors hover:border-accent/60 hover:text-accent"
    >
      <span aria-hidden className="font-mono text-[13px] leading-none">
        {dir === 1 ? "\u2192" : "\u2190"}
      </span>
    </button>
  );
}
