import type Anthropic from "@anthropic-ai/sdk";
import { claude, claudeMaxTokens, claudeModel } from "../config/claude.js";
import type { ChatRequest } from "../schemas/chatSchema.js";
import { finalSpecTool } from "../schemas/finalSpecTool.js";

export const FINAL_INSTRUCTION = "Ask clarifying questions as normal text. When the complete specification is ready, call submit_final_spec exactly once; never output the complete final specification as normal text.";

export type ClaudeStreamParams = Parameters<typeof claude.messages.stream>[0];

/** Conversation history plus the current user turn, in Claude message shape. */
export function toClaudeMessages(
  request: ChatRequest,
): Anthropic.MessageParam[] {
  return [...request.history, { role: "user", content: request.turn }];
}

/** Final-spec protocol instruction, followed by the wizard seed when present. */
export function toSystemPrompt(request: ChatRequest): string { //TODO: need changing to the real system prompt later
  if (!request.seed) return "";

  return `${request.seed.systemPrompt}\n\n${request.seed.context}`;
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
