import type { EvidenceKind, OwnershipSignal, Verdict } from "@/lib/schema";

/**
 * Verdict presentation map. Verdicts are status colors: they never appear
 * without their text label, so color is reinforcement, not the sole carrier.
 */
export const VERDICT = {
  green: {
    label: "substantiated",
    color: "var(--v-green)",
    dim: "var(--v-green-dim)",
  },
  yellow: {
    label: "partially substantiated",
    color: "var(--v-yellow)",
    dim: "var(--v-yellow-dim)",
  },
  red: {
    label: "did not hold up",
    color: "var(--v-red)",
    dim: "var(--v-red-dim)",
  },
  unverified: {
    label: "unverified",
    color: "var(--v-grey)",
    dim: "var(--v-grey-dim)",
  },
} as const satisfies Record<Verdict, unknown>;

export const OWNERSHIP: Record<OwnershipSignal, string> = {
  drove: "drove the work",
  contributed: "contributed",
  adjacent: "adjacent to it",
  unclear: "ownership unclear",
};

export const EVIDENCE_KIND: Record<EvidenceKind, string> = {
  transcript: "Interview",
  crustdata: "Employment records",
  github: "GitHub",
  consistency: "Consistency check",
};

/** Fixed display order for the counts strip. */
export const VERDICT_ORDER: Verdict[] = ["green", "yellow", "red", "unverified"];
