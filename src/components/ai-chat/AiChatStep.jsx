import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionBarPrimitive,
  AssistantRuntimeProvider,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from "@assistant-ui/react";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronDown,
  Copy,
  LockKeyhole,
  SendHorizontal,
  Sparkles,
} from "lucide-react";

const messageText = (message) =>
  message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

const parseEvent = (block) => {
  const lines = block.split(/\r?\n/);
  const eventType = lines
    .find((line) => line.startsWith("event:"))
    ?.slice(6)
    .trim();
  const value = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n");
  if (!value || value === "[DONE]") return null;
  const payload = JSON.parse(value);
  return { ...payload, type: payload.type ?? eventType };
};

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start py-3">
      <div className="max-w-[84%] rounded-[1.35rem] rounded-ss-md bg-teal-700 px-4 py-3 text-[14px] leading-7 text-white shadow-sm shadow-teal-950/10">
        <MessagePrimitive.Parts>
          {({ part }) =>
            part.type === "text" ? (
              <p className="whitespace-pre-wrap">{part.text}</p>
            ) : null
          }
        </MessagePrimitive.Parts>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="group/message py-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl border border-teal-700/15 bg-teal-50 text-teal-800 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-300">
          <Bot className="size-4" />
        </span>
        <div className="min-w-0 flex-1 border-s border-stone-200 ps-4 dark:border-stone-700">
          <MessagePrimitive.Parts>
            {({ part }) =>
              part.type === "text" ? (
                <p className="whitespace-pre-wrap text-[14.5px] leading-7 text-stone-700 dark:text-stone-200">
                  {part.text}
                </p>
              ) : null
            }
          </MessagePrimitive.Parts>
          <MessagePrimitive.Error>
            <ErrorPrimitive.Root className="mt-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-500/25 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              <ErrorPrimitive.Message />
            </ErrorPrimitive.Root>
          </MessagePrimitive.Error>
          <ActionBarPrimitive.Root className="mt-2 flex opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100">
            <ActionBarPrimitive.Copy
              aria-label="העתקת התשובה"
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-teal-700 dark:hover:bg-stone-800 dark:hover:text-teal-300"
            >
              <Copy className="size-3.5" />
            </ActionBarPrimitive.Copy>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function ChatThread({ locked, finalSpec, error, onCopyFinal, copied }) {
  return (
    <ThreadPrimitive.Root className="relative flex min-h-[590px] flex-col">
      <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto px-5 py-2 sm:px-7">
        <ThreadPrimitive.Empty>
          <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
            <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-teal-700/15 bg-teal-50 text-teal-800 shadow-sm dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-300">
              <Sparkles className="size-6" />
            </span>
            <h2 className="font-display text-[24px] font-black text-ink">
              בואו נדייק את האפיון
            </h2>
            <p className="mt-2 text-[14px] leading-7 text-stone-500 dark:text-stone-400">
              טיוטת המערכת כבר נטענה ברקע. כתבו מה תרצו לחדד, והעוזר ישאל
              שאלות עד שהאפיון הסופי יהיה מוכן.
            </p>
          </div>
        </ThreadPrimitive.Empty>

        <div className="mx-auto w-full max-w-3xl">
          <ThreadPrimitive.Messages>
            {({ message }) =>
              message.role === "user" ? <UserMessage /> : <AssistantMessage />
            }
          </ThreadPrimitive.Messages>

          {finalSpec && (
            <section className="animate-rise my-5 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/65 dark:border-emerald-500/25 dark:bg-emerald-950/20">
              <header className="flex items-center justify-between gap-3 border-b border-emerald-200/70 px-5 py-3 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 text-[14px] font-bold text-emerald-800 dark:text-emerald-300">
                  <Check className="size-4" />
                  האפיון הסופי מוכן
                </div>
                <button
                  type="button"
                  onClick={onCopyFinal}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "הועתק" : "העתקה"}
                </button>
              </header>
              <pre
                dir="rtl"
                className="max-h-[48vh] overflow-auto whitespace-pre-wrap px-5 py-4 font-sans text-[14px] leading-7 text-stone-700 dark:text-stone-200"
              >
                {finalSpec}
              </pre>
            </section>
          )}
        </div>
      </ThreadPrimitive.Viewport>

      <ThreadPrimitive.ScrollToBottom
        aria-label="גלילה להודעה האחרונה"
        className="absolute bottom-28 end-6 flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-md transition-colors hover:text-teal-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400"
      >
        <ChevronDown className="size-4" />
      </ThreadPrimitive.ScrollToBottom>

      <div className="border-t border-stone-200/80 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/35 sm:p-5">
        {error && (
          <div
            role="alert"
            className="mx-auto mb-3 flex max-w-3xl items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-500/25 dark:bg-red-950/30 dark:text-red-300"
          >
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}
        <ComposerPrimitive.Root className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm transition-shadow focus-within:border-teal-700/35 focus-within:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:focus-within:border-teal-400/35">
          <ComposerPrimitive.Input
            disabled={locked}
            rows={1}
            placeholder={locked ? "האפיון הושלם" : "כתבו הודעה…"}
            className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-6 text-ink outline-none placeholder:text-stone-400 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-stone-500"
          />
          <ComposerPrimitive.Send
            disabled={locked}
            aria-label="שליחת הודעה"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm transition-all hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300 dark:disabled:bg-stone-700"
          >
            {locked ? <LockKeyhole className="size-4" /> : <SendHorizontal className="size-4" />}
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}

export default function AiChatStep({ sessionId, seed }) {
  const [finalSpec, setFinalSpec] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const adapter = useMemo(
    () => ({
      async *run({ messages, abortSignal }) {
        setError("");
        const visible = messages
          .filter((message) => message.role === "user" || message.role === "assistant")
          .map((message) => ({ role: message.role, content: messageText(message) }))
          .filter((message) => message.content);
        const current = visible.at(-1);

        let response;
        try {
          response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortSignal,
            body: JSON.stringify({
              sessionId,
              seed: { systemPrompt: seed, context: "" },
              history: visible.slice(0, -1),
              turn: current?.content ?? "",
            }),
          });
        } catch {
          setError("לא ניתן להתחבר לשירות ה-AI. בדקו שהשרת פעיל ונסו שוב.");
          throw new Error("החיבור לשירות ה-AI נכשל");
        }

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => null);
          const message =
            response.status === 429
              ? "הגעתם למגבלת הבקשות. המתינו מעט ונסו שוב."
              : payload?.error ?? "שירות ה-AI לא הצליח להשלים את הבקשה.";
          setError(message);
          throw new Error(message);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";

        try {
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
              const event = parseEvent(block);
              if (!event) continue;
              if (event.type === "text") {
                text += event.delta ?? event.text ?? "";
                yield { content: [{ type: "text", text }] };
              } else if (event.type === "final") {
                const specification = event.specification ?? "";
                setFinalSpec(specification);
                yield {
                  content: [
                    {
                      type: "text",
                      text: text || "האפיון הסופי מוכן ומוצג בהמשך השיחה.",
                    },
                  ],
                };
              } else if (event.type === "error") {
                throw new Error(
                  event.code === "invalid_tool_payload"
                    ? "התקבל אפיון סופי במבנה לא תקין. נסו לשלוח שוב."
                    : "שירות ה-AI לא הצליח להשלים את התשובה. נסו שוב.",
                );
              }
            }

            if (done) break;
          }
        } catch (streamError) {
          if (abortSignal.aborted) return;
          const message = streamError instanceof SyntaxError
            ? "התקבלה תשובה לא תקינה משירות ה-AI."
            : streamError instanceof Error
              ? streamError.message
              : "הזרמת התשובה הופסקה.";
          setError(message);
          throw new Error(message);
        }
      },
    }),
    [seed, sessionId],
  );

  const runtime = useLocalRuntime(adapter);

  const copyFinal = async () => {
    try {
      await navigator.clipboard.writeText(finalSpec);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = finalSpec;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="animate-rise pt-8" aria-label="שיחה עם ה-AI">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-xl shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:shadow-black/20">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-teal-400 via-teal-700 to-emerald-500" />
        <header className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4 dark:border-stone-800 sm:px-7">
          <div>
            <p className="text-[11px] font-black tracking-[0.14em] text-teal-700 dark:text-teal-300">
              שלב 4 · סביבת גיבוש
            </p>
            <h1 className="mt-1 font-display text-[23px] font-black text-ink">
              שיחה עם ה-AI
            </h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            הטיוטה נטענה
          </span>
        </header>

        <AssistantRuntimeProvider runtime={runtime}>
          <ChatThread
            locked={Boolean(finalSpec)}
            finalSpec={finalSpec}
            error={error}
            onCopyFinal={copyFinal}
            copied={copied}
          />
        </AssistantRuntimeProvider>
      </div>
    </section>
  );
}
