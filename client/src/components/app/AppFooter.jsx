import { GhostButton } from "../ui.jsx";

export default function AppFooter({
  wizardStep,
  onPrev,
  onNext,
}) {
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-paper via-paper/85 to-transparent pb-6 pt-14">
      <div className="form-shell pointer-events-auto flex items-center justify-between">
        {wizardStep > 1 ? (
          <GhostButton onClick={onPrev}>הקודם</GhostButton>
        ) : (
          <span />
        )}
        {wizardStep < 4 && (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-7 py-3 text-[15px] font-bold text-white shadow-lg shadow-teal-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-xl hover:shadow-teal-700/30 active:translate-y-0 active:scale-[0.99]"
          >
            הבא
          </button>
        )}
      </div>
    </footer>
  );
}
