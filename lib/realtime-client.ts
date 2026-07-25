"use client";

/**
 * Browser client for the OpenAI Realtime voice stack (WebRTC).
 *
 * Responsibilities: mint an ephemeral secret via our server, open the peer
 * connection + `oai-events` data channel, surface UI-relevant events, and
 * mirror transcript/tool activity into our engine via /api/session-sync.
 */

/** Batched debug shipper — everything lands in .debug/realtime.jsonl. */
const debugQueue: Record<string, unknown>[] = [];
let debugTimer: ReturnType<typeof setInterval> | null = null;
function dbg(kind: string, data: Record<string, unknown> = {}) {
  debugQueue.push({ kind, ...data });
  if (!debugTimer) {
    debugTimer = setInterval(() => {
      if (debugQueue.length === 0) return;
      const entries = debugQueue.splice(0, debugQueue.length);
      void fetch("/api/debug-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      }).catch(() => {});
    }, 1500);
  }
}

export type RealtimeCallbacks = {
  onPhase: (phase: "speaking" | "listening" | "thinking") => void;
  onAgentLine: (text: string) => void;
  onCandidateLine: (text: string) => void;
  onEnd: () => void;
  onError: (message: string) => void;
};

export type RealtimeHandle = {
  sessionId: string;
  stop: () => void;
};

type RtEvent = {
  type: string;
  transcript?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  error?: { message?: string };
};

export async function startRealtimeInterview(
  cb: RealtimeCallbacks,
): Promise<RealtimeHandle> {
  // 1. Server mints the ephemeral secret bound to a fresh interview session.
  dbg("lifecycle", { step: "minting" });
  const mint = await fetch("/api/realtime/session", { method: "POST" });
  if (!mint.ok) {
    const body = (await mint.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Could not start realtime session (${mint.status})`);
  }
  const { sessionId, clientSecret } = (await mint.json()) as {
    sessionId: string;
    clientSecret: string;
  };

  const sync = (payload: Record<string, unknown>) =>
    void fetch("/api/session-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, ...payload }),
    }).catch(() => {});

  // 2. WebRTC setup.
  dbg("lifecycle", { step: "minted", sessionId });
  const pc = new RTCPeerConnection();
  pc.onconnectionstatechange = () => dbg("webrtc", { state: pc.connectionState });
  const audioEl = new Audio();
  audioEl.autoplay = true;
  pc.ontrack = (e) => {
    audioEl.srcObject = e.streams[0];
  };

  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  for (const track of mic.getTracks()) pc.addTrack(track, mic);

  const dc = pc.createDataChannel("oai-events");
  const seenDeltaTypes = new Set<string>();

  const HANDLED = new Set([
    "input_audio_buffer.speech_started",
    "input_audio_buffer.speech_stopped",
    "conversation.item.input_audio_transcription.completed",
    "response.audio_transcript.delta",
    "response.output_audio_transcript.delta",
    "response.audio_transcript.done",
    "response.output_audio_transcript.done",
    "response.done",
    "response.function_call_arguments.done",
    "output_audio_buffer.started",
    "output_audio_buffer.stopped",
    "error",
  ]);

  dc.onmessage = (msg) => {
    let ev: RtEvent;
    try {
      ev = JSON.parse(msg.data) as RtEvent;
    } catch {
      dbg("unparseable", { raw: String(msg.data).slice(0, 300) });
      return;
    }

    // Deltas are noisy — log only their first occurrence per type.
    if (ev.type.endsWith(".delta")) {
      if (!seenDeltaTypes.has(ev.type)) {
        seenDeltaTypes.add(ev.type);
        dbg("event", { type: ev.type, first: true });
      }
    } else if (HANDLED.has(ev.type)) {
      dbg("event", { type: ev.type, transcript: ev.transcript?.slice(0, 120), name: ev.name, args: ev.arguments?.slice(0, 200), error: ev.error?.message });
    } else {
      dbg("UNHANDLED", { type: ev.type, raw: JSON.stringify(ev).slice(0, 400) });
    }

    switch (ev.type) {
      case "input_audio_buffer.speech_started":
        cb.onPhase("listening");
        break;
      case "input_audio_buffer.speech_stopped":
        cb.onPhase("thinking");
        break;
      case "conversation.item.input_audio_transcription.completed": {
        const text = (ev.transcript ?? "").trim();
        if (text) {
          cb.onCandidateLine(text);
          sync({ turns: [{ speaker: "candidate", text }] });
        }
        break;
      }
      case "response.audio_transcript.delta":
      case "response.output_audio_transcript.delta":
        cb.onPhase("speaking");
        break;
      case "response.audio_transcript.done":
      case "response.output_audio_transcript.done": {
        const text = (ev.transcript ?? "").trim();
        if (text) {
          cb.onAgentLine(text);
          sync({ turns: [{ speaker: "agent", text }] });
        }
        break;
      }
      case "output_audio_buffer.started":
        cb.onPhase("speaking");
        break;
      case "output_audio_buffer.stopped":
      case "response.done":
        cb.onPhase("listening");
        break;
      case "response.function_call_arguments.done": {
        // Tool call from the voice model → forward to our engine, ack back.
        let args: { bulletId?: string } = {};
        try {
          args = JSON.parse(ev.arguments ?? "{}");
        } catch {
          /* tolerate malformed args */
        }
        if (ev.name === "record_probe" && args.bulletId) {
          sync({ probeBulletId: args.bulletId });
        }
        if (ev.name === "end_interview") {
          sync({ end: true });
          // Give the goodbye audio a moment to finish playing out.
          setTimeout(() => cb.onEnd(), 3500);
        }
        dc.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: ev.call_id,
              output: JSON.stringify({ ok: true }),
            },
          }),
        );
        if (ev.name !== "end_interview") {
          dc.send(JSON.stringify({ type: "response.create" }));
        }
        break;
      }
      case "error":
        cb.onError(ev.error?.message ?? "Realtime session error");
        break;
    }
  };

  dc.onclose = () => dbg("lifecycle", { step: "datachannel closed" });
  dc.onopen = () => {
    dbg("lifecycle", { step: "datachannel open" });
    // Kick the model to open the conversation.
    dc.send(JSON.stringify({ type: "response.create" }));
    cb.onPhase("speaking");
  };

  // 3. SDP exchange with the ephemeral secret.
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls?model=gpt-realtime-2.1", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/sdp",
    },
    body: offer.sdp,
  });
  if (!sdpRes.ok) {
    dbg("lifecycle", { step: "sdp FAILED", status: sdpRes.status, body: (await sdpRes.text()).slice(0, 300) });
    pc.close();
    throw new Error(`Realtime connection failed (${sdpRes.status})`);
  }
  dbg("lifecycle", { step: "sdp ok" });
  await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });

  return {
    sessionId,
    stop: () => {
      for (const track of mic.getTracks()) track.stop();
      dc.close();
      pc.close();
      audioEl.srcObject = null;
    },
  };
}
