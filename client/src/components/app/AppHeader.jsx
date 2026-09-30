import { Check, CloudUpload, Moon, RotateCcw, Sun } from "lucide-react";

export default function AppHeader({
  saveState,
  dark,
  onToggleTheme,
  onReset,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-paper/85 backdrop-blur-md dark:border-stone-800/80">
      <div className="form-shell flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-700 font-display text-[15px] font-black text-white shadow-sm shadow-teal-700/30">
            א
          </span>
          <div>
            <div className="font-display text-[17px] font-bold leading-none text-ink">
              בונה אפיונים
            </div>
            <div className="mt-1 text-[11.5px] leading-none text-stone-500 dark:text-stone-400">
              אפיונים טכניים לאינטגרציות · Glassix
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[12px] text-stone-400 sm:flex dark:text-stone-500">
            {saveState === "saving" ? (
              <>
                <CloudUpload className="size-3.5" />
                שומר...
              </>
            ) : (
              <>
                <Check className="size-3.5 text-teal-600 dark:text-teal-400" />
                נשמר אוטומטית
              </>
            )}
          </span>
          <button
            type="button"
            title={dark ? "מעבר למצב בהיר" : "מעבר למצב כהה"}
            aria-label={dark ? "מעבר למצב בהיר" : "מעבר למצב כהה"}
            onClick={onToggleTheme}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-500 dark:hover:bg-stone-800"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            type="button"
            title="איפוס טיוטה"
            onClick={onReset}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-500 dark:hover:bg-stone-800"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
