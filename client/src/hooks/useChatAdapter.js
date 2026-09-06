import { useMemo, useState } from "react";
import { ChatApiError, streamChat } from "../api/chatApi.js";

const messageText = (message) =>
  message.content.filter((part) => part.type === "text").map((part) => part.text).join("");

const toUserMessage = (error) => {
  if (error instanceof ChatApiError) {
    if (error.message === "connection_failed") {
      return "לא ניתן להתחבר לשירות ה-AI. בדקו שהשרת פעיל ונסו שוב.";
    }
    if (error.status === 429) {
      return "הגעתם למגבלת הבקשות. המתינו מעט ונסו שוב.";
    }
    if (error.message === "invalid_response") {
      return "התקבלה תשובה לא תקינה משירות ה-AI.";
    }
    if (error.code === "invalid_tool_payload") {
      return "התקבל אפיון סופי במבנה לא תקין. נסו לשלוח שוב.";
    }
    if (error.message === "stream_error") {
      return "שירות ה-AI לא הצליח להשלים את התשובה. נסו שוב.";
    }
    if (error.message !== "request_failed") {
      return error.message;
    }
    return "שירות ה-AI לא הצליח להשלים את הבקשה.";
  }
  if (error instanceof SyntaxError) {
    return "התקבלה תשובה לא תקינה משירות ה-AI.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "הזרמת התשובה הופסקה.";
};

export function useChatAdapter({ sessionId, seed }) {
  const [finalSpec, setFinalSpec] = useState("");
  const [error, setError] = useState("");

  const adapter = useMemo(
    () => ({
      async *run({ messages, abortSignal }) {
        setError("");
        const visible = messages
          .filter(
            (message) =>
              message.role === "user" || message.role === "assistant",
          )
          .map((message) => ({
            role: message.role,
            content: messageText(message),
          }))
          .filter((message) => message.content);
        const current = visible.at(-1);

        let text = "";

        try {
          for await (const event of streamChat({
            sessionId,
            seed,
            history: visible.slice(0, -1),
            turn: current?.content ?? "",
            signal: abortSignal,
          })) {
            if (event.type === "text") {
              text += event.delta;
              yield { content: [{ type: "text", text }] };
            } else if (event.type === "final") {
              setFinalSpec(event.specification);
              yield {
                content: [
                  {
                    type: "text",
                    text:
                      text || "האפיון הסופי מוכן ומוצג בהמשך השיחה.",
                  },
                ],
              };
            }
          }
        } catch (streamError) {
          if (abortSignal.aborted) return;
          const message = toUserMessage(streamError);
          setError(message);
          throw new Error(message);
        }
      },
    }),
    [seed, sessionId],
  );

  return { adapter, finalSpec, error };
}
