/**
 * Model selection. Dev runs on Haiku (fast + cheap for the build loop),
 * the demo runs on Opus 5.
 *
 * Flip with MODEL_TIER=demo in .env.local, or leave unset for dev.
 *
 * The two tiers do NOT take the same parameters, which is why this lives
 * behind a helper instead of a bare model string:
 *   - Opus 5 accepts `output_config.effort` and has thinking on by default.
 *   - Haiku 4.5 rejects `effort` outright, so we omit it entirely.
 * Neither accepts temperature / top_p / top_k.
 */

export type Task = "interview" | "verify" | "report" | "parse";

const TIER = process.env.MODEL_TIER === "demo" ? "demo" : "dev";

/** Per-task effort on Opus 5. Interview turns are conversational and need to
 *  come back fast; the report is the deliverable and gets the deep pass. */
const DEMO_EFFORT: Record<Task, "low" | "medium" | "high"> = {
  interview: "low",
  verify: "medium",
  report: "high",
  // A candidate is waiting on the apply screen; medium is plenty for extraction.
  parse: "medium",
};

const MAX_TOKENS: Record<Task, number> = {
  interview: 1024,
  verify: 4096,
  report: 16000,
  parse: 8192,
};

/**
 * Base request params for a task. Spread into `messages.create()` and add
 * `messages`, `system`, `tools`, `output_config.format` as needed.
 *
 * Note: on Opus 5, max_tokens caps thinking AND response text together —
 * that's why the report budget is generous.
 */
export function modelParams(
  task: Task,
  jsonSchema?: Record<string, unknown>,
) {
  const format = jsonSchema
    ? { format: { type: "json_schema" as const, schema: jsonSchema } }
    : undefined;

  if (TIER === "demo") {
    return {
      model: "claude-opus-5",
      max_tokens: MAX_TOKENS[task],
      output_config: { effort: DEMO_EFFORT[task], ...format },
    };
  }
  return {
    model: "claude-haiku-4-5",
    max_tokens: MAX_TOKENS[task],
    // Haiku rejects `effort`; the format constraint is still supported.
    ...(format ? { output_config: format } : {}),
  };
}

/** Pull the first text block out of a response and parse it as JSON.
 *  Safe because every caller that uses this passes a json_schema format. */
export function parseStructured<T>(content: { type: string }[]): T {
  const block = content.find((b) => b.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  if (!block) throw new Error("Model returned no text block");
  return JSON.parse(block.text) as T;
}

export const isDemoTier = TIER === "demo";
