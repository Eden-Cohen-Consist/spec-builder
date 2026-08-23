import { useEffect } from "react";
import { ClipboardCheck, X, CircleAlert, TriangleAlert, ArrowLeft } from "lucide-react";
import { BLOCK_META } from "../constants.js";
import { countIssues } from "../validation/issue.js";

const SECTION_GROUPS = [
  { key: "admin", label: "סעיף 1 · הקשר אדמיניסטרטיבי" },
  { key: "business", label: "סעיף 2 · צורך עסקי" },
  { key: "workflow", label: "סעיף 3 · תהליכים עסקיים" },
];

// Errors before warnings inside every group, so the blocking problems are always read first
const bySeverity = (a, b) =>
  a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1;

const blockLabel = (block) =>
  block.title?.trim() || block.name?.trim() || BLOCK_META[block.type].title;

/**
 * The checkpoint between pressing "צור פרומפט" and the export. Only ever rendered when
 * there is something to report — a clean form goes straight to ExportModal.
 */
export default function ValidationModal({
  issues,
  blocks,
  onClose,
  onGenerateAnyway,
  onNavigate,
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const { errors, warnings } = countIssues(issues);

  const groups = [
    ...SECTION_GROUPS.map(({ key, label }) => ({
      key,
      label,
      items: issues.filter((i) => i.scope === key).sort(bySeverity),
    })),
    ...blocks.map((block) => ({
      key: block.id,
      label: blockLabel(block),
      items: issues.filter((i) => i.blockId === block.id).sort(bySeverity),
    })),
  ].filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="animate-fade absolute inset-0 bg-stone-950/40 backdrop-blur-[3px] dark:bg-stone-950/60"
        onClick={onClose}
      />
      <div className="animate-pop relative flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-900/25 dark:bg-stone-900 dark:ring-1 dark:ring-stone-700/60">
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-6 py-4 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-teal-700/8 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              <ClipboardCheck className="size-[18px]" />
            </span>
            <div>
              <h2 className="font-display text-[19px] font-bold leading-tight text-ink">
                בדיקה לפני יצירת האפיון
              </h2>
              <p className="mt-0.5 text-[12.5px] text-stone-500 dark:text-stone-400">
                {errors > 0 && `${errors} שגיאות`}
                {errors > 0 && warnings > 0 && " · "}
                {warnings > 0 && `${warnings} המלצות`}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="סגירה"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-500 dark:hover:bg-stone-800"
          >
            <X className="size-4.5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {groups.map((group) => (
            <div key={group.key} className="mb-3 last:mb-0">
              <div className="px-2.5 pb-1 text-[11px] font-extrabold tracking-wide text-stone-400 dark:text-stone-500">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item)}
                      className="group/row flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-start text-[13px] transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/60"
                    >
                      {item.severity === "error" ? (
                        <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-red-500 dark:text-red-400" />
                      ) : (
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      )}
                      <span className="text-stone-600 dark:text-stone-300">
                        {item.message}
                      </span>
                      <ArrowLeft className="ms-auto mt-0.5 size-3.5 shrink-0 text-teal-700 opacity-0 transition-opacity group-hover/row:opacity-100 dark:text-teal-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-4 dark:border-stone-800 dark:bg-stone-950/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-400 dark:hover:bg-stone-800"
          >
            חזרה לתיקון
          </button>
          <button
            type="button"
            disabled={errors > 0}
            onClick={onGenerateAnyway}
            className="rounded-xl bg-teal-700 px-4 py-2.5 text-[14px] font-bold text-white transition-all hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-700/30 disabled:hover:bg-teal-700/30"
          >
            צור בכל זאת
          </button>
        </footer>
      </div>
    </div>
  );
}
