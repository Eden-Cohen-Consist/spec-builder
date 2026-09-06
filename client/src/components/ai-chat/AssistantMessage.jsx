import {
  ActionBarPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { AlertCircle, Bot, Copy } from "lucide-react";

export function AssistantMessage() {
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
