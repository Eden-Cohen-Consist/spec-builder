import { Lock } from "lucide-react";

export default function LockedSection({
  id,
  number,
  title,
  subtitle,
  delay = 0,
  children,
}) {
  return (
    <section
      id={id}
      className="animate-rise rounded-2xl border border-stone-200 bg-white shadow-[0_1px_3px_rgba(28,25,23,0.04),0_10px_28px_-16px_rgba(28,25,23,0.1)] transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(28,25,23,0.05),0_14px_36px_-16px_rgba(28,25,23,0.14)] dark:border-stone-800 dark:bg-stone-900 dark:shadow-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-5 dark:border-stone-800">
        <div className="flex items-center gap-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-700/8 font-display text-lg font-bold text-teal-800 dark:bg-teal-400/10 dark:text-teal-300">
            {number}
          </span>
          <div>
            <h2 className="font-display text-[19px] font-bold leading-tight text-ink">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[13px] text-stone-500 dark:text-stone-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200/70 bg-amber-50 px-2.5 py-1 text-[11.5px] font-semibold text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400">
          חובה
          <Lock className="size-3" />
        </span>
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
