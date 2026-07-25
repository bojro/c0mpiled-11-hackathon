"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { MOCK_REPORT } from "@/data/mock-report";
import { RESUME_DOC } from "@/data/resume";
import { CountsStrip } from "@/components/report/CountsStrip";
import { ResumeDoc } from "@/components/report/ResumeDoc";
import { EvidencePanel } from "@/components/report/EvidencePanel";
import { TranscriptSection } from "@/components/report/TranscriptSection";

/**
 * The recruiter console. Paper résumé left, evidence right; ←/→ (or the
 * on-screen arrows) walk annotation by annotation.
 *
 * Currently reads MOCK_REPORT; swap for POST /api/report once the live
 * pipeline is proven. The component tree doesn't change.
 */
export default function ReportPage() {
  const report = MOCK_REPORT;
  const total = report.findings.length;
  const [selected, setSelected] = useState(0);

  const step = useCallback(
    (dir: 1 | -1) => setSelected((s) => (s + dir + total) % total),
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  return (
    <div className="flex min-h-screen flex-col">
      <CountsStrip report={report} />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-[minmax(0,11fr)_minmax(0,9fr)] gap-8 px-8 py-8">
        <ResumeDoc
          doc={RESUME_DOC}
          findings={report.findings}
          selected={selected}
          onSelect={setSelected}
        />
        <div className="min-w-0">
          <div className="sticky top-6">
            <EvidencePanel
              finding={report.findings[selected]}
              index={selected}
              total={total}
              onStep={step}
            />
          </div>
        </div>
      </main>

      {/* Primary sources + summary below the findings — deliberate order. */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-8 pb-10"
      >
        <TranscriptSection transcript={report.transcript} />

        <div className="rounded-lg border border-line bg-surface p-6">
          <p className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">
            Interview summary
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-ink-secondary">
            {report.overallSummary}
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
