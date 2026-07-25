import type { ScreeningReport } from "@/lib/schema";

/**
 * Realistic fixture for building the recruiter console without a live backend.
 *
 * Deliberately exercises every state the UI has to handle: all four verdicts,
 * all four ownership signals, findings with one evidence item and findings with
 * four, a long excerpt that will need truncation or scrolling, and a bullet the
 * interview never reached.
 *
 * Import this in the report page while developing; swap for the live call later.
 */
export const MOCK_REPORT: ScreeningReport = {
  candidate: {
    name: "Demo Candidate",
    roleAppliedFor: "Founding Engineer",
  },
  overallSummary:
    "Two of four claims were interrogated in depth. The collaborative editor work is substantiated and appears to be the candidate's own — they described the failure modes and the tradeoff they rejected without prompting. The billing migration is real but their role was narrower than 'led a team of 8' implies; by their own description they coordinated one workstream of a larger effort. The ML infrastructure claim did not hold up: the candidate could describe the architecture but not the implementation, and their account of who made the design decisions changed between answers. The cloud-spend claim was not reached in the interview and has no external record.",
  findings: [
    {
      bulletText:
        "Built and shipped a real-time collaborative editor handling 10k concurrent sessions, cutting p99 sync latency from 800ms to 120ms.",
      company: "Northwind Systems",
      title: "Senior Software Engineer",
      verdict: "green",
      headline:
        "Substantiated in depth — named the rejected alternative and the specific failure mode unprompted.",
      ownershipSignal: "drove",
      evidence: [
        {
          kind: "transcript",
          summary:
            "Described choosing CRDTs over operational transforms, and why.",
          excerpt:
            "Interviewer: What did you consider instead of CRDTs?\n\nCandidate: We looked hard at OT first, honestly because we already had a team that knew it. The thing that killed it for us was that OT needs a central server to order operations, and we had a hard requirement to keep working through network partitions — field techs on bad connections. With OT you're either building a really unpleasant reconciliation layer or you're just down. So we ate the memory cost of CRDTs. It's not free — our tombstone growth was bad enough that I had to write a compaction pass about four months in.",
        },
        {
          kind: "transcript",
          summary:
            "Volunteered a specific implementation-level bug when asked what broke.",
          excerpt:
            "Interviewer: What broke that you didn't expect?\n\nCandidate: Cursor positions. Everyone talks about text convergence and nobody talks about where the cursor goes. Two people typing near each other and your cursor would jump backwards a character — technically correct per the algorithm, felt completely broken to users. Took me a week to figure out we needed to anchor selections to the CRDT identifiers instead of integer offsets.",
        },
        {
          kind: "consistency",
          summary:
            "Latency figures stayed consistent across three separate mentions.",
        },
      ],
    },
    {
      bulletText:
        "Led a team of 8 engineers to migrate the core billing platform off a legacy monolith.",
      company: "Northwind Systems",
      title: "Senior Software Engineer",
      verdict: "yellow",
      headline:
        "Migration is real; candidate coordinated one workstream rather than leading the effort.",
      ownershipSignal: "contributed",
      evidence: [
        {
          kind: "transcript",
          summary:
            "Under follow-up, described a scope narrower than the bullet implies.",
          excerpt:
            "Interviewer: What was your piece of that?\n\nCandidate: So the whole migration was eight of us, and I owned the invoicing service — that was me and one other engineer. I was running our standup and I was the one talking to finance about the cutover, so in that sense yeah, but I want to be straight with you, there was a staff engineer above the whole thing setting the sequencing. I wasn't deciding what moved when across all eight.",
        },
        {
          kind: "transcript",
          summary:
            "Owned the invoicing cutover end to end, including the rollback plan.",
          excerpt:
            "Candidate: The dual-write period was mine. We ran both systems for six weeks and diffed every invoice — I wrote the reconciliation job. Caught about forty cases where rounding differed on multi-currency line items, which would have been extremely bad to find in production.",
        },
        {
          kind: "crustdata",
          summary:
            "Employer, title, and dates match external records for this period.",
        },
      ],
    },
    {
      bulletText:
        "Architected the company's machine learning infrastructure from the ground up, driving a 40% improvement in model training throughput.",
      company: "Vantage Labs",
      title: "Software Engineer",
      verdict: "red",
      headline:
        "Could describe the architecture but not the implementation; account of ownership changed mid-interview.",
      ownershipSignal: "adjacent",
      evidence: [
        {
          kind: "consistency",
          summary:
            "Story shifted from 'built it' to 'inherited and extended it' across two answers.",
          excerpt:
            "Earlier in the interview —\n\nCandidate: I built the training pipeline out from nothing, we had researchers running things on their laptops before that.\n\nLater, when asked about the scheduler —\n\nCandidate: The scheduler was already there when I joined that team, I mostly worked on the data loading side of it.",
        },
        {
          kind: "transcript",
          summary:
            "Could not name what was tried before, or where the 40% came from.",
          excerpt:
            "Interviewer: Where did the 40% come from?\n\nCandidate: It was a combination of things, better GPU utilization mostly, and some caching.\n\nInterviewer: Which one moved it most?\n\nCandidate: I'd have to go back and look at the numbers, it's been a while.",
        },
        {
          kind: "github",
          summary:
            "No public repositories relate to ML infrastructure. Not evidence against the claim — most professional work is private.",
        },
      ],
    },
    {
      bulletText:
        "Reduced cloud spend by $2M annually through infrastructure optimization.",
      company: "Vantage Labs",
      title: "Software Engineer",
      verdict: "unverified",
      headline:
        "Not reached in the interview and no external record exists either way.",
      ownershipSignal: "unclear",
      evidence: [
        {
          kind: "transcript",
          summary:
            "The interview ended before this claim was interrogated. No signal in either direction.",
        },
      ],
    },
  ],
  transcript: [
    {
      speaker: "agent",
      text: "Hey — thanks for making the time. I want to dig into a couple of things on your résumé rather than walk through all of it. Let's start with the collaborative editor. What was the hard part?",
    },
    {
      speaker: "candidate",
      text: "Honestly the hard part wasn't the syncing, it was convergence under bad networks. We had customers on field connections dropping in and out constantly.",
    },
    {
      speaker: "agent",
      text: "What did you consider instead of CRDTs?",
    },
    {
      speaker: "candidate",
      text: "We looked hard at OT first, honestly because we already had a team that knew it. The thing that killed it for us was that OT needs a central server to order operations, and we had a hard requirement to keep working through network partitions.",
    },
    {
      speaker: "agent",
      text: "What broke that you didn't expect?",
    },
    {
      speaker: "candidate",
      text: "Cursor positions. Everyone talks about text convergence and nobody talks about where the cursor goes.",
    },
    {
      speaker: "agent",
      text: "Let me ask about something else — the billing migration. What was your piece of that?",
    },
    {
      speaker: "candidate",
      text: "So the whole migration was eight of us, and I owned the invoicing service — that was me and one other engineer.",
    },
  ],
};
