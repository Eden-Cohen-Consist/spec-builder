import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { env, serverRoot } from "../config/env.js";
import type { UsageSession, UsageStore, UsageTurn } from "../types/index.js";

const filePath = resolve(serverRoot, env.USAGE_FILE);
const unsafeKeys = new Set(["__proto__", "constructor", "prototype"]);
let pending = Promise.resolve();

function emptyStore(): UsageStore {
  return Object.create(null) as UsageStore;
}

async function readUsage(): Promise<UsageStore> {
  try {
    const text = await readFile(filePath, "utf8");
    if (!text.trim()) return emptyStore();
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) return emptyStore();

    const store = emptyStore();
    for (const [sessionId, session] of Object.entries(value)) {
      if (
        !unsafeKeys.has(sessionId)
        && session
        && typeof session === "object"
        && Array.isArray((session as UsageSession).turns)
      ) {
        store[sessionId] = session as UsageSession;
      }
    }
    return store;
  } catch {
    return emptyStore();
  }
}

function tokenCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function logExchange(
  sessionId: string,
  turn: UsageTurn,
): Promise<void> {
  if (unsafeKeys.has(sessionId)) throw new Error("Invalid usage session ID");

  const write = pending.then(async () => {
    const store = await readUsage();
    const previous = store[sessionId];
    const previousTotals = previous?.totals ?? {
      turns: 0,
      inputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      totalInputTokens: 0,
      outputTokens: 0,
      thinkingTokens: 0,
    };
    const inputTokens = tokenCount(turn.usage.input_tokens);
    const cacheCreation = tokenCount(turn.usage.cache_creation_input_tokens);
    const cacheRead = tokenCount(turn.usage.cache_read_input_tokens);
    const now = new Date().toISOString();

    store[sessionId] = {
      createdAt: previous?.createdAt ?? turn.timestamp,
      updatedAt: now,
      totals: {
        turns: previousTotals.turns + 1,
        inputTokens: previousTotals.inputTokens + inputTokens,
        cacheCreationInputTokens: previousTotals.cacheCreationInputTokens + cacheCreation,
        cacheReadInputTokens: previousTotals.cacheReadInputTokens + cacheRead,
        totalInputTokens: previousTotals.totalInputTokens + inputTokens + cacheCreation + cacheRead,
        outputTokens: previousTotals.outputTokens + tokenCount(turn.usage.output_tokens),
        thinkingTokens: previousTotals.thinkingTokens
          + tokenCount(turn.usage.output_tokens_details?.thinking_tokens),
      },
      turns: [
        ...(previous?.turns ?? []),
        { turnNumber: (previous?.turns.length ?? 0) + 1, ...turn },
      ],
    };

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  });

  pending = write.catch(() => undefined);
  return write;
}
