export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type ChatStreamEvent =
  | { type: "text"; delta: string }
  | { type: "final"; specification: string }
  | { type: "done"; usage: TokenUsage };

export type UsageRecord = TokenUsage & {
  messageCount: number;
  timestamp: string;
};

export type UsageStore = Record<string, UsageRecord>;
