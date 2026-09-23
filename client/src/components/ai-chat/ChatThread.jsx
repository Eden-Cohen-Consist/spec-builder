import {
  ComposerPrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import {
  AlertCircle,
  ArrowUp,
  ChevronDown,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { AssistantMessage } from "./AssistantMessage.jsx";
import { FinalSpecCard } from "./FinalSpecCard.jsx";
import { UserMessage } from "./UserMessage.jsx";

export function ChatThread({ locked, finalSpec, error, onCopyFinal, copied }) {
  return (
    <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
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
            <FinalSpecCard
              finalSpec={finalSpec}
              onCopyFinal={onCopyFinal}
              copied={copied}
            />
          )}
        </div>
      </ThreadPrimitive.Viewport>

      <ThreadPrimitive.ScrollToBottom
        aria-label="גלילה להודעה האחרונה"
        className="absolute bottom-20 end-6 flex size-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm hover:text-teal-700 disabled:hidden dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400"
      >
        <ChevronDown className="size-4" />
      </ThreadPrimitive.ScrollToBottom>

      <div className="shrink-0 border-t border-stone-200/80 px-4 py-3 dark:border-stone-800 sm:px-5">
        {error && (
          <div
            role="alert"
            className="mx-auto mb-2 flex max-w-3xl items-center gap-2 text-[13px] text-red-700 dark:text-red-300"
          >
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </div>
        )}
        <ComposerPrimitive.Root className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 focus-within:border-teal-700/40 dark:border-stone-700 dark:bg-stone-900 dark:focus-within:border-teal-400/40">
          <ComposerPrimitive.Input
            disabled={locked}
            rows={1}
            placeholder={locked ? "האפיון הושלם" : "כתבו הודעה…"}
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-6 text-ink outline-none placeholder:text-stone-400 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-stone-500"
          />
          <ComposerPrimitive.Send
            disabled={locked}
            aria-label="שליחת הודעה"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300 dark:disabled:bg-stone-700"
          >
            {locked ? <LockKeyhole className="size-3.5" /> : <ArrowUp className="size-4" />}
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}
