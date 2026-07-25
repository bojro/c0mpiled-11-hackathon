/**
 * The résumé as a renderable document (anonymized real résumé).
 *
 * The console renders this in full; bullets that the interview interrogated
 * are matched to report findings *by exact text* and become clickable.
 * Everything else renders as plain document text.
 */

export type ResumeEntry = {
  org: string;
  location?: string;
  title?: string;
  dates?: string;
  bullets: string[];
};

export type ResumeSection = {
  heading: string;
  entries: ResumeEntry[];
};

export type ResumeDocument = {
  name: string;
  contact: string;
  sections: ResumeSection[];
  skills: { label: string; items: string }[];
};

export const RESUME_DOC: ResumeDocument = {
  name: "Ken Carson",
  contact: "Ken@usc.edu · linkedin.com/in/ken-carson · github.com/kencarson",
  sections: [
    {
      heading: "Education",
      entries: [
        {
          org: "University of Southern California",
          location: "Los Angeles, CA",
          title: "Master of Science in Computer Science",
          dates: "Expected May 2028",
          bullets: [
            "Relevant Coursework: Data Structures and Algorithms, Machine Learning and Data Mining, Fullstack Web Development, Computer Architecture, Operating Systems",
          ],
        },
        {
          org: "UC Riverside",
          location: "Riverside, CA",
          title: "Bachelor of Science in Computer Science",
          dates: "June 2026",
          bullets: [],
        },
      ],
    },
    {
      heading: "Experience",
      entries: [
        {
          org: "F500 Company",
          location: "Los Angeles, CA",
          title: "Software Engineer Intern",
          dates: "June 2025 – Present",
          bullets: [
            "Developed Python (FastAPI) microservices that unified portfolio planning, forecasting, and asset management data into scalable REST APIs, streamlining backend integration across internal engineering applications.",
            "Built cloud-native ETL pipelines using AWS Lambda, Amazon S3, and PostgreSQL to ingest and transform transmission portfolio data, automating backend workflows and improving data reliability for downstream services.",
            "Containerized backend services with Docker and deployed them on Kubernetes (Amazon EKS), implementing rolling deployments, health checks, and Redis caching to improve scalability, reduce API latency, and increase service reliability.",
          ],
        },
        {
          org: "Startup (YC S20)",
          location: "San Francisco, CA",
          title: "Software Engineer Intern",
          dates: "June 2024 – August 2024",
          bullets: [
            "Designed and deployed containerized microservices using Docker, enabling consistent environments and streamlining access to device controls, reducing support tickets by 20%.",
            "Refactored and optimized backend service APIs in Go-compatible patterns using Node.js/Express, standardizing error handling and response formatting across microservices, reducing client-side parsing bugs by 35%.",
            "Designed backend infrastructure for secure device communication, implementing JSON Web Token authentication, request validation, and rate limiting to support reliable API access at scale.",
          ],
        },
      ],
    },
    {
      heading: "Projects",
      entries: [
        {
          org: "Prediction Markets Betting Detector",
          title: "Python, LangGraph / LLM Agents, React/TypeScript, PostgreSQL",
          dates: "July 2026",
          bullets: [
            "Built a full-stack NBA win-probability platform (Python, XGBoost) achieving 0.854 AUC on a fully held-out season, using strict train/test splitting across 4,900+ real games to prevent data leakage",
            "Designed an LLM agent (Claude, LangGraph) that fact-checks live news before confirming flagged bets, achieving 100% precision against a self-built, hand-labeled ground-truth benchmark",
            "Shipped a production full-stack app (React/TypeScript, PostgreSQL, Docker, CI/CD) solo in one week, backed by 69 automated tests and a containerized deployment pipeline",
          ],
        },
        {
          org: "Airbnb-style Storage Marketplace",
          title: "TypeScript, React, Python",
          dates: "Sept 2025 – Nov 2025",
          bullets: [
            "Built a full-stack peer-to-peer storage marketplace using React, FastAPI, and MongoDB, enabling users to list and reserve storage space with prorated pricing, availability tracking, and real-time messaging, supporting scalable marketplace interactions across hosts and renters.",
            "Designed and implemented a unified backend system with RESTful APIs and async processing, consolidating listings, reservations, and messaging workflows, improving system reliability and reducing complexity for frontend integration and future feature expansion.",
            "Integrated Stripe Identity and payment workflows, including driver's license verification with live selfie matching and webhook-based status updates, strengthening platform trust and enabling secure transactions while offloading sensitive data handling to external infrastructure.",
          ],
        },
      ],
    },
  ],
  skills: [
    {
      label: "Languages",
      items: "Go, Python, TypeScript, JavaScript, C++, Java, SQL (PostgreSQL), Kotlin",
    },
    { label: "Frameworks", items: "React.js, Next.js, Node.js" },
    {
      label: "Developer Tools",
      items:
        "Docker, Kubernetes, Git, GitHub, MongoDB, AWS, Redis, Vercel, Cursor, Claude Code, Jira",
    },
  ],
};
