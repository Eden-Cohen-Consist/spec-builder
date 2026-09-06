const parseEvent = (block) => {
  const lines = block.split(/\r?\n/);
  const eventType = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
  const value = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
  if (!value || value === "[DONE]") return null;
  const payload = JSON.parse(value);
  return { ...payload, type: payload.type ?? eventType };
};

export class ChatApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Streams chat events from POST /api/chat (SSE).
 * Yields: { type: "text", delta }, { type: "final", specification }, { type: "done", usage }
 */
export async function* streamChat({
  sessionId,
  seed,
  history,
  turn,
  signal,
}) {
  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        sessionId,
        seed: { systemPrompt: seed, context: "" },
        history,
        turn,
      }),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ChatApiError("connection_failed");
  }

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new ChatApiError(payload?.error ?? "request_failed", {
      status: response.status,
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    if (done && buffer.trim()) {
      blocks.push(buffer);
      buffer = "";
    }

    for (const block of blocks) {
      let event;
      try {
        event = parseEvent(block);
      } catch {
        throw new ChatApiError("invalid_response");
      }
      if (!event) continue;

      if (event.type === "text") {
        yield { type: "text", delta: event.delta ?? event.text ?? "" };
      } else if (event.type === "final") {
        yield {
          type: "final",
          specification: event.specification ?? "",
        };
      } else if (event.type === "done") {
        yield { type: "done", usage: event.usage };
      } else if (event.type === "error") {
        throw new ChatApiError("stream_error", { code: event.code });
      }
    }

    if (done) break;
  }
}
