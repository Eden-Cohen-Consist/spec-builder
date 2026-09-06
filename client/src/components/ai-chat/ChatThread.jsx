import {
  ComposerPrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import {
  AlertCircle,
  ChevronDown,
  LockKeyhole,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { AssistantMessage } from "./AssistantMessage.jsx";
import { FinalSpecCard } from "./FinalSpecCard.jsx";
import { UserMessage } from "./UserMessage.jsx";

export function ChatThread({ locked, finalSpec, error, onCopyFinal, copied }) {
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
