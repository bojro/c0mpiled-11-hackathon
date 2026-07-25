import type { JobDescription, Resume } from "@/lib/types";

/**
 * The demo candidate.
 *
 * `githubUsername` points at a real account so the GitHub verification path
 * returns live data on stage rather than a canned response — swap it for
 * whoever is driving the demo. Everything else here is fabricated for the demo
 * and is not a claim about any real person's history.
 *
 * The bullets are written to exercise all four verdicts: one that holds up,
 * one where the contribution is narrower than the phrasing implies, one that
 * collapses under follow-up, and one with no external record either way.
 */
export const DEMO_RESUME: Resume = {
  candidateName: "Demo Candidate",
  githubUsername: "bojro",
  bullets: [
    {
      id: "b1",
      text: "Built and shipped a real-time collaborative editor handling 10k concurrent sessions, cutting p99 sync latency from 800ms to 120ms.",
      company: "Northwind Systems",
      title: "Senior Software Engineer",
      dates: "Mar 2023 – Present",
    },
    {
      id: "b2",
      text: "Led a team of 8 engineers to migrate the core billing platform off a legacy monolith.",
      company: "Northwind Systems",
      title: "Senior Software Engineer",
      dates: "Mar 2023 – Present",
    },
    {
      id: "b3",
      text: "Architected the company's machine learning infrastructure from the ground up, driving a 40% improvement in model training throughput.",
      company: "Vantage Labs",
      title: "Software Engineer",
      dates: "Jun 2021 – Feb 2023",
    },
    {
      id: "b4",
      text: "Reduced cloud spend by $2M annually through infrastructure optimization.",
      company: "Vantage Labs",
      title: "Software Engineer",
      dates: "Jun 2021 – Feb 2023",
    },
  ],
};

export const DEMO_JOB: JobDescription = {
  roleTitle: "Founding Engineer",
  company: "an early-stage YC startup",
  mustHaves: [
    "Ships production systems end to end with little supervision",
    "Has personally made hard distributed-systems tradeoffs, not just read about them",
    "Can justify architectural decisions against the alternatives they rejected",
    "Comfortable owning ambiguous problems without a spec",
  ],
};
