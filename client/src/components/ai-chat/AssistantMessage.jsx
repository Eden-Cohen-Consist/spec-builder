import {
  ActionBarPrimitive,
  AuiIf,
  ErrorPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { AlertCircle, Check, Copy } from "lucide-react";
import { MarkdownText } from "./MarkdownText.jsx";

export function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="group flex flex-col items-end gap-1 py-2">
      <AuiIf
        condition={({ message }) =>
          message.content.some(
            (part) => part.type === "text" && part.text.length > 0,
          )
        }
      >
        <div className="flex max-w-[84%] flex-col items-end gap-1">
          <div className="rounded-2xl bg-stone-100 px-3.5 py-2 text-[14px] leading-6 text-stone-800 dark:bg-stone-800 dark:text-stone-100">
            <MessagePrimitive.Parts>
              {({ part }) => (part.type === "text" ? <MarkdownText /> : null)}
            </MessagePrimitive.Parts>
          </div>
          <ActionBarPrimitive.Root className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <ActionBarPrimitive.Copy
              aria-label="העתקת התשובה"
              className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-teal-700 dark:hover:bg-stone-800 dark:hover:text-teal-300"
            >
              <AuiIf condition={({ message }) => message.isCopied}>
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </AuiIf>
              <AuiIf condition={({ message }) => !message.isCopied}>
                <Copy className="size-3.5" />
              </AuiIf>
            </ActionBarPrimitive.Copy>
          </ActionBarPrimitive.Root>
        </div>
      </AuiIf>
      <AuiIf
        condition={({ message }) =>
          message.status.type === "running" &&
          !message.content.some(
            (part) => part.type === "text" && part.text.length > 0,
          )
        }
      >
        <span
          className="relative my-2 me-1 flex size-3 items-center justify-center"
          role="status"
          aria-label="העוזר חושב"
        >
          <span className="absolute size-3 animate-ping rounded-full bg-stone-400/45 dark:bg-stone-500/60" />
          <span className="size-1.5 rounded-full bg-stone-500 dark:bg-stone-300" />
        </span>
      </AuiIf>
      <MessagePrimitive.Error>
        <ErrorPrimitive.Root className="flex items-center gap-2 text-[13px] text-red-700 dark:text-red-300">
          <AlertCircle className="size-3.5 shrink-0" />
          <ErrorPrimitive.Message />
        </ErrorPrimitive.Root>
      </MessagePrimitive.Error>
    </MessagePrimitive.Root>
  );
}
