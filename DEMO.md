# Debrief — demo script & pitch

## The 60-second demo (record this path)

Screens in order. Total ~75s at a calm pace; cut the apply flow if trimming to 60.

| # | Screen | Do | Say |
|---|---|---|---|
| 1 | `/` pipeline | Let rows stagger in, hover Ken's row | "This is Debrief — it replaces the résumé keyword filter with an AI investigator. Ten candidates applied; four already have evidence-backed reports. No recruiter has done anything yet." |
| 2 | click Ken → `/report` | Pause one beat on the paper | "This is the candidate's actual résumé — and these highlights are what our agent found when it *interviewed him about it*." |
| 3 | arrow keys → | Step annotations 1→4 | "Green survived questioning. Yellow — the work is real, but the 20% number turned out to be his manager's estimate; he said so himself, and that honesty is *in* the report. Red — 'led the refactor' became 'I updated two endpoints' under follow-up." |
| 4 | red annotation | Play the audio clip (~10s) | "Every verdict is auditable — the recruiter can hear the exact exchange…" |
| 5 | expand a pulled report | Click "+ view pulled report" | "…and see the raw employment-records and GitHub pulls the agent ran on its own while the interview was still going." |
| 6 | `/apply` → `/status` | Let the tracker play through | "For the candidate it's Workday minus the forms: résumé in, checks run, and instead of a keyword filter — an invitation to actually talk about their work." |
| 7 | `/interview` | Say one answer live, show it respond | "The interview is a real conversation — voice to voice, follow-ups chosen live by the agent." |

## The one-liner

**"Résumés stopped being signal the day everyone could generate one. Debrief moves screening from what you wrote to what you can defend out loud — an agent interviews every applicant the way an Amazon Bar Raiser would, verifies claims against employment records and GitHub while they talk, and hands the recruiter a marked-up résumé where every highlight is backed by audio."**

## Why now (say this to Most Fundable judges)

- LLMs killed the résumé filter: every applicant passes the keyword screen now. The filter has to move from *text* to *defended claims*.
- Voice AI just got cheap and fast enough to do a real interview at application volume.
- Startups are the wedge: no recruiting team, drowning in AI-generated applications, and Workday/Greenhouse are built for enterprises. Land there, expand up.

## Judge Q&A — the answers we've already decided

**"Does it auto-reject?"** No, deliberately. Recruiting is high-stakes and rule-based filters get gamed; the agent investigates autonomously, a human decides. The autonomy is in the *investigation* — it picks its own probe targets, chooses follow-ups live, and dispatches its own verification calls mid-interview.

**"Isn't this hostile to candidates?"** It's the opposite of the current experience: no forms, no keyword lottery, and follow-up questions are the one chance a résumé never gives you. The yellow verdict is the proof — the candidate who was honest about his manager's estimate *looks better* in our report, not worse. And "unmarked" just means "not examined" — absence of evidence is never held against anyone.

**"Is the interrogation strategy a prompt you made up?"** It's the Amazon Bar Raiser / Google project-deep-dive protocol, automated: probe one claim 3–5 levels deep, separate "I" from "we", push on rejected alternatives, check consistency between answer 2 and answer 5. The consistency check is the computable part — the agent sees the whole transcript every turn.

**"What's real vs. mocked right now?"** The interview loop, the interviewer's live question selection, the report generation, and the GitHub pulls are real (live API, tested tonight). The demo report and its audio are seeded so judging doesn't depend on venue wifi. CrustData calls are wired and degrade to "unverified" without a key.

**"Why do you win vs. HireVue / paradox.ai?"** They score *how* you talk (tone, video) — we verify *what you claim*, and we show our work: every verdict expands to the transcript, audio, and raw record pulls behind it. An assessment you can audit is a different product from a score you have to trust.

**"Why not speech-to-speech?" (Will Bodewes suggested OpenAI Realtime — answer him directly):** "You're right, and that's the production plan. The voice layer is deliberately pluggable — tonight it's browser-native so nothing can die on venue wifi, and the swap-in is OpenAI Realtime, Gemini Live, or a Phonely-style stack. What doesn't change is the part we actually built: the interviewer's interrogation strategy, the live verification tools, and the evidence report. Speech-to-speech makes it *sound* human; the investigation is what makes it worth listening to."

**Tech (Jeff An / Random Labs / Superset will ask):** Next.js 16 + Claude Opus 5 (Haiku for dev loop), three call shapes — low-effort conversational turns, a tool-runner agentic loop for verification (GitHub + CrustData as tools), high-effort structured output for the report. Browser-native voice: zero vendors, can't die on wifi. Verdict palette is CVD-validated (ΔE 9.6 worst-pair, deutan) — checked computationally, not by eye.

## Pre-demo checklist

- [ ] `MODEL_TIER=demo` in `.env.local` (Opus for the live loop), restart dev server
- [ ] Chrome, mic permission pre-granted on `/interview`
- [ ] Volume up for the audio clip beat
- [ ] Record the golden path once as a fallback before any live run
