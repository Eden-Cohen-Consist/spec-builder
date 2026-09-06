import { Check, Copy } from "lucide-react";

export function FinalSpecCard({ finalSpec, onCopyFinal, copied }) {
  return (
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
  );
}
