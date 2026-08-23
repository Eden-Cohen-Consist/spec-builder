import { useState } from "react";
import { Terminal } from "lucide-react";
import { GhostButton } from "../ui.jsx";
import { parseCurl } from "../../lib.js";

/** Compact trigger for the block header — keeps the expand panel out of the chrome. */
export function CurlImportTrigger({ onClick }) {
  return (
    <GhostButton onClick={onClick} className="!opacity-100">
      ייבוא מ-cURL
    </GhostButton>
  );
}

export default function CurlImport({ onImport, open, onOpenChange }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const close = () => {
    onOpenChange(false);
    setText("");
    setError("");
  };

  const importCurl = () => {
    const parsed = parseCurl(text);
    if (!parsed || !parsed.url) {
      setError(
        "לא הצלחנו לפענח את הפקודה — ודאו שהיא מתחילה ב-curl וכוללת כתובת",
      );
      return;
    }
    onImport(parsed);
    close();
  };

  if (!open) return null;

  return (
    <div className="animate-block-in mb-5 space-y-2.5 rounded-xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
        <Terminal className="size-3.5 text-teal-700 dark:text-teal-400" />
        הדביקו פקודת cURL — נמלא את ה-Method, ה-Endpoint, ה-Headers וה-Payload
        אוטומטית
      </p>
      <textarea
        dir="ltr"
        spellCheck={false}
        rows={5}
        autoFocus
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError("");
        }}
        placeholder={
          "curl -X POST 'https://api.example.com/v1/tickets' \\\n  -H 'Authorization: Bearer TOKEN' \\\n  -d '{ \"ticketId\": 12345 }'"
        }
        className={`code-scroll w-full resize-y rounded-lg bg-[#161412] p-3.5 text-left font-mono text-[12.5px] leading-relaxed text-stone-200 caret-teal-400 outline-none ring-1 transition-shadow duration-150 placeholder:text-stone-600 ${
          error
            ? "ring-2 ring-red-500"
            : "ring-stone-700/80 focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500"
        }`}
      />
      {error && (
        <p className="text-[12.5px] font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={importCurl}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-[13.5px] font-bold text-white shadow-sm shadow-teal-700/30 transition-all duration-150 hover:bg-teal-800 active:scale-[0.98]"
        >
          ייבוא
        </button>
        <GhostButton onClick={close}>ביטול</GhostButton>
      </div>
    </div>
  );
}
