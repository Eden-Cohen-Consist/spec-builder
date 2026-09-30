import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const serverRoot = fileURLToPath(new URL("../../", import.meta.url));

dotenv.config({ path: resolve(serverRoot, ".env"), quiet: true });

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const env = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
  MAX_TOKENS: numberFromEnv("MAX_TOKENS", 64_000),
  RATE_LIMIT_WINDOW_MS: numberFromEnv("RATE_LIMIT_WINDOW_MS", 60_000),
  RATE_LIMIT_MAX: numberFromEnv("RATE_LIMIT_MAX", 20),
  PORT: numberFromEnv("PORT", 3001),
  USAGE_FILE: process.env.USAGE_FILE ?? "data/usage.json",
};
