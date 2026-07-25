"use client";

import { motion } from "motion/react";
import type { BulletFinding } from "@/lib/schema";
import type { ResumeDocument } from "@/data/resume";
import { VERDICT } from "./verdict";

/**
 * The résumé rendered as the document it is. Bullets the interview
 * interrogated are matched to findings by exact text and become clickable,
 * carrying their verdict; everything else is plain document text.
 *
 * This framing — the whole résumé, mostly quiet, with the investigated
 * claims lit up — is the product in one screen.
 */
export function ResumeDoc({
  doc,
  findings,
  selected,
  onSelect,
}: {
  doc: ResumeDocument;
  findings: BulletFinding[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const findingByText = new Map(findings.map((f, i) => [f.bulletText, i]));

  return (
    <div className="rounded-xl border border-line bg-surface px-7 py-6">
      {/* Document header */}
      <div className="border-b border-line pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {doc.name}
        </h1>
        <p className="mt-1 font-mono text-[11px] text-ink-muted">
          {doc.contact}
        </p>
      </div>

      {doc.sections.map((section) => (
        <section key={section.heading} className="mt-5">
          <h2 className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">
            {section.heading}
          </h2>

          {section.entries.map((entry) => (
            <div key={entry.org + (entry.dates ?? "")} className="mt-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-medium text-ink">
                  {entry.org}
                  {entry.title && (
                    <span className="ml-2 font-normal text-ink-secondary">
                      {entry.title}
                    </span>
                  )}
                </p>
                <p className="shrink-0 font-mono text-[10.5px] text-ink-muted">
                  {entry.dates}
                </p>
              </div>

              {entry.bullets.length > 0 && (
                <ul className="mt-1.5 flex flex-col gap-1">
                  {entry.bullets.map((text) => {
                    const fi = findingByText.get(text);
                    return fi === undefined ? (
                      <li
                        key={text.slice(0, 40)}
                        className="pl-3 text-[12.5px] leading-relaxed text-ink-muted"
                      >
                        {text}
                      </li>
                    ) : (
                      <InterrogatedBullet
                        key={text.slice(0, 40)}
                        text={text}
                        finding={findings[fi]}
                        isSelected={fi === selected}
                        onClick={() => onSelect(fi)}
                      />
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </section>
      ))}

      {/* Skills */}
      <section className="mt-5 border-t border-line pt-4">
        <h2 className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">
          Technical Skills
        </h2>
        {doc.skills.map((s) => (
          <p key={s.label} className="mt-1.5 text-[12px] leading-relaxed">
            <span className="text-ink-secondary">{s.label}: </span>
            <span className="text-ink-muted">{s.items}</span>
          </p>
        ))}
      </section>
    </div>
  );
}

function InterrogatedBullet({
  text,
  finding,
  isSelected,
  onClick,
}: {
  text: string;
  finding: BulletFinding;
  isSelected: boolean;
  onClick: () => void;
}) {
  const v = VERDICT[finding.verdict];

  return (
    <motion.li layout="position">
      <button
        onClick={onClick}
        aria-current={isSelected}
        className={`group relative w-full rounded-md border py-2 pr-3 pl-3 text-left transition-colors duration-150 ${
          isSelected
            ? "border-accent/60 bg-surface-raised"
            : "border-transparent hover:border-line-strong hover:bg-surface-raised"
        }`}
      >
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full"
          style={{ background: v.color }}
        />
        <p className="pl-2.5 text-[12.5px] leading-relaxed text-ink">{text}</p>
        <div className="mt-1.5 flex items-center gap-2.5 pl-2.5">
          <span
            className="rounded px-1.5 py-px font-mono text-[10.5px]"
            style={{ color: v.color, background: v.dim }}
          >
            {v.label}
          </span>
          <span className="font-mono text-[10.5px] text-ink-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {isSelected ? "showing evidence →" : "view evidence →"}
          </span>
        </div>
      </button>
    </motion.li>
  );
}
