import type Anthropic from "@anthropic-ai/sdk";
import { claude } from "../config/claude.js";
import type { ChatRequest } from "../schemas/chatSchema.js";
import { finalSpecSchema } from "../schemas/finalSpecTool.js";
import { toClaudeStreamParams } from "../transformers/claudeTransformer.js";
import type { ChatStreamEvent, UsageTurn } from "../types/index.js";
import { logger } from "../logger/index.js";

const FINAL_TOOL_NAME = "submit_final_spec";

export const INVALID_TOOL_PAYLOAD = "InvalidToolPayload";
export const UNEXPECTED_TOOL = "UnexpectedTool";

function logClaude(event: string, data: unknown): void {
  logger.info(`[claude] ${event} ${JSON.stringify(data)}`);
}

function serviceError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

export async function* streamChat( request: ChatRequest,signal?: AbortSignal ): AsyncGenerator<ChatStreamEvent> {
  const startedAt = performance.now();
  const claudeStreamParams = toClaudeStreamParams(request);
  logClaude("request_starting", {
    sessionId: request.sessionId,
    model: claudeStreamParams.model,
    maxTokens: claudeStreamParams.max_tokens,
    messageCount: claudeStreamParams.messages.length,
    cacheControl: claudeStreamParams.cache_control,
    thinking: claudeStreamParams.thinking,
  });
  const stream = claude.messages.stream(claudeStreamParams, { signal });

  let eventCount = 0;
  let textDeltaCount = 0;
  const seenDeltaTypes = new Set<string>();

  for await (const event of stream) {
    eventCount += 1;
    if (event.type !== "content_block_delta") {
      logClaude("stream_event", {
        sessionId: request.sessionId,
        elapsedMs: Math.round(performance.now() - startedAt),
        event,
      });
    } else {
      if (!seenDeltaTypes.has(event.delta.type)) {
        seenDeltaTypes.add(event.delta.type);
        logClaude("first_delta_of_type", {
          sessionId: request.sessionId,
          elapsedMs: Math.round(performance.now() - startedAt),
          deltaType: event.delta.type,
          deltaKeys: Object.keys(event.delta),
        });
      }
    }

    if ( event.type === "content_block_delta" && event.delta.type === "text_delta" ) {
      textDeltaCount += 1;
      yield { type: "text", delta: event.delta.text };
    }
  }

  logClaude("stream_iteration_finished", {
    sessionId: request.sessionId,
    elapsedMs: Math.round(performance.now() - startedAt),
    eventCount,
    textDeltaCount,
  });

  const finalMessageStartedAt = performance.now();
  logClaude("final_message_wait_start", { sessionId: request.sessionId });
  const message = await stream.finalMessage();
  logClaude("final_message_received", {
    sessionId: request.sessionId,
    waitMs: Math.round(performance.now() - finalMessageStartedAt),
    elapsedMs: Math.round(performance.now() - startedAt),
    message: {
      keys: Object.keys(message),
      id: message.id,
      model: message.model,
      stopReason: message.stop_reason,
      stopSequence: message.stop_sequence,
      stopDetails: message.stop_details,
      usage: message.usage,
      contentBlocks: message.content.map((block) => ({
        type: block.type,
        keys: Object.keys(block),
        ...(block.type === "tool_use"
          ? { name: block.name, inputKeys: Object.keys(block.input as object) }
          : {}),
      })),
    },
  });
  
  if (message.stop_reason === "refusal") {
    throw new Error("Claude refused the request");
  }

  if (message.stop_reason === "max_tokens") {
    throw new Error("Claude reached the response token limit");
  }

  const toolBlocks: Array<Anthropic.ToolUseBlock> = [];

  for (const block of message.content) {
    if (block.type === "tool_use") toolBlocks.push(block);
  }

  const unexpected = toolBlocks.find((block) => block.name !== FINAL_TOOL_NAME);
  if (unexpected) {
    throw serviceError(UNEXPECTED_TOOL, `Unexpected tool: ${unexpected.name}`);
  }

  if (toolBlocks.length > 1) {
    throw serviceError(UNEXPECTED_TOOL, "Multiple final specification tools received");
  }

  const finalBlock = toolBlocks[0];
  if (finalBlock) {
    const parsed = finalSpecSchema.safeParse(finalBlock.input);
    logClaude("final_tool_checked", {
      sessionId: request.sessionId,
      toolName: finalBlock.name,
      valid: parsed.success,
    });
    
    if (!parsed.success) {
      throw serviceError(INVALID_TOOL_PAYLOAD,"Invalid final specification payload");
    }
    yield { type: "final", specification: parsed.data.specification };
  }

  const usageTurn: UsageTurn = {
    timestamp: new Date().toISOString(),
    durationMs: Math.round(performance.now() - startedAt),
    request: {
      model: String(claudeStreamParams.model),
      maxTokens: claudeStreamParams.max_tokens,
      cacheControl: claudeStreamParams.cache_control ?? null,
      thinking: claudeStreamParams.thinking ?? null,
      historyMessages: request.history.length,
      historyCharacters: request.history.reduce(
        (total, item) => total + item.content.length,
        0,
      ),
      turnCharacters: request.turn.length,
    },
    response: {
      requestId: stream.request_id ?? null,
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

  yield {
    type: "done",
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
    usageTurn,
  };
}
