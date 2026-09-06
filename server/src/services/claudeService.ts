import type Anthropic from "@anthropic-ai/sdk";
import {
  claude,
  claudeMaxTokens,
  claudeModel,
} from "../config/claude.js";
import type { ChatRequest } from "../schemas/chatSchema.js";
import { finalSpecSchema, finalSpecTool } from "../schemas/finalSpecTool.js";
import type { ChatStreamEvent } from "../types/index.js";

const FINAL_TOOL_NAME = "submit_final_spec";
const FINAL_INSTRUCTION = "Ask clarifying questions as normal text. When the complete specification is ready, call submit_final_spec exactly once; never output the complete final specification as normal text.";

export const INVALID_TOOL_PAYLOAD = "InvalidToolPayload";
export const UNEXPECTED_TOOL = "UnexpectedTool";

function serviceError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

export async function* streamChat( request: ChatRequest,signal?: AbortSignal ): AsyncGenerator<ChatStreamEvent> {
  const messages: Anthropic.MessageParam[] = [
    ...request.history,
    { role: "user", content: request.turn },
  ];
  
  const system = request.seed
    ? `${FINAL_INSTRUCTION}\n\n${request.seed.systemPrompt}\n\nHidden project context:\n${request.seed.context}`
    : FINAL_INSTRUCTION;

  const params = {
    model: claudeModel,
    max_tokens: claudeMaxTokens,
    system,
    tools: [finalSpecTool],
    tool_choice: {
      type: "auto" as const,
      disable_parallel_tool_use: true,
    },
    messages,
  };

  const stream = claude.messages.stream(params, { signal });

  for await (const event of stream) {
    if ( event.type === "content_block_delta" && event.delta.type === "text_delta" ) {
      yield { type: "text", delta: event.delta.text };
    }
  }

  const message = await stream.finalMessage();
  
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
    
    if (!parsed.success) {
      throw serviceError(INVALID_TOOL_PAYLOAD,"Invalid final specification payload");
    }
    yield { type: "final", specification: parsed.data.specification };
  }

  yield {
    type: "done",
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  };
}
