import type { RequestHandler, Response } from "express";
import { chatRequestSchema } from "../schemas/chat.schema.js";
import {
  InvalidToolPayloadError,
  UnexpectedToolError,
  type ClaudeService,
} from "../services/claude.service.js";
import type { UsageService } from "../services/usage.service.js";

type ChatDependencies = {
  claude: Pick<ClaudeService, "streamChat">;
  usage: Pick<UsageService, "logExchange">;
};

// SSE contract (provider events are never forwarded):
// text  -> {"delta": string}
// final -> {"specification": string}
// done  -> {"usage": {"inputTokens": number, "outputTokens": number}}
// error -> {"code": string, "message": string}
function sendEvent(response: Response, event: string, data: unknown): void {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function createChatController(
  { claude, usage }: ChatDependencies,
): RequestHandler {
  return async (request, response) => {
    const parsed = chatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid chat request",
        details: parsed.error.flatten(),
      });
      return;
    }

    response.status(200);
    response.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    response.flushHeaders();

    const abortController = new AbortController();
    const abort = () => abortController.abort();
    const abortIncompleteRequest = () => {
      if (request.aborted || !request.complete) abort();
    };
    request.on("aborted", abort);
    request.on("close", abortIncompleteRequest);
    response.on("close", abort);

    try {
      for await (
        const event of claude.streamChat(parsed.data, abortController.signal)
      ) {
        if (event.type === "text") {
          sendEvent(response, "text", { delta: event.delta });
        } else if (event.type === "final") {
          sendEvent(response, "final", { specification: event.specification });
        } else {
          try {
            await usage.logExchange(parsed.data.sessionId, event.usage);
          } catch (error) {
            console.error("Failed to write chat usage", error);
          }
          sendEvent(response, "done", { usage: event.usage });
        }
      }
    } catch (error) {
      if (abortController.signal.aborted || response.destroyed) return;

      console.error("Chat provider stream failed", error);
      const invalidTool = error instanceof InvalidToolPayloadError
        || error instanceof UnexpectedToolError;
      sendEvent(response, "error", {
        code: invalidTool ? "invalid_tool_payload" : "provider_error",
        message: invalidTool
          ? "Claude returned an invalid final specification"
          : "Unable to complete the Claude response",
      });
    } finally {
      request.off("aborted", abort);
      request.off("close", abortIncompleteRequest);
      response.off("close", abort);
      if (!response.writableEnded && !response.destroyed) response.end();
    }
  };
}
