# Debrief

**Résumés stopped being signal the day everyone could generate one.** Debrief moves
screening from *what you wrote* to *what you can defend out loud* — an AI agent
interviews every applicant the way an Amazon Bar Raiser would, verifies claims
against employment records and GitHub while they talk, and hands the recruiter a
marked-up résumé where every highlight is backed by audio.

Built solo-ish in ~3 hours at **c0mpiled-11** (Startup School Hackathon, SF) for
the YC RFS *SaaS Challengers* track: an AI-native replacement for the
Workday-shaped résumé filter.

## What it does

- **Candidates apply with a résumé, not forms** (`/apply`), track a Workday-style
  pipeline (`/status`), and get invited to a ~10-minute **voice conversation**
  (`/interview`) — browser-native STT/TTS, no vendors, real follow-ups chosen
  live by the agent.
- **The agent interrogates like a Bar Raiser**: picks 2–3 claims worth attacking,
  probes each 3–5 levels deep, separates "I" from "we", pushes on rejected
  alternatives, and checks the story for drift between answer 2 and answer 5.
- **It investigates while you talk**: a tool-running agent loop pulls GitHub
  activity and employment records (CrustData) for the claims under discussion,
  concurrent with the interview.
- **Recruiters get the résumé itself as the report** (`/report`): the actual
  one-page document with highlighter strokes — green (substantiated), yellow
  (narrower than phrased), red (didn't hold up). Every stroke opens to the
  exact exchange, playable audio, and the raw record pulls. Unmarked bullets
  simply weren't examined — absence of evidence is never held against anyone.
- **It informs; a human decides.** Deliberately no auto-reject: the autonomy is
  in the investigation, not the judgment.

## Run it

```bash
npm install
cp .env.local.example .env.local   # add ANTHROPIC_API_KEY (GitHub/CrustData keys optional)
npm run dev
```

- `/` — HR pipeline (mock candidates; Ken's row opens the real report view)
- `/report` — the marked-up résumé console (seeded demo data + synthesized audio)
- `/apply` → `/status` → `/interview` — the candidate journey; the interview loop
  is live against the Claude API
- `MODEL_TIER=demo` switches from Haiku (dev) to Opus 5 (demo)

## How it's built

Next.js 16 · React 19 · Tailwind 4 · `motion` · Claude Opus 5 / Haiku 4.5.
Three call shapes: low-effort conversational turns, a tool-runner agentic loop
for verification (GitHub + CrustData as tools, honest degradation to
"unverified"), and high-effort structured output for the schema-guaranteed
report. Voice is browser-native Web Speech — nothing that can die on venue wifi.
Verdict colors are CVD-validated against the dark surface (worst adjacent pair
ΔE 9.6 under deutan simulation) and never appear without a text label.

*Demo résumé is an anonymized real résumé used with permission; demo audio is
synthesized from the on-screen transcript.*
