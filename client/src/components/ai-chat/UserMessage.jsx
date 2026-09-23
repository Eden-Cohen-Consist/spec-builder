import {
  ActionBarPrimitive,
  AuiIf,
  MessagePrimitive,
} from "@assistant-ui/react";
import { Check, Copy } from "lucide-react";

export function UserMessage() {
  return (
    <MessagePrimitive.Root className="group flex flex-col items-start gap-1 py-2">
      <div className="max-w-[84%] rounded-2xl bg-teal-700 px-3.5 py-2 text-[14px] leading-6 text-white">
        <MessagePrimitive.Parts>
          {({ part }) =>
            part.type === "text" ? (
              <p className="whitespace-pre-wrap">{part.text}</p>
            ) : null
          }
        </MessagePrimitive.Parts>
      </div>
      <ActionBarPrimitive.Root className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <ActionBarPrimitive.Copy
          aria-label="העתקת ההודעה"
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
    </MessagePrimitive.Root>
  );
}
