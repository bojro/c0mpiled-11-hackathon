"use client";

import { motion } from "motion/react";
import type { BulletFinding } from "@/lib/schema";
import { OWNERSHIP, VERDICT } from "./verdict";

/**
 * Left column: the résumé as the interface. Bullets verbatim, verdict carried
 * by a left border + label, selection carried by the accent — never by a
 * verdict color, so judgment and navigation can't be confused.
 */
export function BulletList({
  findings,
  selected,
  onSelect,
}: {
  findings: BulletFinding[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  // Group consecutive findings by company so the left column reads like the
  // résumé it came from. Order is preserved from the report.
  const groups: { company: string; title: string; items: { f: BulletFinding; i: number }[] }[] = [];
  findings.forEach((f, i) => {
    const last = groups[groups.length - 1];
    if (last && last.company === f.company) {
      last.items.push({ f, i });
    } else {
      groups.push({ company: f.company, title: f.title, items: [{ f, i }] });
    }
  });

  return (
    <nav aria-label="Résumé bullets" className="flex flex-col gap-3">
      <p className="px-1 font-mono text-[11px] tracking-widest text-ink-muted uppercase">
        Résumé — as submitted
      </p>

      {groups.map((g) => (
        <div key={g.company} className="flex flex-col gap-3">
          <div className="mt-2 flex items-baseline gap-2 px-1 first:mt-0">
            <span className="text-[13px] font-medium text-ink">{g.company}</span>
            <span className="text-[12px] text-ink-muted">{g.title}</span>
          </div>
          {g.items.map(({ f, i }) => renderBullet(f, i))}
        </div>
      ))}
    </nav>
  );

  function renderBullet(f: BulletFinding, i: number) {
        const v = VERDICT[f.verdict];
        const isSelected = i === selected;
        return (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.09, duration: 0.4, ease: "easeOut" }}
            onClick={() => onSelect(i)}
            aria-current={isSelected}
            className={`group relative rounded-lg border bg-surface p-4 text-left transition-colors duration-150 ${
              isSelected
                ? "border-accent/60 bg-surface-raised"
                : "border-line hover:border-line-strong hover:bg-surface-raised"
            }`}
          >
            {/* Verdict border — status color, always paired with the label below */}
            <span
              aria-hidden
              className="absolute top-3 bottom-3 left-0 w-[3px] rounded-full"
              style={{ background: v.color }}
            />

            <p className="pl-3 text-[13.5px] leading-relaxed text-ink">
              {f.bulletText}
            </p>

            <div className="mt-3 flex items-center gap-3 pl-3">
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[11px]"
                style={{ color: v.color, background: v.dim }}
              >
                {v.label}
              </span>
              <span className="font-mono text-[11px] text-ink-muted">
                {OWNERSHIP[f.ownershipSignal]}
              </span>
            </div>
          </motion.button>
        );
  }
}
