import Anthropic from "@anthropic-ai/sdk";

/** Shared client. Reads ANTHROPIC_API_KEY from the environment. */
export const anthropic = new Anthropic();
