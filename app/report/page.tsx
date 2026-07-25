"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { MOCK_REPORT } from "@/data/mock-report";
import { RESUME_DOC } from "@/data/resume";
import { CountsStrip } from "@/components/report/CountsStrip";
import { ResumeDoc } from "@/components/report/ResumeDoc";
import { EvidencePanel } from "@/components/report/EvidencePanel";

/**
 * The recruiter console. Split view: résumé left, evidence right.
 *
 * Currently reads MOCK_REPORT; swap for POST /api/report once the live
 * pipeline is proven. The component tree doesn't change.
 */
export default function ReportPage() {
  const report = MOCK_REPORT;
  const [selected, setSelected] = useState(0);

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
            <EvidencePanel finding={report.findings[selected]} index={selected} />
          </div>
        </div>
      </main>

      {/* Summary lives below the fold, after the findings — deliberate. */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-8 pb-10"
      >
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
