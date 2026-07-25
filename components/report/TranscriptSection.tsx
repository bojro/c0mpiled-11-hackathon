"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TranscriptTurn } from "@/lib/schema";
import { FULL_AUDIO } from "@/data/audio-map";
import { AudioClip } from "./AudioClip";

/**
 * Full interview record: one player for the whole conversation, the turns
 * laid out as a clean two-voice script. Collapsed by default — the findings
 * are the product; this is the primary source behind them.
 */
export function TranscriptSection({ transcript }: { transcript: TranscriptTurn[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 p-5">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="text-left"
        >
          <p className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">
            Full interview
          </p>
          <p className="mt-1 text-sm text-ink-secondary">
            {transcript.length} turns · complete recording and transcript
            <span className="ml-2 font-mono text-[10.5px] text-accent">
              {open ? "− collapse" : "+ expand"}
            </span>
          </p>
        </button>
        <div className="w-64 shrink-0">
          <AudioClip src={FULL_AUDIO} label="full interview" />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-line p-6">
              {transcript.map((t, i) => (
                <div key={i} className="flex gap-4">
                  <span
                    className={`w-24 shrink-0 pt-px text-right font-mono text-[10.5px] tracking-wide uppercase ${
                      t.speaker === "agent" ? "text-accent" : "text-ink-muted"
                    }`}
                  >
                    {t.speaker === "agent" ? "Debrief" : "Candidate"}
                  </span>
                  <p className="text-[13px] leading-relaxed text-ink">{t.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
