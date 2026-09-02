import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export const serverRoot = fileURLToPath(new URL("../../", import.meta.url));

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  ANTHROPIC_MODEL: z.string().default("claude-opus-5"),
  MAX_TOKENS: z.coerce.number().int().positive().default(64_000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  PORT: z.coerce.number().int().positive().default(3001),
  USAGE_FILE: z.string().default("data/usage.json"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  dotenv.config({ path: resolve(serverRoot, ".env"), quiet: true });
  return envSchema.parse(process.env);
}
