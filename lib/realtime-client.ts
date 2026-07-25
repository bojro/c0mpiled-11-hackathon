"use client";

/**
 * Browser client for the OpenAI Realtime voice stack (WebRTC).
 *
 * Responsibilities: mint an ephemeral secret via our server, open the peer
 * connection + `oai-events` data channel, surface UI-relevant events, and
 * mirror transcript/tool activity into our engine via /api/session-sync.
 */

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
  const pc = new RTCPeerConnection();
  const audioEl = new Audio();
  audioEl.autoplay = true;
  pc.ontrack = (e) => {
    audioEl.srcObject = e.streams[0];
  };

  const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  for (const track of mic.getTracks()) pc.addTrack(track, mic);

  const dc = pc.createDataChannel("oai-events");

  dc.onmessage = (msg) => {
    let ev: RtEvent;
    try {
      ev = JSON.parse(msg.data) as RtEvent;
    } catch {
      return;
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

  dc.onopen = () => {
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
    pc.close();
    throw new Error(`Realtime connection failed (${sdpRes.status})`);
  }
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
