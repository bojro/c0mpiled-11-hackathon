# c0mpiled-11: Startup School Hackathon

**Repo:** https://github.com/bojro/c0mpiled-11-hackathon (public)
**Team:** @bojro + @czhao-mrai (invited, write access)

---

## THE BUILD: AI-native applicant screening (SaaS Challengers track)

**One-liner:** Replace the resume keyword filter with a voice AI interview that happens *at the moment you apply* — verifying what candidates actually did, bullet by bullet.

**Buyer:** Startups. They have no recruiting budget, no ATS worth paying for, and drown in AI-generated applications. Workday/Greenhouse are built for enterprises with recruiting teams; startups have a founder reading 400 résumés at midnight.

**Why now:** LLMs made résumés worthless as signal — everyone passes the keyword checker now. The filter has to move from *what you wrote* to *what you can defend out loud*. And voice AI just got cheap and fast enough to do this at application volume.

**Core insight (from @1cew):** people write résumés in "LinkedIn voice" — fancy keywords aimed at beating an automated checker. Don't fight that; *expand* on it. An AI talks to the applicant about their own résumé, asks pointed follow-ups on each bullet, and makes them substantiate it. Overgeneralizations collapse under questioning. Real builders get more room to show off than a résumé ever gave them.

**The artifact (this is the demo):** a screening report the recruiter opens, containing
- **Red / yellow / green per résumé bullet** — expandable to show the exact exchange that produced the verdict
- Full transcript + raw audio recording
- Summary judgment for the whole candidate

**Positioning both ways:** for the *company*, an extra concrete screening layer that catches résumé inflation early. For the *applicant*, it's not a gate — it's space to actually talk and prove they know their stuff, plus more context about the company. Say this in the pitch; judges will ask about the candidate side.

### Why this idea is well-matched to this room
See the judge research section below. Short version: the voice-adjacent judges are **Miso Labs** (emotive TTS foundation models) and **Phonely** (voice agents). The panel's dominant bias is **autonomous agent infrastructure** — build accordingly.

