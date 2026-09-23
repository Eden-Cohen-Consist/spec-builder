import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { claude, claudeMaxTokens, claudeModel } from "../config/claude.js";
import { serverRoot } from "../config/env.js";
import type { ChatRequest } from "../schemas/chatSchema.js";
import { finalSpecTool } from "../schemas/finalSpecTool.js";
import type { UsageTurn } from "../types/index.js";

const SYSTEM_PROMPT = readFileSync(
  resolve(serverRoot, "src/prompts/ai-review.md"),
  "utf8",
).trim();


export type ClaudeStreamParams = Parameters<typeof claude.messages.stream>[0];

/** Conversation history plus the current user turn, in Claude message shape. */
export function toClaudeMessages(
  request: ChatRequest,
): Anthropic.MessageParam[] {
  return [...request.history, { role: "user", content: request.turn }];
}

/** Server prompt plus the spec JSON from the client. */
export function toSystemPrompt(request: ChatRequest): string {
  return `${SYSTEM_PROMPT}\n\n${JSON.stringify(request.spec, null, 2)}`;
}

/** Full request body for a single chat turn. */
export function toClaudeStreamParams(
  request: ChatRequest,
): ClaudeStreamParams {
  return {
    model: claudeModel,
    max_tokens: claudeMaxTokens,
    cache_control: { type: "ephemeral", ttl: "1h" },
    thinking: { type: "disabled" },
    system: toSystemPrompt(request),
    tools: [finalSpecTool],
    tool_choice: {
      type: "auto",
      disable_parallel_tool_use: true,
    },
    messages: toClaudeMessages(request),
  };
}

/** Usage-file record for one completed Claude turn. */
export function toUsageTurn(
  request: ChatRequest,
  params: ClaudeStreamParams,
  message: Anthropic.Message,
  toolBlocks: Anthropic.ToolUseBlock[],
  requestId: string | null,
  startedAt: number,
): UsageTurn {
  return {
    timestamp: new Date().toISOString(),
    durationMs: Math.round(performance.now() - startedAt),
    request: {
      model: String(params.model),
      maxTokens: params.max_tokens,
      cacheControl: params.cache_control ?? null,
      thinking: params.thinking ?? null,
      historyMessages: request.history.length,
      historyCharacters: request.history.reduce(
        (total, item) => total + item.content.length,
        0,
      ),
      turnCharacters: request.turn.length,
    },
    response: {
      requestId,
      messageId: message.id,
      model: message.model,
      stopReason: message.stop_reason,
      stopSequence: message.stop_sequence,
      contentTypes: message.content.map((block) => block.type),
      textCharacters: message.content.reduce(
        (total, block) => total + (block.type === "text" ? block.text.length : 0),
        0,
      ),
      toolNames: toolBlocks.map((block) => block.name),
    },
    usage: message.usage,
  };
}
