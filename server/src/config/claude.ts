import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env.js";

export const claude = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
export const claudeModel = env.ANTHROPIC_MODEL;
export const claudeMaxTokens = env.MAX_TOKENS;
