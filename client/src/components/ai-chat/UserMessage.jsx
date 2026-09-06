import { MessagePrimitive } from "@assistant-ui/react";

export function UserMessage() {
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
