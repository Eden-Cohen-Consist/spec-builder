import type Anthropic from "@anthropic-ai/sdk";

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type UsageTurn = {
  timestamp: string;
  durationMs: number;
  request: {
    model: string;
    maxTokens: number;
    cacheControl: Anthropic.CacheControlEphemeral | null;
    thinking: Anthropic.ThinkingConfigParam | null;
    historyMessages: number;
    historyCharacters: number;
    turnCharacters: number;
  };
  response: {
    requestId: string | null;
    messageId: string;
    model: string;
    stopReason: Anthropic.Message["stop_reason"];
    stopSequence: string | null;
    contentTypes: string[];
    textCharacters: number;
    toolNames: string[];
  };
  usage: Anthropic.Usage;
};

export type ChatStreamEvent =
  | { type: "text"; delta: string }
  | { type: "final"; specification: string }
  | { type: "done"; usage: TokenUsage; usageTurn: UsageTurn };

export type UsageTotals = {
  turns: number;
  inputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  totalInputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
};

export type UsageSession = {
  createdAt: string;
  updatedAt: string;
  totals: UsageTotals;
  turns: Array<UsageTurn & { turnNumber: number }>;
};

export type UsageStore = Record<string, UsageSession>;
