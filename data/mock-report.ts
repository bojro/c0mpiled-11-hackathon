import type { ScreeningReport } from "@/lib/schema";

/**
 * Realistic fixture for building the recruiter console without a live backend.
 *
 * Finding `bulletText` values match data/resume.ts verbatim — the console
 * links findings to document bullets by exact text. Tool-sourced evidence
 * carries the raw pulled report in `excerpt` so the recruiter can open it.
 */
export const MOCK_REPORT: ScreeningReport = {
  candidate: {
    name: "Ken Carson",
    roleAppliedFor: "Backend Engineer (New Grad)",
  },
  overallSummary:
    "Four claims were interrogated in depth; bullets without a mark were not examined. The Kubernetes/EKS deployment work is substantiated — the candidate described the rollout failure they debugged and why they chose Redis over an in-process cache without prompting. The NBA win-probability project is substantiated and corroborated by public GitHub activity matching the claimed timeline and test count. The '20% support ticket reduction' reflects real containerization work, but the candidate was candid that the number came from a manager's estimate they never saw measured. The '35% parsing bug reduction' did not hold up: the candidate could not say how it was measured, and their account of who owned the refactor narrowed from 'I refactored the APIs' to 'I worked on two of the endpoints' under follow-up. ",
  findings: [
    {
      bulletText:
        "Containerized backend services with Docker and deployed them on Kubernetes (Amazon EKS), implementing rolling deployments, health checks, and Redis caching to improve scalability, reduce API latency, and increase service reliability.",
      company: "F500 Company",
      title: "Software Engineer Intern",
      verdict: "green",
      headline:
        "Substantiated — described the failed rollout they debugged and the caching tradeoff, unprompted.",
      ownershipSignal: "drove",
      evidence: [
        {
          kind: "transcript",
          summary:
            "Explained a concrete production failure and how the health checks caught it.",
          excerpt:
            "Interviewer: You mention rolling deployments and health checks — did a rollout ever go wrong?\n\nCandidate: Yeah, actually the second week after we turned it on. One of the services had a readiness probe hitting an endpoint that touched the database, and during a deploy the connection pool ran out, so Kubernetes marked healthy pods unready and the rollout stalled half-finished. I ended up splitting liveness from readiness and pointing readiness at a cheap in-memory check. That's the kind of thing you only learn by getting paged for it.",
        },
        {
          kind: "transcript",
          summary:
            "Justified Redis over an in-process cache with a real constraint.",
          excerpt:
            "Interviewer: Why Redis and not just caching in the service?\n\nCandidate: Because we had three replicas behind a load balancer, and in-process caches were giving us inconsistent reads depending on which pod you hit. Redis gave us one source of truth and let us set TTLs centrally. The tradeoff is the extra network hop, but the queries we cached were 100-plus milliseconds, so a 1ms hop was nothing.",
        },
        {
          kind: "crustdata",
          summary:
            "Employer and internship window consistent with external records.",
          excerpt:
            "verify_employment(personName: \"Ken Carson\", company: \"F500 Company\", title: \"Software Engineer Intern\")\n\n{\n  \"matches\": 1,\n  \"person\": {\n    \"name\": \"Ken C.\",\n    \"current_employer\": \"F500 Company\",\n    \"title\": \"Software Engineer Intern\",\n    \"employment_start\": \"2025-06\",\n    \"employment_end\": null,\n    \"location\": \"Los Angeles, CA\"\n  },\n  \"source_confidence\": 0.91\n}\n\nAgent note: employer, title, and start date match the résumé. Ongoing role consistent with \"June 2025 – Present\".",
        },
      ],
    },
    {
      bulletText:
        "Designed and deployed containerized microservices using Docker, enabling consistent environments and streamlining access to device controls, reducing support tickets by 20%.",
      company: "Startup (YC S20)",
      title: "Software Engineer Intern",
      verdict: "yellow",
      headline:
        "Containerization work is real; the 20% figure is a manager's estimate the candidate never saw measured.",
      ownershipSignal: "contributed",
      evidence: [
        {
          kind: "transcript",
          summary:
            "Candid under follow-up about where the number came from.",
          excerpt:
            "Interviewer: How was the 20% measured?\n\nCandidate: Honestly — my manager said it in my end-of-internship review, that ticket volume on environment issues was down about twenty percent since the Docker migration. I never saw the dashboard myself. The migration was real and I did most of the Dockerfiles, but I want to be straight that the number is his, not mine.\n\nInterviewer: That's a fair answer.",
        },
        {
          kind: "transcript",
          summary:
            "Described the actual containerization work specifically.",
          excerpt:
            "Candidate: The mess before was that firmware tooling only ran on one engineer's machine with the right udev rules. I built the images with the device SDKs baked in and a compose file so support could spin up the whole stack locally. That part I'll defend all day — the exact ticket number, less so.",
        },
      ],
    },
    {
      bulletText:
        "Refactored and optimized backend service APIs in Go-compatible patterns using Node.js/Express, standardizing error handling and response formatting across microservices, reducing client-side parsing bugs by 35%.",
      company: "Startup (YC S20)",
      title: "Software Engineer Intern",
      verdict: "red",
      headline:
        "Scope narrowed from 'refactored the APIs' to 'two endpoints' under follow-up; could not say how 35% was measured or what 'Go-compatible patterns' means.",
      ownershipSignal: "adjacent",
      evidence: [
        {
          kind: "consistency",
          summary:
            "Ownership claim narrowed materially between two answers.",
          excerpt:
            "Earlier —\n\nCandidate: I refactored our backend APIs to standardize error handling across the microservices.\n\nLater, asked which services —\n\nCandidate: It was mostly the device-status service. I updated two of the endpoints to the new response format; the format itself was already defined by the staff engineer who ran the migration.",
        },
        {
          kind: "transcript",
          summary:
            "Could not explain the metric or the 'Go-compatible patterns' phrasing.",
          excerpt:
            "Interviewer: What does 'Go-compatible patterns' mean in a Node service?\n\nCandidate: It's like... returning errors as values instead of throwing, that kind of style.\n\nInterviewer: And the 35% — where does that come from?\n\nCandidate: I think that was in the migration doc as the goal for the whole effort. I'm not sure what it ended up being.",
        },
      ],
    },
    {
      bulletText:
        "Built a full-stack NBA win-probability platform (Python, XGBoost) achieving 0.854 AUC on a fully held-out season, using strict train/test splitting across 4,900+ real games to prevent data leakage",
      company: "Prediction Markets Betting Detector",
      title: "Personal project",
      verdict: "green",
      headline:
        "Substantiated — explained the leakage trap correctly, and public GitHub activity corroborates the timeline and test count.",
      ownershipSignal: "drove",
      evidence: [
        {
          kind: "transcript",
          summary:
            "Explained why naive splitting leaks and what they did instead.",
          excerpt:
            "Interviewer: What leaks if you split randomly?\n\nCandidate: Rolling features. If a team's ten-game rolling average is computed over the whole dataset, a training row from March already contains information about April games sitting in your test set. I split by season instead — trained through 2024-25 and held out the whole 2025-26 season — and computed the rolling features inside each split only. The 0.854 is on the held-out season, and honestly random splitting had looked better, which is exactly the trap.",
        },
        {
          kind: "github",
          summary:
            "Public repository matches the claimed stack, timeline, and test count.",
          excerpt:
            "lookup_github_activity(username: \"kencarson\")\n\nGitHub profile for kencarson:\n  public repos: 14\n  account created: 2021-03\n\nRecent public repositories:\n  - nba-win-prob (Python, ★12) — XGBoost win-probability model + LangGraph fact-check agent. Last push: July 2026.\n    · commit history: 61 commits between 2026-07-02 and 2026-07-09\n    · test suite: 69 test functions across tests/ (matches résumé claim of \"69 automated tests\")\n    · CI: GitHub Actions workflow with docker build + pytest\n  - storage-marketplace (TypeScript, ★3) — peer-to-peer storage app. Last push: Nov 2025.\n\nAgent note: repository activity is consistent with \"shipped solo in one week\" (61 commits across 8 days) and the claimed test count.",
        },
      ],
    },
  ],
  transcript: [
    {
      speaker: "agent",
      text: "Hey Ken — thanks for making the time. I want to dig into a few specific things rather than walk the whole résumé. Let's start with the EKS deployment work at your current internship. Did a rollout ever go wrong?",
    },
    {
      speaker: "candidate",
      text: "Yeah, actually the second week after we turned it on. A readiness probe was hitting an endpoint that touched the database, and during a deploy the connection pool ran out, so Kubernetes marked healthy pods unready and the rollout stalled half-finished.",
    },
    {
      speaker: "agent",
      text: "Why Redis and not just caching in the service?",
    },
    {
      speaker: "candidate",
      text: "Because we had three replicas behind a load balancer, and in-process caches were giving us inconsistent reads depending on which pod you hit.",
    },
    {
      speaker: "agent",
      text: "Let me switch to the startup internship. How was the 20% support-ticket reduction measured?",
    },
    {
      speaker: "candidate",
      text: "Honestly — my manager said it in my end-of-internship review. I never saw the dashboard myself. The migration was real and I did most of the Dockerfiles, but the number is his, not mine.",
    },
    {
      speaker: "agent",
      text: "Fair answer. On the API refactor — which services did you standardize?",
    },
    {
      speaker: "candidate",
      text: "It was mostly the device-status service. I updated two of the endpoints to the new response format; the format itself was defined by the staff engineer who ran the migration.",
    },
    {
      speaker: "agent",
      text: "Last one — the NBA model. What leaks if you split randomly?",
    },
    {
      speaker: "candidate",
      text: "Rolling features. A training row from March already contains information about April games in your test set. I split by season instead and computed rolling features inside each split only.",
    },
  ],
};
