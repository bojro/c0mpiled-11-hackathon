"use client";

import type { BulletFinding, Verdict } from "@/lib/schema";
import type { ResumeDocument } from "@/data/resume";
import { VERDICT } from "./verdict";

/**
 * The résumé rendered as the paper document it is — a white sheet in the dark
 * console, set in serif like the PDF the candidate actually submitted.
 *
 * Interrogated claims carry a highlighter stroke in their verdict color and
 * are clickable; everything else is untouched document text. The metaphor is
 * a recruiter's marked-up printout, not an app screen.
 */

/** Highlighter fills tuned for white paper (the dark-surface --v-*-dim tokens
 *  are too faint here). Text stays near-black on all of them. */
const HIGHLIGHT: Record<Verdict, { fill: string; hover: string }> = {
  green: { fill: "rgba(52, 211, 153, 0.28)", hover: "rgba(52, 211, 153, 0.42)" },
  yellow: { fill: "rgba(252, 211, 77, 0.38)", hover: "rgba(252, 211, 77, 0.55)" },
  red: { fill: "rgba(248, 113, 113, 0.30)", hover: "rgba(248, 113, 113, 0.45)" },
  unverified: { fill: "rgba(156, 163, 175, 0.30)", hover: "rgba(156, 163, 175, 0.45)" },
};

/** Small ink-on-paper tag colors for the verdict label under a selected bullet. */
const TAG_INK: Record<Verdict, string> = {
  green: "#047857",
  yellow: "#92400e",
  red: "#b91c1c",
  unverified: "#4b5563",
};

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
    <div
      className="rounded-sm bg-[#fdfdfb] px-10 py-9 text-[#1a1a1a] shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_18px_50px_rgba(0,0,0,0.55)]"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* Document header — centered, like the PDF */}
      <div className="text-center">
        <h1 className="text-[22px] font-bold tracking-tight">{doc.name}</h1>
        <p className="mt-1 text-[11px] text-[#444]">{doc.contact}</p>
      </div>

      {doc.sections.map((section) => (
        <section key={section.heading} className="mt-5">
          <h2 className="border-b border-[#1a1a1a] pb-0.5 text-[13px] font-bold">
            {section.heading}
          </h2>

          {section.entries.map((entry) => (
            <div key={entry.org + (entry.dates ?? "")} className="mt-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12.5px] font-bold">{entry.org}</p>
                {entry.location && (
                  <p className="shrink-0 text-[12.5px] font-bold">{entry.location}</p>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-3">
                {entry.title && (
                  <p className="text-[12px] italic">{entry.title}</p>
                )}
                {entry.dates && (
                  <p className="shrink-0 text-[12px] italic">{entry.dates}</p>
                )}
              </div>

              {entry.bullets.length > 0 && (
                <ul className="mt-1 flex flex-col gap-[3px]">
                  {entry.bullets.map((text) => {
                    const fi = findingByText.get(text);
                    return (
                      <li key={text.slice(0, 40)} className="flex gap-2 pl-3">
                        <span className="text-[10px] leading-[1.85]">●</span>
                        {fi === undefined ? (
                          <p className="text-[12px] leading-relaxed">{text}</p>
                        ) : (
                          <HighlightedBullet
                            text={text}
                            finding={findings[fi]}
                            isSelected={fi === selected}
                            onClick={() => onSelect(fi)}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </section>
      ))}

      {/* Skills */}
      <section className="mt-5">
        <h2 className="border-b border-[#1a1a1a] pb-0.5 text-[13px] font-bold">
          Technical Skills
        </h2>
        {doc.skills.map((s) => (
          <p key={s.label} className="mt-1 text-[12px] leading-relaxed">
            <span className="font-bold">{s.label}: </span>
            {s.items}
          </p>
        ))}
      </section>
    </div>
  );
}

function HighlightedBullet({
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
  const h = HIGHLIGHT[finding.verdict];
  const v = VERDICT[finding.verdict];

  return (
    <div className="min-w-0">
      <button
        onClick={onClick}
        aria-current={isSelected}
        className="group relative cursor-pointer text-left"
      >
        {/* The highlighter stroke: slightly ragged box-decoration so wrapped
            lines each carry their own stroke, like a real highlighter pass */}
        <span
          className="text-[12px] leading-relaxed transition-[background-color] duration-150"
          style={{
            background: isSelected ? h.hover : h.fill,
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
            padding: "1px 3px",
            margin: "-1px -3px",
            borderRadius: "2px",
            boxShadow: isSelected ? `0 0 0 1.5px var(--accent)` : undefined,
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.background = h.hover;
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.background = h.fill;
          }}
        >
          {text}
        </span>
      </button>

      {/* Margin note: verdict label in pen-on-paper ink */}
      <p
        className="mt-0.5 font-mono text-[9.5px] tracking-wide uppercase"
        style={{ color: TAG_INK[finding.verdict] }}
      >
        {v.label}
        {isSelected ? " — showing evidence →" : ""}
      </p>
    </div>
  );
}
