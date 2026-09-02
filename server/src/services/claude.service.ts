import Anthropic from "@anthropic-ai/sdk";
import type { ChatRequest } from "../schemas/chat.schema.js";
import { finalSpecSchema, finalSpecTool } from "../schemas/finalSpec.tool.js";
import type { ChatStreamEvent } from "../types/index.js";

const FINAL_TOOL_NAME = "submit_final_spec";
const FINAL_INSTRUCTION =
  "Ask clarifying questions as normal text. When the complete specification is ready, call submit_final_spec exactly once; never output the complete final specification as normal text.";

export class InvalidToolPayloadError extends Error {}
export class UnexpectedToolError extends Error {}
export class IncompleteResponseError extends Error {}

export class ClaudeService {
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
    private readonly maxTokens: number,
  ) {}

  async *streamChat(
    request: ChatRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatStreamEvent> {
    const messages: Anthropic.MessageParam[] = [
      ...request.history,
      { role: "user", content: request.turn },
    ];
    const seededSystem = request.seed
      ? `${FINAL_INSTRUCTION}\n\n${request.seed.systemPrompt}\n\nHidden project context:\n${request.seed.context}`
      : FINAL_INSTRUCTION;

    const params = {
      model: this.model,
      max_tokens: this.maxTokens,
      system: seededSystem,
      tools: [finalSpecTool],
      tool_choice: {
        type: "auto" as const,
        disable_parallel_tool_use: true,
      },
      messages,
    };
    const stream = this.model === "claude-opus-5"
      ? this.client.beta.messages.stream({
          ...params,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          thinking: { type: "adaptive" },
        }, { signal })
      : this.client.messages.stream(params, { signal });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta"
        && event.delta.type === "text_delta"
      ) {
        yield { type: "text", delta: event.delta.text };
      }
    }

    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") {
      throw new IncompleteResponseError("Claude refused the request");
    }
    if (message.stop_reason === "max_tokens") {
      throw new IncompleteResponseError("Claude reached the response token limit");
    }

    const toolBlocks: Array<
      Anthropic.ToolUseBlock | Anthropic.Beta.BetaToolUseBlock
    > = [];
    for (const block of message.content) {
      if (block.type === "tool_use") toolBlocks.push(block);
    }
    const unexpected = toolBlocks.find((block) => block.name !== FINAL_TOOL_NAME);
    if (unexpected) {
      throw new UnexpectedToolError(`Unexpected tool: ${unexpected.name}`);
    }
    if (toolBlocks.length > 1) {
      throw new UnexpectedToolError("Multiple final specification tools received");
    }

    const finalBlock = toolBlocks[0];
    if (finalBlock) {
      const parsed = finalSpecSchema.safeParse(finalBlock.input);
      if (!parsed.success) {
        throw new InvalidToolPayloadError("Invalid final specification payload");
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
}
