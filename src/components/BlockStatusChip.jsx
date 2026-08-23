import { CircleAlert, TriangleAlert, Check } from "lucide-react";
import { countIssues } from "../validation/issue.js";

const shell =
  "animate-pop inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-bold";

/** The ambient signal that a block still needs work. Callers render it only after submit. */
export default function BlockStatusChip({ issues }) {
  const { errors, warnings } = countIssues(issues);

  if (errors > 0)
    return (
      <span
        className={`${shell} border-red-200 bg-red-50 text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-400`}
      >
        <CircleAlert className="size-3" />
        {errors === 1 ? "חסר שדה חובה אחד" : `חסרים ${errors} שדות חובה`}
      </span>
    );

  if (warnings > 0)
    return (
      <span
        className={`${shell} border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400`}
      >
        <TriangleAlert className="size-3" />
        {warnings === 1 ? "המלצה אחת" : `${warnings} המלצות`}
      </span>
    );

  return (
    <span
      className={`${shell} border-teal-600/25 bg-teal-50 text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-400`}
    >
      <Check className="size-3" strokeWidth={3} />
      מלא
    </span>
  );
}
