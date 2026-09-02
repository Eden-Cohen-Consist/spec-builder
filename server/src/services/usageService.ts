import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { env, serverRoot } from "../config/env.js";
import type { TokenUsage, UsageRecord, UsageStore } from "../types/index.js";

const filePath = resolve(serverRoot, env.USAGE_FILE);
const unsafeKeys = new Set(["__proto__", "constructor", "prototype"]);
let pending = Promise.resolve();

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString() === value;
}

function sanitizeRecord(value: unknown): UsageRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;

  const record = value as Record<string, unknown>;
  if (
    !isCount(record.inputTokens)
    || !isCount(record.outputTokens)
    || !isCount(record.messageCount)
    || !isTimestamp(record.timestamp)
  ) {
    return;
  }

  return {
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    messageCount: record.messageCount,
    timestamp: record.timestamp,
  };
}

async function readUsage(): Promise<UsageStore> {
  try {
    const value: unknown = JSON.parse(await readFile(filePath, "utf8"));
    const store = Object.create(null) as UsageStore;
    if (!value || typeof value !== "object" || Array.isArray(value)) return store;

    for (const [sessionId, rawRecord] of Object.entries(value)) {
      if (unsafeKeys.has(sessionId)) continue;
      const record = sanitizeRecord(rawRecord);
      if (record) store[sessionId] = record;
    }
    return store;
  } catch {
    return Object.create(null) as UsageStore;
  }
}

export async function logExchange(
  sessionId: string,
  usage: TokenUsage,
): Promise<void> {
  if (unsafeKeys.has(sessionId)) throw new Error("Invalid usage session ID");
  if (!isCount(usage.inputTokens) || !isCount(usage.outputTokens)) {
    throw new Error("Invalid token usage");
  }

  const write = pending.then(async () => {
    const store = await readUsage();
    const previous = store[sessionId];
    const inputTokens = (previous?.inputTokens ?? 0) + usage.inputTokens;
    const outputTokens = (previous?.outputTokens ?? 0) + usage.outputTokens;
    const messageCount = (previous?.messageCount ?? 0) + 1;

    if (!isCount(inputTokens) || !isCount(outputTokens) || !isCount(messageCount)) {
      throw new Error("Usage counter overflow");
    }

    store[sessionId] = {
      inputTokens,
      outputTokens,
      messageCount,
      timestamp: new Date().toISOString(),
    };

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  });

  pending = write.catch(() => undefined);
  return write;
}