### Scope discipline (~3 hours)
The bullet-by-bullet red/yellow/green report **is** the product. Build backwards from that screen.
- Golden path: one seeded résumé → one voice interview → one report. That's the whole demo.
- Do not build: applicant accounts, job posting CRUD, email, scheduling, multi-role support.
- If live voice is fragile on venue wifi, pre-record the interview at 9:30 and demo the report generation live. **The report is the moat, not the phone call.**
- Hexclave fits naturally for recruiter auth + org/RBAC (and it's a $1,000 side prize) — but only wire it in once the golden path works.

### Decisions locked

| Decision | Choice | Why |
|---|---|---|
| Voice | **Browser-native** Web Speech API (STT) + SpeechSynthesis (TTS), continuous mode | Zero API keys, zero vendor latency, cannot fail on venue wifi. Swap TTS for something nicer only if there's time after the golden path works. |
| Autonomy | **Investigates autonomously, never decides** | Recruiting is high-stakes and rule-based filters get gamed. The agent picks its own probes and dispatches its own verification calls; a human reads the report and decides. Say this confidently on stage — it's a product judgment, not a cop-out. |
| Verdict source | Voice interview + CrustData (employer/title/dates) + GitHub (do commits back the claim) + self-consistency across follow-ups | Multi-source cross-referencing is what makes this an investigator rather than a chatbot. |
| Deployment | **Local-first.** No Vercel deploy unless submission requires a URL. | Superseded earlier advice: that assumed a live projector demo. If submission is a recorded video, deploy risk disappears and the ~10 min is better spent on the report UI. Revisit at 9:00 only if needed. |
| Models | `claude-haiku-4-5` for the build loop, `claude-opus-5` for the demo | Flip with `MODEL_TIER=demo`. The two tiers take different params — see `lib/model.ts`; Haiku rejects `effort` outright. |

### Interrogation protocol (from how top firms actually screen)

The agent's questioning strategy is not invented — it's the Amazon Bar Raiser / Google project-deep-dive protocol, automated:

1. **Probe 3–5 levels deep on a single claim.** "What alternatives did you consider?" "What data convinced them?" "What would you do differently?"
2. **Separate "I" from "we."** The highest-signal question in the industry, and the reason `ownershipSignal` is a first-class column in the report rather than buried in prose.
3. **Implementation vs. design doc.** Can they go multiple levels deep, or did they only read the spec?
4. **Consistency under pressure.** Real stories stay consistent across follow-ups because they're anchored to real details; invented ones drift. **This is the computable signal** — the agent detects when a story shifts between question 2 and question 5.
5. **Drove decisions vs. executed assigned tasks.**

### Recruiter console spec (decided)

Build against `data/mock-report.ts` — it covers every state the UI has to survive (all four verdicts, all four ownership signals, a one-evidence finding and a three-evidence finding, a long quote, and a bullet the interview never reached).

**Layout: split view.** Résumé left, evidence right. Clicking a bullet on the left fills the right panel. No expand/collapse — evidence always has room, and nothing reflows under the judge's cursor mid-demo.

```
┌──────────────────┬───────────────────────┐
│ RÉSUMÉ           │ EVIDENCE              │
│ ┃ Built a real-  │ Q: What did you       │
│ ┃ time collab... │    consider instead?  │
│ ┗ green          │ A: "We looked hard    │
│ ┃ Led a team of  │    at OT first..."    │
│ ┗ yellow  ◀ sel  │ ───────────────────   │
│ ┃ Architected... │ consistency  ✓        │
│ ┗ red            │ crustdata    ✓        │
│ ┃ Reduced cloud  │ github       —        │
│ ┗ unverified     │                       │
└──────────────────┴───────────────────────┘
```

**Above the fold: verdict counts only** — `1 green · 1 yellow · 1 red · 1 unverified`. Not the summary paragraph; the color-coded bullets are the product and shouldn't be pushed down.

**Visual: dark, dense, technical.** Near-black, monospace for quotes, colour used only where verdicts carry it. Holds up under projector lighting at 10 PM.

Two things to get right, because they're what make it credible rather than a black box:
- **The quote is the payload.** `evidence[].excerpt` is the candidate's actual words. Give it room and set it in mono — it's what a recruiter expands to audit the verdict.
- **`unverified` must not read as an accusation.** Grey, not red. It means "no external record", which is the honest answer for most real work.

Known tradeoff: split view doesn't collapse to mobile. Fine for a laptop demo — don't spend time on responsive.

### Still unconfirmed
- **Submission format.** Best current understanding is *upload a video* — not confirmed. If true, the live-demo risk largely disappears and the 9:30 recording becomes the primary deliverable, not the insurance policy. **Confirm this with an organizer.**

---


**Host:** c0mpiled (by Transpose Platform) · 27 South Park Suite 100, San Francisco
**Date:** Friday, July 24, 2026, 6:00–11:00 PM · ~148 attendees
**Source:** https://luma.com/compiled-cp9o

## The clock (this is the single most important constraint)

| Time | What happens |
|---|---|
| 6:00–6:30 PM | Opening remarks + challenge overview |
| **6:30–10:00 PM** | **Building period — ~3.5 hours total** |
| 10:00 PM | Judging begins |
| 10:00–10:45 PM | Optional demos |
| 10:45–11:00 PM | Closing + awards |

**Implication:** this is a *demo* hackathon, not a *product* hackathon. Scope must fit in ~3 hours of build + ~20 min of demo prep. Anything requiring data collection, model training, real integrations with OAuth flows, or deployment infrastructure will not finish. Budget backwards: 9:30 PM = feature freeze, 9:30–10:00 PM = rehearse the demo and fix the demo path only.

## Prizes

| Prize | Amount |
|---|---|
| 1st place | $3,000 |
| 2nd place | $1,500 |
| 3rd place | $500 |
| **Most Fundable** | recognition |
| **Most Beautiful** | recognition |
| **Hexclave bonus** | **$1,000 for best project using Hexclave** |

## Judging — what actually gets rewarded

No public rubric was posted. Infer the rubric from two facts:

1. **Every judge is a YC founder** (11 of them, listed below). YC founders evaluate on the YC pattern: *what does it do, who is it for, why now, is the demo real*. They are allergic to vapor, wrappers with no insight, and slide-only pitches.
2. **The two named side prizes are "Most Fundable" and "Most Beautiful."** That is the rubric leaking. The organizers care about (a) does this look like a company, and (b) does it look *good*.

Practical weighting to build against:
- **Working demo on real data > breadth of features.** One end-to-end path that actually runs beats five stubbed screens.
- **Fundability:** be able to answer in one sentence each — who's the customer, what do they do today, why is this 10x, why now. Pick a track and *name the buyer*.
- **Beauty:** a genuinely polished UI is a named prize with likely few serious contenders. Design is cheap leverage here — dark, dense, fast, no default Bootstrap look.
- **Judges are tired at 10 PM after a 5-hour event.** The demo must land in <90 seconds before any explanation.

### Judges (all YC founders)
Vlad Baskakov (VOYGR) · Jeff An (Momentic) · George Lawrence (Channel3) · Will Bodewes (Phonely) · Abhilash Chowdhary (CrustData) · Aoden Teo (Miso Labs) · Konstantin Wohlwend (Hexclave) · Satya Patel (Superset) · Ainur Nygmet (ZenoVista AI) · Kiran Illindala (RandomLabs) · Phillip Nadjafov (Oway)

Note: judges are also the sponsors whose APIs are on offer. Using a judge's API means that judge understands your demo instantly and has a reason to root for it.

## The five tracks (YC RFS Summer 2026, verbatim)

**1. Company Brain — Tom Blomfield**
> Build a system that pulls scattered company knowledge (from people's heads, old emails, Slack threads, support tickets, and databases) into one structured, living map of how the company actually works, then turns that into an executable skills file so AI agents can do the work safely and consistently.

**2. The AI Operating System for Companies — Diana Hu**
> Build a connective intelligence layer that stitches together Slack, Linear, GitHub, Notion, call recordings, and other tools into a single system that makes a company fully queryable, turning it from an open loop (decisions checked weeks later) into a closed loop (the system monitors, compares, and adjusts in real time).

**3. AI for Low-Pesticide Agriculture — Garry Tan**
> Build tools, using AI vision, cheap sensors and cameras, precision robotics, and biological alternatives like microbes, peptides, and RNA-based solutions, that help farmers cut pesticide use dramatically while growing more food, not less.

**4. SaaS Challengers — Jared Friedman**
> Build AI-native replacements for legacy SaaS products. That could mean cloning an existing product at a tenth of the price, rethinking a workflow from scratch instead of bolting a chatbot onto an old UI, bundling many point solutions into one suite, or open-sourcing a replacement for software that costs $50K per seat, targeting even entrenched categories like ERPs, chip design software, and industrial control systems.

**5. AI-Native Service Companies — Gustaf Alströmer**
> Build companies that don't sell software tools but actually perform the service itself, replacing outsourced work rather than just improving it, particularly in insurance brokerage, accounting/tax/audit, compliance, and healthcare administration.

### Track selection notes for a 3.5-hour build
- **Tracks 1, 2, 4** are software-only and demoable tonight. These are the realistic picks.
- **Track 3 (agriculture)** needs vision/hardware — only viable if you can demo on a public crop/pest image dataset with a real model call. High differentiation (few teams will attempt it), high risk.
- **Track 5 (services)** is a *business model* track, not a technical one. Wins on fundability, loses on "what did you build." Only pick it if the demo shows the service being *performed* end-to-end (e.g. a real filled-out form, a real completed audit artifact), not a dashboard about it.
- **Crowd risk:** with 148 attendees, tracks 1 and 2 will be crowded with "chat over your company docs" RAG demos. Differentiate on the second half of the track text — track 1 says *"executable skills file so AI agents can do the work"*, track 2 says *"closed loop — monitors, compares, and adjusts."* Most teams will stop at retrieval. Ship the action/loop half.

## Sponsor credits & APIs

| Sponsor | Offer | Code | What it is |
|---|---|---|---|
| **Hexclave** | **$1,000 prize for best project on their platform** | — | Open-source user infrastructure: auth, teams, RBAC, API keys, payments, transactional email, analytics, webhooks, encrypted secret storage. Drop-in for anything multi-tenant. |
| CrustData | $5,000 credits | `ULUVCRUSTDATA` | Real-time B2B data APIs — company, person, job, web search, social posts. Search/enrich/identify. Web search API built for agents. |
| Channel3 | 50k free credits | `HACKATHON` | Database of every product on the internet; product search/recommend/buy for AI agents. Agentic commerce. |
| Superset | one-month discount | `TRANSPOSE-20` | (verify at event) |
| VOYGR | early access to Callwright API | — | (verify at event — ask Vlad Baskakov directly) |

**Strategic read on Hexclave:** a dedicated $1,000 prize with likely low uptake — most teams won't bother wiring auth into a 3-hour hack. If the project has any notion of users/teams/orgs (tracks 1, 2, 4 all do), using Hexclave for auth + RBAC + secret storage is cheap and puts you in a small pool. It also directly serves the "Company Brain" permissions story ("agents do the work *safely*") — that's a real product argument, not just prize-farming.

**Compounding play:** a project that uses two sponsor APIs and is on-track competes for 1st + Hexclave bonus + gets two judges who already understand it.

## Unknowns to resolve during opening remarks (6:00–6:30 PM)

Ask/listen for these — they were not on the event page:
- Submission mechanism and hard deadline (Devpost? form? repo link?)
- Team size limit
- Pre-existing code policy (assume: starting fresh is expected; scaffolds/boilerplate are usually fine, disclose it)
- Demo format and time limit (demos are listed as **optional** — but doing one is almost certainly required to win)
- Whether judging is per-track or global

## Git rules (2-person team, 3 hours — process must be light)

**Commit frequently.** Every working unit of change, and never go more than ~15 minutes without a commit. Push immediately after every commit — `origin` is the backup. A laptop dying at 9:00 PM with 2 hours of uncommitted work is a real way to lose this.

**Branching:**
- `main` is always demoable. Never push broken code to `main`.
- Work on short-lived branches: `feat/<thing>`, e.g. `feat/report-view`, `feat/voice-loop`.
- Merge to `main` early and often — every 20–30 minutes, not at the end. Long-lived branches are how a 2-person team ends up in a merge conflict at 9:45 PM.
- No branch protection, no required reviews. Self-merge is fine tonight; speed beats process at this scale.
- `git pull --rebase` before pushing to keep history linear and avoid merge commit noise.

**Current status (as of ~7:45 PM): @czhao-mrai has not started.** Claude is building both tracks. The table below is the *handoff map* — when czhao picks up, they take the interview/agent column and the boundary rules go live immediately.

**Conflict avoidance beats conflict resolution — own directories, not features.**

| Owner | Directory | What lives there |
|---|---|---|
| **@bojro** | `app/report/`, `components/report/` | Recruiter console — the red/yellow/green bullet view, expandable evidence, transcript panel |
| **@czhao-mrai** | `app/interview/`, `lib/agent/`, `app/api/` | Voice loop, interview agent, verification tool calls, Claude call sites |
| **shared — do not edit alone** | `lib/schema.ts`, `lib/model.ts` | Report contract + model tier config |

The rule that prevents every merge conflict tonight: **if a file isn't in your directory, you don't edit it.** Need a change in the other person's area? Ask in Discord — it takes 20 seconds and costs less than a conflict at 9:40.

`lib/schema.ts` is the one file both sides compile against. Changing it breaks the other person's build instantly, so it changes only by agreement.

**Two agents in one repo is the real hazard.** If both of you run an AI coding agent against this repo, they will overwrite each other — agents read a file, think for a minute, and write back a version that silently discards whatever landed in between. Mitigations, in order: stay on separate branches, keep to your own directories, and `git pull --rebase` before every push.

**Before merging to `main`:** pull, rebase, confirm the golden path still runs. That's the whole check.

**After 9:30 PM (feature freeze):** `main` only, no branches, demo-critical fixes only.

## Build doctrine for tonight

1. **Lock the idea by 7:00 PM.** Every minute past that costs a feature. If still debating at 7:00, take the more demoable option, not the more interesting one.
2. **Write the 60-second demo script before writing code.** The script defines the scope. Anything not in the script does not get built.
3. **One golden path.** Hardcode/seed everything off the demo path. Fake data is fine if it is *realistic* — judges care that the transformation is real, not that the input was live.
4. **Deploy early, deploy at 8:00 PM.** A localhost demo that dies on the projector is the most common way to lose. Get it on a public URL while there's still time to fix it.
5. **Spend the last 45 minutes on polish, not features.** Given "Most Beautiful" is a prize and the field is 148 people deep, 30 minutes of design is worth more than a 6th feature.
6. **Have a fallback recording.** A 60-second screen capture of the working flow, made at 9:30 PM, insures against live failure.
