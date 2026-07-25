import type { JobDescription, Resume } from "@/lib/types";

/**
 * The claims the interview agent interrogates — the subset of the résumé in
 * data/resume.ts worth attacking, with ids the agent uses for probe tracking.
 *
 * `githubUsername` should point at a real account so the GitHub verification
 * path returns live data — swap for whoever drives the demo. The résumé itself
 * is an anonymized real résumé used with permission.
 */
export const DEMO_RESUME: Resume = {
  candidateName: "Ken Carson",
  githubUsername: "bojro",
  bullets: [
    {
      id: "b1",
      text: "Containerized backend services with Docker and deployed them on Kubernetes (Amazon EKS), implementing rolling deployments, health checks, and Redis caching to improve scalability, reduce API latency, and increase service reliability.",
      company: "F500 Company",
      title: "Software Engineer Intern",
      dates: "June 2025 – Present",
    },
    {
      id: "b2",
      text: "Designed and deployed containerized microservices using Docker, enabling consistent environments and streamlining access to device controls, reducing support tickets by 20%.",
      company: "Startup (YC S20)",
      title: "Software Engineer Intern",
      dates: "June 2024 – August 2024",
    },
    {
      id: "b3",
      text: "Refactored and optimized backend service APIs in Go-compatible patterns using Node.js/Express, standardizing error handling and response formatting across microservices, reducing client-side parsing bugs by 35%.",
      company: "Startup (YC S20)",
      title: "Software Engineer Intern",
      dates: "June 2024 – August 2024",
    },
    {
      id: "b4",
      text: "Built a full-stack NBA win-probability platform (Python, XGBoost) achieving 0.854 AUC on a fully held-out season, using strict train/test splitting across 4,900+ real games to prevent data leakage",
      company: "Prediction Markets Betting Detector",
      title: "Personal project",
      dates: "July 2026",
    },
    {
      id: "b5",
      text: "Designed backend infrastructure for secure device communication, implementing JSON Web Token authentication, request validation, and rate limiting to support reliable API access at scale.",
      company: "Startup (YC S20)",
      title: "Software Engineer Intern",
      dates: "June 2024 – August 2024",
    },
  ],
};

export const DEMO_JOB: JobDescription = {
  roleTitle: "Backend Engineer (New Grad)",
  company: "an early-stage YC startup",
  mustHaves: [
    "Has personally operated containerized services in production, not just written Dockerfiles",
    "Can attribute a metric they claim to the change that produced it",
    "Ships end to end with little supervision",
    "Can justify architectural decisions against the alternatives they rejected",
  ],
};
