"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { startRealtimeInterview, type RealtimeHandle } from "@/lib/realtime-client";

/**
 * The candidate's voice conversation — the OA.
 *
 * Browser-native end to end: SpeechSynthesis speaks the agent's questions,
 * webkitSpeechRecognition transcribes the candidate continuously. No vendor,
 * no keys, nothing that can die on venue wifi.
 *
 * State machine: idle → connecting → speaking (agent) → listening → thinking
 * → speaking … → done. Recognition is stopped while the agent talks so it
 * never hears itself.
 */

type Phase = "idle" | "connecting" | "speaking" | "listening" | "thinking" | "done" | "error";

type Line = { speaker: "agent" | "you"; text: string };

// Minimal typings for the vendor-prefixed API.
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
};

const SILENCE_MS = 2200; // pause length that ends the candidate's turn

export default function InterviewPage() {
  // Modes: default = OpenAI Realtime speech-to-speech. ?fallback=1 = the
  // browser-native STT/TTS loop. ?auto=1 = AI plays the candidate (uses the
  // native loop). The engine behind all three is identical.
  const [auto] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("auto"),
  );
  const [fallback] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("fallback"),
  );
  // ?resume=<id> — set by the apply flow after a real PDF parse. The interview
  // then runs against the uploaded résumé; without it, the seeded demo résumé.
  const [resumeId] = useState(
    () =>
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("resume")) ||
      undefined,
  );
  const realtime = !auto && !fallback;
  const rtRef = useRef<RealtimeHandle | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  // Whose résumé this conversation is about. Without an uploaded résumé the
  // seeded demo candidate runs — shown explicitly so a real applicant can
  // never mistake a demo session for their own.
  const [candidateName, setCandidateName] = useState<string | null>(
    resumeId ? null : "Ken Carson",
  );
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<string | null>(null);
  const linesRef = useRef<Line[]>([]);
  const pushLine = (l: Line) => {
    linesRef.current = [...linesRef.current, l];
    setLines(linesRef.current);
  };
  const recRef = useRef<Recognition | null>(null);
  const bufferRef = useRef(""); // finalized speech accumulated this turn
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const say = useCallback((text: string, onDone: () => void, role: "agent" | "candidate" = "agent") => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    // Free voice upgrade: macOS ships premium/enhanced neural voices — prefer
    // them when installed (System Settings → Spoken Content → add voices).
    const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
    const agentVoice =
      voices.find((v) => /premium/i.test(v.name)) ??
      voices.find((v) => /enhanced/i.test(v.name)) ??
      voices.find((v) => v.name === "Samantha") ??
      voices.find((v) => v.localService) ??
      null;
    // Candidate gets a distinct voice so the two sides are audibly different.
    const candidateVoice =
      voices.find((v) => v.name === "Daniel") ??
      voices.find((v) => /en-GB|en-AU/.test(v.lang) && v.localService) ??
      voices.find((v) => v !== agentVoice && v.localService) ??
      agentVoice;
    u.voice = role === "candidate" ? candidateVoice : agentVoice;
    u.onend = onDone;
    u.onerror = onDone; // never wedge the state machine on TTS failure
    speechSynthesis.speak(u);
  }, []);

  /** One round trip: send what the candidate said, speak the reply, listen again. */
  const advance = useCallback(
    async (said?: string) => {
      setPhase(said ? "thinking" : "connecting");
      try {
        const res = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionRef.current ?? undefined,
            said,
            // Only meaningful on the session-creating first call.
            resumeId,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Interview turn failed (${res.status})`);
        }
        const data = (await res.json()) as {
          sessionId: string;
          say: string;
          endInterview: boolean;
          resume?: { candidateName?: string };
        };
        sessionRef.current = data.sessionId;
        if (data.resume?.candidateName) setCandidateName(data.resume.candidateName);
        pushLine({ speaker: "agent", text: data.say });
        setPhase("speaking");
        say(data.say, () => {
          if (data.endInterview) {
            setPhase("done");
          } else if (auto) {
            void autoCandidateTurn();
          } else {
            startListening();
          }
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setPhase("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [say],
  );

  const endTurn = useCallback(() => {
    const text = bufferRef.current.trim();
    bufferRef.current = "";
    setInterim("");
    recRef.current?.stop();
    if (text) {
      pushLine({ speaker: "you", text });
      void advance(text);
    } else {
      // Heard nothing — go back to listening rather than sending air.
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advance]);

  /** Demo mode: fetch the AI candidate's reply, speak it, hand back to the agent. */
  const autoCandidateTurn = useCallback(async () => {
    setPhase("listening"); // green orb = candidate side active
    try {
      const res = await fetch("/api/dev/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: linesRef.current.map((l) => ({ speaker: l.speaker === "agent" ? "agent" : "candidate", text: l.text })) }),
      });
      if (!res.ok) throw new Error(`candidate turn failed (${res.status})`);
      const data = (await res.json()) as { say: string };
      pushLine({ speaker: "you", text: data.say });
      say(data.say, () => void advance(data.say), "candidate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "demo candidate failed");
      setPhase("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advance, say]);

  const startRealtime = useCallback(async () => {
    setPhase("connecting");
    try {
      rtRef.current = await startRealtimeInterview({
        onPhase: (p) => setPhase(p),
        onAgentLine: (text) => pushLine({ speaker: "agent", text }),
        onCandidateLine: (text) => pushLine({ speaker: "you", text }),
        onEnd: () => {
          rtRef.current?.stop();
          setPhase("done");
        },
        onError: (m) => {
          setError(m);
          setPhase("error");
        },
      }, { resumeId });
      sessionRef.current = rtRef.current.sessionId;
      if (rtRef.current.candidateName) setCandidateName(rtRef.current.candidateName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Realtime connection failed.");
      setPhase("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => Recognition;
      SpeechRecognition?: new () => Recognition;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Speech recognition needs Chrome. Open this page in Chrome to continue.");
      setPhase("error");
      return;
    }
    const rec = new Ctor();
    recRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) bufferRef.current += r[0].transcript + " ";
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        if (phaseRef.current === "listening") endTurn();
      }, SILENCE_MS);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        setError("Microphone permission was denied — allow it and reload.");
        setPhase("error");
      }
      // "no-speech" etc.: onend will fire; we restart from the silence timer.
    };
    rec.onend = () => {
      // Chrome ends sessions on its own schedule; if we're still supposed to
      // be listening and have nothing buffered, quietly restart.
      if (phaseRef.current === "listening" && !bufferRef.current.trim()) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };

    setPhase("listening");
    try {
      rec.start();
    } catch {
      /* double-start guard */
    }
  }, [endTurn]);

  // Voices load async in Chrome; warm them so the first utterance isn't robotic-default.
  useEffect(() => {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    return () => {
      speechSynthesis.cancel();
      recRef.current?.stop();
      rtRef.current?.stop();
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, []);

  const orbClass =
    phase === "speaking"
      ? "scale-110 border-accent bg-accent-dim shadow-[0_0_60px_rgba(96,165,250,0.35)]"
      : phase === "listening"
        ? "scale-100 border-v-green/70 bg-v-green-dim shadow-[0_0_60px_rgba(52,211,153,0.25)]"
        : phase === "thinking" || phase === "connecting"
          ? "scale-95 border-line-strong animate-pulse"
          : "scale-100 border-line-strong";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-8 py-4">
        <span className="font-mono text-sm font-medium tracking-widest text-ink uppercase">
          Debrief
        </span>
        <span className="font-mono text-xs text-ink-muted">
          {candidateName ?? "your conversation"}
          {!resumeId && " · demo résumé"}
          {resumeId && candidateName && " · your conversation"}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-8 py-10">
        {/* The orb */}
        <div
          className={`mt-4 flex h-36 w-36 items-center justify-center rounded-full border-2 transition-all duration-500 ${orbClass}`}
        >
          <span className="font-mono text-[11px] tracking-widest text-ink-secondary uppercase">
            {phase === "idle" && "ready"}
            {phase === "connecting" && "starting"}
            {phase === "speaking" && "speaking"}
            {phase === "listening" && (auto ? "candidate" : "listening")}
            {phase === "thinking" && "thinking"}
            {phase === "done" && "complete"}
            {phase === "error" && "error"}
          </span>
        </div>

        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 text-center"
          >
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              A conversation about your work
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
              Ten minutes, voice to voice. No trick questions and no timer —
              this is the space a résumé doesn&apos;t give you. Speak normally;
              pause when you&apos;re done and I&apos;ll pick up from there.
            </p>
            <button
              onClick={() => (realtime ? void startRealtime() : void advance())}
              className="mt-8 rounded-md border border-accent/60 bg-accent-dim px-6 py-2.5 font-mono text-sm text-accent transition-colors hover:bg-accent/20"
            >
              {auto ? "Run demo interview →" : "Begin →"}
            </button>
            {auto && (
              <p className="mt-3 font-mono text-[10.5px] text-ink-muted">
                demo mode — an AI plays the candidate, both voices live
              </p>
            )}
            {realtime && (
              <p className="mt-3 font-mono text-[10.5px] text-ink-muted">
                speech-to-speech · gpt-realtime carries the voice, claude runs the investigation
              </p>
            )}
            {!auto && !resumeId && (
              <p className="mt-2 font-mono text-[10.5px] text-ink-muted">
                no application attached — this interviews the demo résumé (Ken
                Carson).{" "}
                <a href="/apply" className="text-accent hover:underline">
                  apply with yours
                </a>
              </p>
            )}
          </motion.div>
        )}

        {phase === "error" && (
          <div className="mt-10 max-w-md rounded-lg border border-v-red/40 bg-v-red-dim p-5 text-center">
            <p className="text-sm leading-relaxed text-ink">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 font-mono text-xs text-accent hover:underline"
            >
              reload and retry
            </button>
            {resumeId && (
              <a
                href="/apply"
                className="mt-2 block font-mono text-xs text-accent hover:underline"
              >
                apply again with your résumé
              </a>
            )}
          </div>
        )}

        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 text-center"
          >
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              That&apos;s everything — thank you.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
              Your conversation and the verification checks go to the hiring
              team as one report. A human reads it and makes every decision.
            </p>
          </motion.div>
        )}

        {/* Live conversation feed */}
        {lines.length > 0 && phase !== "done" && (
          <div className="mt-10 flex w-full flex-col gap-3">
            <AnimatePresence initial={false}>
              {lines.slice(-4).map((l, i) => (
                <motion.div
                  key={`${lines.length}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <span
                    className={`w-14 shrink-0 pt-px text-right font-mono text-[10px] tracking-wide uppercase ${
                      l.speaker === "agent" ? "text-accent" : "text-v-green"
                    }`}
                  >
                    {l.speaker === "agent"
                      ? "Debrief"
                      : auto
                        ? (candidateName?.split(" ")[0] ?? "AI")
                        : "You"}
                  </span>
                  <p className="text-[13.5px] leading-relaxed text-ink">{l.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {interim && (
              <div className="flex gap-3">
                <span className="w-14 shrink-0 pt-px text-right font-mono text-[10px] tracking-wide text-v-green/60 uppercase">
                  You
                </span>
                <p className="text-[13.5px] leading-relaxed text-ink-muted italic">
                  {interim}…
                </p>
              </div>
            )}
          </div>
        )}

        {(phase === "listening" || phase === "thinking" || phase === "speaking") && (
          <button
            onClick={() => {
              recRef.current?.stop();
              rtRef.current?.stop();
              speechSynthesis.cancel();
              setPhase("done");
            }}
            className="mt-auto pt-8 font-mono text-[11px] text-ink-muted transition-colors hover:text-ink-secondary"
          >
            end conversation
          </button>
        )}
      </main>
    </div>
  );
}
