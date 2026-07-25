"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  PIPELINE,
  PIPELINE_ROLE,
  STAGE_LABEL,
  type PipelineCandidate,
  type Stage,
} from "@/data/pipeline";
import { VERDICT, VERDICT_ORDER } from "@/components/report/verdict";

/**
 * The HR pipeline — where the demo opens. One row per candidate; rows with a
 * finished report carry a stacked verdict bar. Ken's row opens the full report.
 */
export default function PipelinePage() {
  const reportsReady = PIPELINE.filter((c) => c.stage === "report").length;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line px-8 py-4">
        <div className="flex items-baseline gap-6">
          <span className="font-mono text-sm font-medium tracking-widest text-ink uppercase">
            Debrief
          </span>
          <span className="text-sm text-ink-secondary">
            Pipeline
            <span className="mx-2 text-ink-muted">·</span>
            {PIPELINE_ROLE}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-mono text-xs text-ink-muted">
            {PIPELINE.length} candidates · {reportsReady} reports ready
          </span>
          <Link
            href="/apply"
            className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
          >
            Candidate view →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-8">
        {/* Column header */}
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,3fr)_minmax(0,5fr)_auto] items-center gap-4 border-b border-line px-4 pb-2">
          {["Candidate", "Stage", "Verdicts", "Top signal", ""].map((h, i) => (
            <span
              key={i}
              className="font-mono text-[10.5px] tracking-widest text-ink-muted uppercase"
            >
              {h}
            </span>
          ))}
        </div>

        {PIPELINE.map((c, i) => (
          <Row key={c.name} candidate={c} order={i} />
        ))}
      </main>
    </div>
  );
}

function Row({ candidate: c, order }: { candidate: PipelineCandidate; order: number }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + order * 0.05, duration: 0.35, ease: "easeOut" }}
      className={`grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,3fr)_minmax(0,5fr)_auto] items-center gap-4 border-b border-line px-4 py-3.5 transition-colors ${
        c.reportHref ? "cursor-pointer hover:bg-surface-raised" : ""
      }`}
    >
      {/* Name + applied time */}
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-medium text-ink">{c.name}</p>
        <p className="mt-0.5 font-mono text-[10.5px] text-ink-muted">
          applied {c.appliedAgo}
        </p>
      </div>

      <StageChip stage={c.stage} />

      {/* Verdict bar */}
      {c.verdicts ? (
        <VerdictBar verdicts={c.verdicts} />
      ) : (
        <span className="font-mono text-[11px] text-ink-muted">—</span>
      )}

      <p className="truncate text-[12.5px] text-ink-secondary">{c.topSignal}</p>

      <span
        className={`font-mono text-[11px] ${
          c.reportHref ? "text-accent" : "text-transparent"
        }`}
      >
        open →
      </span>
    </motion.div>
  );

  return c.reportHref ? (
    <Link href={c.reportHref}>{inner}</Link>
  ) : (
    inner
  );
}

function StageChip({ stage }: { stage: Stage }) {
  const done = stage === "report";
  const active = stage === "interview" || stage === "screening";
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          done ? "bg-accent" : active ? "animate-pulse bg-accent/60" : "bg-line-strong"
        }`}
      />
      <span
        className={`font-mono text-[11px] ${done ? "text-ink" : "text-ink-secondary"}`}
      >
        {STAGE_LABEL[stage]}
      </span>
    </span>
  );
}

/** Stacked bar: one segment per verdict, width proportional to count,
 *  2px gaps between fills, counts printed beside it — never color alone. */
function VerdictBar({
  verdicts,
}: {
  verdicts: NonNullable<PipelineCandidate["verdicts"]>;
}) {
  const total = VERDICT_ORDER.reduce((s, v) => s + verdicts[v], 0);
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-2 w-24 gap-[2px] overflow-hidden rounded-full">
        {VERDICT_ORDER.filter((v) => verdicts[v] > 0).map((v) => (
          <span
            key={v}
            className="h-full rounded-[1px]"
            style={{
              background: VERDICT[v].color,
              width: `${(verdicts[v] / total) * 100}%`,
            }}
          />
        ))}
      </div>
      <span className="font-mono text-[11px] tabular-nums text-ink-muted">
        {VERDICT_ORDER.map((v) => verdicts[v]).join("·")}
      </span>
    </div>
  );
}
