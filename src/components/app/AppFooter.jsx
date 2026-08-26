import { Sparkles } from "lucide-react";
import { GhostButton } from "../ui.jsx";

export default function AppFooter({
  wizardStep,
  attempted,
  errorCount,
  onPrev,
  onNext,
  onGenerate,
}) {
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-paper via-paper/85 to-transparent pb-6 pt-14">
      <div className="form-shell pointer-events-auto flex items-center justify-between">
        {wizardStep > 1 ? (
          <GhostButton onClick={onPrev}>הקודם</GhostButton>
        ) : (
          <span />
        )}
        {wizardStep < 3 ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-7 py-3 text-[15px] font-bold text-white shadow-lg shadow-teal-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-xl hover:shadow-teal-700/30 active:translate-y-0 active:scale-[0.99]"
          >
            הבא
          </button>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            className={`group inline-flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-[16px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
              attempted[3] && errorCount > 0
                ? "bg-teal-700/45 shadow-md shadow-teal-700/10 hover:bg-teal-700/60"
                : "bg-teal-700 shadow-lg shadow-teal-700/25 hover:bg-teal-800 hover:shadow-xl hover:shadow-teal-700/30"
            }`}
          >
            <Sparkles className="size-[18px] transition-transform duration-200 group-hover:rotate-12" />
            צור פרומפט לאפיון
          </button>
        )}
      </div>
    </footer>
  );
}
