"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Minimal audio player chip: play/pause, elapsed/total, thin progress line.
 * One global element per chip; pausing others is handled by the browser only
 * if we do it — so we stop siblings via a module-level registry.
 */

const players = new Set<HTMLAudioElement>();

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function AudioClip({ src, label = "clip" }: { src: string; label?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = new Audio(src);
    ref.current = el;
    players.add(el);
    el.preload = "metadata";
    el.onloadedmetadata = () => setDuration(el.duration);
    el.ontimeupdate = () => setTime(el.currentTime);
    el.onended = () => setPlaying(false);
    el.onpause = () => setPlaying(false);
    el.onplay = () => setPlaying(true);
    return () => {
      el.pause();
      players.delete(el);
      ref.current = null;
    };
  }, [src]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      // Stop anything else that's talking.
      players.forEach((p) => p !== el && p.pause());
      void el.play();
    } else {
      el.pause();
    }
  };

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface-raised px-3 py-2">
      <button
        onClick={toggle}
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/50 text-accent transition-colors hover:bg-accent-dim"
      >
        {playing ? (
          <span className="flex gap-[3px]" aria-hidden>
            <span className="h-2.5 w-[3px] bg-current" />
            <span className="h-2.5 w-[3px] bg-current" />
          </span>
        ) : (
          <span
            aria-hidden
            className="ml-[2px] border-y-[5px] border-l-[8px] border-y-transparent border-l-current"
          />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-accent transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-muted">
        {fmt(time)} / {fmt(duration)}
      </span>
    </div>
  );
}
