import { useEffect, useRef, useState } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
} from "@assistant-ui/react";
import { useChatAdapter } from "../../hooks/useChatAdapter.js";
import { ChatThread } from "./ChatThread.jsx";

export default function AiChatStep({ sessionId, seed }) {
  const { adapter, finalSpec, error } = useChatAdapter({ sessionId, seed });
  const runtime = useLocalRuntime(adapter);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

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
