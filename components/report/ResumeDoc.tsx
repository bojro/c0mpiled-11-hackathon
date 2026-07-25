"use client";

import type { BulletFinding, Verdict } from "@/lib/schema";
import type { ResumeDocument } from "@/data/resume";
import { VERDICT } from "./verdict";

/**
 * The résumé rendered as the paper document it is — styled after Jake's
 * LaTeX template (small-caps section rules, bold-title/italic-company rows,
 * dense one-page spacing), which is what the submitted PDF is based on.
 *
 * Interrogated claims carry a highlighter stroke in their verdict color and
 * are clickable; everything else is untouched document text.
 */

const SERIF = `"CMU Serif", "Latin Modern Roman", "Computer Modern", Georgia, "Times New Roman", serif`;

/** Highlighter fills tuned for white paper. Text stays near-black on all. */
const HIGHLIGHT: Record<Verdict, { fill: string; hover: string }> = {
  green: { fill: "rgba(52, 211, 153, 0.28)", hover: "rgba(52, 211, 153, 0.42)" },
  yellow: { fill: "rgba(252, 211, 77, 0.38)", hover: "rgba(252, 211, 77, 0.55)" },
  red: { fill: "rgba(248, 113, 113, 0.30)", hover: "rgba(248, 113, 113, 0.45)" },
  unverified: { fill: "rgba(156, 163, 175, 0.30)", hover: "rgba(156, 163, 175, 0.45)" },
};

/** Pen-ink shades for the margin note under a highlighted bullet. */
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

  const renderBullets = (bullets: string[]) =>
    bullets.length === 0 ? null : (
      <ul className="mt-[3px] flex flex-col gap-[2px]">
        {bullets.map((text) => {
          const fi = findingByText.get(text);
          return (
            <li key={text.slice(0, 40)} className="flex gap-[7px] pl-[14px]">
              <span className="text-[7px] leading-[2.4]">•</span>
              {fi === undefined ? (
                <p className="text-[11.5px] leading-[1.45]">{text}</p>
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
    );

  return (
    <div
      className="rounded-[2px] bg-[#fdfdfb] px-11 py-8 text-[#111] shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_18px_50px_rgba(0,0,0,0.55)]"
      style={{ fontFamily: SERIF }}
    >
      {/* Name + pipe-separated contact line, centered — Jake's header */}
      <div className="text-center">
        <h1 className="text-[26px] font-bold tracking-[0.01em]">{doc.name}</h1>
        <p className="mt-[2px] text-[10.5px] text-[#333]">
          {doc.contact.split("·").map((part, i, arr) => (
            <span key={i}>
              <span className="underline decoration-[#999] underline-offset-2">
                {part.trim()}
              </span>
              {i < arr.length - 1 && <span className="mx-1.5 text-[#333]">|</span>}
            </span>
          ))}
        </p>
      </div>

      {doc.sections.map((section) => {
        const isExperience = section.heading === "Experience";
        const isProjects = section.heading === "Projects";
        return (
          <section key={section.heading} className="mt-[14px]">
            {/* Small-caps heading over a full-width rule — \titlerule */}
            <h2
              className="border-b border-[#111] pb-[1px] text-[12px] font-normal tracking-[0.06em]"
              style={{ fontVariant: "small-caps" }}
            >
              {section.heading.toLowerCase()}
            </h2>

            {section.entries.map((entry) => (
              <div key={entry.org + (entry.dates ?? "")} className="mt-[7px]">
                {isProjects ? (
                  /* Projects: "Name | Tech" left, dates right, one line */
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[11.5px]">
                      <span className="font-bold">{entry.org}</span>
                      {entry.title && (
                        <>
                          <span className="mx-1">|</span>
                          <span className="italic">{entry.title}</span>
                        </>
                      )}
                    </p>
                    {entry.dates && (
                      <p className="shrink-0 text-[11px] italic">{entry.dates}</p>
                    )}
                  </div>
                ) : isExperience ? (
                  /* Experience: title bold / dates; company italic / location */
                  <>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[12px] font-bold">{entry.title}</p>
                      {entry.dates && (
                        <p className="shrink-0 text-[11px]">{entry.dates}</p>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[11.5px] italic">{entry.org}</p>
                      {entry.location && (
                        <p className="shrink-0 text-[11px] italic">{entry.location}</p>
                      )}
                    </div>
                  </>
                ) : (
                  /* Education: institution bold / location; degree italic / dates */
                  <>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[12px] font-bold">{entry.org}</p>
                      {entry.location && (
                        <p className="shrink-0 text-[11px]">{entry.location}</p>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      {entry.title && (
                        <p className="text-[11.5px] italic">{entry.title}</p>
                      )}
                      {entry.dates && (
                        <p className="shrink-0 text-[11px] italic">{entry.dates}</p>
                      )}
                    </div>
                  </>
                )}

                {renderBullets(entry.bullets)}
              </div>
            ))}
          </section>
        );
      })}

      {/* Technical Skills — label bold, one dense block */}
      <section className="mt-[14px]">
        <h2
          className="border-b border-[#111] pb-[1px] text-[12px] font-normal tracking-[0.06em]"
          style={{ fontVariant: "small-caps" }}
        >
          technical skills
        </h2>
        <div className="mt-[5px] pl-[14px]">
          {doc.skills.map((s) => (
            <p key={s.label} className="text-[11.5px] leading-[1.5]">
              <span className="font-bold">{s.label}: </span>
              {s.items}
            </p>
          ))}
        </div>
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
        {/* Highlighter stroke, cloned across wrapped lines */}
        <span
          className="text-[11.5px] leading-[1.45] transition-[background-color] duration-150"
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

      {/* Margin note: verdict label in pen ink */}
      <p
        className="mt-[1px] font-mono text-[9px] tracking-wide uppercase"
        style={{ color: TAG_INK[finding.verdict] }}
      >
        {v.label}
        {isSelected ? " — showing evidence →" : ""}
      </p>
    </div>
  );
}
