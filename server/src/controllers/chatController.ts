import type { Request, Response } from "express";
import { chatRequestSchema } from "../schemas/chatSchema.js";
import {
  INVALID_TOOL_PAYLOAD,
  streamChat,
  UNEXPECTED_TOOL,
} from "../services/claudeService.js";
import { logExchange } from "../services/usageService.js";
import { logger } from "../logger/index.js";

function sendEvent(response: Response, event: string, data: unknown): void {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

//TODO: parsing should be in middleware
export const chatController = async ( request: Request,response: Response): Promise<void> => { 
  const parsed = chatRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    logger.warn("Invalid chat request", { module: "chatController" });
    response.status(400).json({
      error: "Invalid chat request",
      details: parsed.error.flatten(),//TODO: deprecated - needs changing
    });
    return;
  }

  const sessionId = parsed.data.sessionId;
  logger.info("Chat request received", { module: "chatController", sessionId });

  response.status(200);
  response.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  response.flushHeaders();

  const abortController = new AbortController();
  const abort = () => {
    logger.warn("Chat request aborted", { module: "chatController", sessionId });
    abortController.abort();
  };
  const abortIncompleteRequest = () => {
    if (request.aborted || !request.complete) abort();//TODO: deprecated - needs changing
  };

  request.on("aborted", abort);
  request.on("close", abortIncompleteRequest);
  response.on("close", abort);

  try {
    for await (const event of streamChat(parsed.data, abortController.signal)) {
      if (event.type === "text") {
        sendEvent(response, "text", { delta: event.delta });
      } else if (event.type === "final") {
        sendEvent(response, "final", { specification: event.specification });
        logger.info("Final spec sent", { module: "chatController", sessionId });
      } else {
        try {
          await logExchange(parsed.data.sessionId, event.usageTurn);
        } catch (error) {
          logger.error("Usage persist failed", { module: "chatController", sessionId });
        }
        sendEvent(response, "done", { usage: event.usage });
      }
    }
  } catch (error) {
    if (abortController.signal.aborted || response.destroyed) {
      return;
    }

    logger.error("Chat stream failed", { module: "chatController", sessionId,error });
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
    logger.info("Chat request finished", { module: "chatController", sessionId });
  }
};
