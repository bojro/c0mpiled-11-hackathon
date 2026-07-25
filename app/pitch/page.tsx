"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

/**
 * The pitch deck, as part of the product. ←/→ or click to advance.
 * Structure per hackathon-winning form: emotional hook first, narrative arc,
 * cut to the live demo early, close on why-now + what's real.
 */

type Slide = {
  kicker?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  footer?: string;
};

function Highlight({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-[3px] px-1.5 text-[#111]"
      style={{ background: color, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
    >
      {children}
    </span>
  );
}

const SLIDES: Slide[] = [
  {
    // 1 — the hook: make them feel the problem in one beat
    title: (
      <>
        Every résumé you received today
        <br />
        <Highlight color="rgba(248,113,113,0.85)">passed the filter.</Highlight>
      </>
    ),
    body: (
      <p>
        Because the filter reads keywords — and now everyone has the same
        keyword machine. The résumé stopped being signal the day everyone could
        generate one.
      </p>
    ),
  },
  {
    // 2 — the human cost, both sides
    kicker: "the real casualty",
    title: (
      <>
        The honest builder loses to
        <br />
        confident fiction.
      </>
    ),
    body: (
      <p>
        A founder at midnight, 400 applications deep, can&apos;t tell the
        engineer who fought a production fire from the one who watched it on
        Slack. Both bullets read the same. Only one person can{" "}
        <em>talk about it for five minutes.</em>
      </p>
    ),
  },
  {
    // 3 — the turn
    kicker: "debrief",
    title: (
      <>
        Move screening from what you wrote
        <br />
        to what you can{" "}
        <Highlight color="rgba(52,211,153,0.85)">defend out loud.</Highlight>
      </>
    ),
    body: (
      <p>
        An agent interviews every applicant the way an Amazon Bar Raiser would —
        probes one claim five levels deep, separates &ldquo;I&rdquo; from
        &ldquo;we&rdquo;, and watches the story for drift. While you talk, it
        verifies you against employment records and GitHub.
      </p>
    ),
  },
  {
    // 4 — the artifact (cut to live demo here)
    kicker: "the report is the résumé",
    title: (
      <>
        The recruiter gets the résumé back —
        <br />
        <Highlight color="rgba(252,211,77,0.85)">marked up with evidence.</Highlight>
      </>
    ),
    body: (
      <p>
        Green survived questioning. Yellow was honest about its limits. Red
        collapsed under follow-up. Every stroke opens to the exact exchange —
        with audio — and the raw record pulls behind it.{" "}
        <span className="text-ink-muted">[cut to live demo]</span>
      </p>
    ),
    footer: "informs, never decides — a human makes every call",
  },
  {
    // 5 — why now
    kicker: "why now",
    title: <>This product couldn&apos;t exist 18 months ago.</>,
    body: (
      <ul className="flex flex-col gap-3 text-left">
        <li>— LLMs killed the keyword screen: every applicant passes now.</li>
        <li>— Voice AI became cheap enough to interview at application volume.</li>
        <li>
          — Startups drown first: no recruiting team, and Workday was never
          built for them. That&apos;s the wedge.
        </li>
      </ul>
    ),
  },
  {
    // 6 — what's real, tonight
    kicker: "built tonight, live tonight",
    title: <>Everything you just saw ran for real.</>,
    body: (
      <ul className="flex flex-col gap-3 text-left">
        <li>
          — Speech-to-speech interview on gpt-realtime; Claude runs the
          investigation and writes the report
        </li>
        <li>
          — Live verification against GitHub and CrustData during the
          conversation
        </li>
        <li>
          — Full pipeline: apply → checks → voice interview → evidence report,
          plus an HR console across ten candidates
        </li>
      </ul>
    ),
    footer: "github.com/bojro/c0mpiled-11-hackathon",
  },
  {
    // 7 — close
    title: (
      <>
        The résumé is dead.
        <br />
        <Highlight color="rgba(96,165,250,0.85)">
          The conversation is the new résumé.
        </Highlight>
      </>
    ),
    body: <p className="font-mono text-base tracking-widest uppercase">Debrief</p>,
  },
];

export default function PitchPage() {
  const [i, setI] = useState(0);

  const step = useCallback(
    (d: 1 | -1) => setI((s) => Math.min(SLIDES.length - 1, Math.max(0, s + d))),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const s = SLIDES[i];

  return (
    <div
      className="flex min-h-screen cursor-pointer flex-col"
      onClick={() => step(1)}
    >
      <header className="flex items-center justify-between px-8 py-4">
        <span className="font-mono text-sm font-medium tracking-widest text-ink uppercase">
          Debrief
        </span>
        <span className="font-mono text-xs text-ink-muted">
          {i + 1} / {SLIDES.length}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-8 pb-24 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center gap-8"
          >
            {s.kicker && (
              <p className="font-mono text-[12px] tracking-[0.25em] text-accent uppercase">
                {s.kicker}
              </p>
            )}
            <h1 className="text-4xl leading-[1.25] font-semibold tracking-tight text-ink md:text-5xl md:leading-[1.25]">
              {s.title}
            </h1>
            {s.body && (
              <div className="max-w-2xl text-lg leading-relaxed text-ink-secondary">
                {s.body}
              </div>
            )}
            {s.footer && (
              <p className="font-mono text-[12px] text-ink-muted">{s.footer}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex items-center justify-between px-8 pb-6">
        <Link
          href="/"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-[11px] text-ink-muted hover:text-ink-secondary"
        >
          ← product
        </Link>
        <span className="font-mono text-[11px] text-ink-muted">
          ← → or click to advance
        </span>
      </footer>
    </div>
  );
}
