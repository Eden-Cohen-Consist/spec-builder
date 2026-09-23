import type { Request, Response } from "express";
import { chatRequestSchema } from "../schemas/chatSchema.js";
import {
  INVALID_TOOL_PAYLOAD,
  streamChat,
  UNEXPECTED_TOOL,
} from "../services/claudeService.js";
import { logExchange } from "../services/usageService.js";
import { logger } from "../logger/index.js";

function logChat(event: string, data: unknown): void {
  logger.info(`[chat] ${event} ${JSON.stringify(data)}`);
}

function sendEvent(response: Response, event: string, data: unknown): void {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

//TODO: need changing to the real system prompt later
export const chatController = async ( request: Request,response: Response): Promise<void> => { 
  const startedAt = performance.now();
  const parsed = chatRequestSchema.safeParse(request.body);//TODO: parsing should be in middleware
  if (!parsed.success) {
    logChat("request_invalid", { issues: parsed.error.issues.length });
    response.status(400).json({
      error: "Invalid chat request",
      details: parsed.error.flatten(),//TODO: deprecated - needs changing
    });
    return;
  }

  const sessionId = parsed.data.sessionId;
  logChat("request_received", {
    sessionId,
    historyMessages: parsed.data.history.length,
    turnCharacters: parsed.data.turn.length,
  });

  response.status(200);
  response.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  response.flushHeaders();
  logChat("sse_headers_sent", {
    sessionId,
    elapsedMs: Math.round(performance.now() - startedAt),
  });

  const abortController = new AbortController();
  const abort = () => {
    logChat("request_aborted", {
      sessionId,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
    abortController.abort();
  };
  const abortIncompleteRequest = () => {
    if (request.aborted || !request.complete) abort();//TODO: deprecated - needs changing
  };

  request.on("aborted", abort);
  request.on("close", abortIncompleteRequest);
  response.on("close", abort);

  try {
    let textEvents = 0;
    for await (const event of streamChat(parsed.data, abortController.signal)) {
      if (event.type === "text") {
        sendEvent(response, "text", { delta: event.delta });
        textEvents += 1;
        if (textEvents === 1) {
          logChat("first_text_sent_to_client", {
            sessionId,
            elapsedMs: Math.round(performance.now() - startedAt),
            deltaCharacters: event.delta.length,
          });
        }
      } else if (event.type === "final") {
        sendEvent(response, "final", { specification: event.specification });
        logChat("final_spec_sent_to_client", {
          sessionId,
          elapsedMs: Math.round(performance.now() - startedAt),
          specificationCharacters: event.specification.length,
        });
      } else {
        const usageStartedAt = performance.now();
        logChat("usage_write_started", { sessionId, usage: event.usage });
        try {
          await logExchange(parsed.data.sessionId, event.usageTurn);
          logChat("usage_write_finished", {
            sessionId,
            durationMs: Math.round(performance.now() - usageStartedAt),
          });
        } catch (error) {
          logChat("usage_write_failed", {
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        sendEvent(response, "done", { usage: event.usage });
        logChat("done_sent_to_client", {
          sessionId,
          elapsedMs: Math.round(performance.now() - startedAt),
          textEvents,
        });
      }
    }
  } catch (error) {
    if (abortController.signal.aborted || response.destroyed) {
      logChat("stream_stopped_after_abort", { sessionId });
      return;
    }

    logChat("stream_failed", {
      sessionId,
      elapsedMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error),
    });
    const invalidTool = error instanceof Error
      && (error.name === INVALID_TOOL_PAYLOAD || error.name === UNEXPECTED_TOOL);
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
    logChat("request_finished", {
      sessionId,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
  }
};
