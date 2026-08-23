import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import AdminSection from "./components/AdminSection.jsx";
import BusinessSection from "./components/BusinessSection.jsx";
import WorkflowSection from "./components/workflow/WorkflowSection.jsx";
import DynamicBlock from "./components/DynamicBlock.jsx";
import { HttpBlockCard } from "./components/HttpBlock.jsx";
import AddBlockPopover from "./components/AddBlockPopover.jsx";
import ExportModal from "./components/ExportModal.jsx";
import MarkdownToWordModal from "./components/MarkdownToWordModal.jsx";
import ValidationModal from "./components/ValidationModal.jsx";
import WizardStepper from "./components/WizardStepper.jsx";
import AppHeader from "./components/app/AppHeader.jsx";
import AppFooter from "./components/app/AppFooter.jsx";
import BlockBody from "./components/app/BlockBody.jsx";
import { makeBlock, compileSpec } from "./lib.js";
import { useWorkflows } from "./workflow/useWorkflows.js";
import { migrateWorkflows } from "./workflow/migrate.js";
import { validateSpec, fieldErrors } from "./validation/index.js";
import { countIssues } from "./validation/issue.js";
import { DRAFT_KEY, THEME_KEY } from "./persistence/keys.js";
import { defaultAdmin, defaultBusiness } from "./persistence/defaults.js";
import {
  draft,
  legacyFlow,
  initialWizard,
  getInitialAdmin,
  getInitialBusiness,
  getInitialBlocks,
} from "./persistence/draft.js";
import { stepFromScope, stepHasError } from "./wizard/stepHelpers.js";

export default function App() {
  const [admin, setAdmin] = useState(getInitialAdmin);
  const [business, setBusiness] = useState(getInitialBusiness);
  const wf = useWorkflows(() => migrateWorkflows(draft));
  const [blocks, setBlocks] = useState(getInitialBlocks);
  const [wizardStep, setWizardStep] = useState(initialWizard.step);
  const [wizardMaxReached, setWizardMaxReached] = useState(
    initialWizard.maxReached,
  );
  const [attempted, setAttempted] = useState({ 1: false, 2: false, 3: false });
  const [checkOpen, setCheckOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [spec, setSpec] = useState(null);
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const formIssues = useMemo(
    () => validateSpec({ admin, business, blocks }),
    [admin, business, blocks],
  );
  const allIssues = useMemo(
    () => [...formIssues, ...wf.issues],
    [formIssues, wf.issues],
  );
  const errorCount = useMemo(
    () => countIssues(allIssues).errors,
    [allIssues],
  );

  const shown = useMemo(() => {
    const result = { admin: [], business: [], blocks: new Map() };
    for (const item of formIssues) {
      if (item.scope === "admin" && attempted[1]) result.admin.push(item);
      else if (item.scope === "business" && attempted[1])
        result.business.push(item);
      else if (item.blockId && attempted[3]) {
        if (!result.blocks.has(item.blockId))
          result.blocks.set(item.blockId, []);
        result.blocks.get(item.blockId).push(item);
      }
    }
    return result;
  }, [formIssues, attempted]);

  useEffect(() => {
    setSaveState("saving");
    const t = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          admin,
          business,
          workflows: wf.workflows,
          blocks,
          wizard: { step: wizardStep, maxReached: wizardMaxReached },
          ...(legacyFlow && { flow: legacyFlow }),
        }),
      );
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [admin, business, wf.workflows, blocks, wizardStep, wizardMaxReached]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  const addBlock = (type) => setBlocks((prev) => [...prev, makeBlock(type)]);

  const updateBlock = (id, patch) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const deleteBlock = (id) =>
    setBlocks((prev) => prev.filter((b) => b.id !== id));

  const resetDraft = () => {
    if (!window.confirm("לאפס את הטיוטה? כל הנתונים שהוזנו יימחקו.")) return;
    localStorage.removeItem(DRAFT_KEY);
    setAdmin(defaultAdmin());
    setBusiness(defaultBusiness());
    wf.reset();
    setBlocks([]);
    setWizardStep(1);
    setWizardMaxReached(1);
    setAttempted({ 1: false, 2: false, 3: false });
    setCheckOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markAttempted = (step) =>
    setAttempted((prev) => (prev[step] ? prev : { ...prev, [step]: true }));

  const goToStep = (next) => {
    if (next < 1 || next > wizardMaxReached) return;
    setWizardStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    if (wizardStep <= 1) return;
    setWizardStep(wizardStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (wizardStep >= 3) return;
    if (stepHasError(allIssues, wizardStep)) {
      markAttempted(wizardStep);
      return;
    }
    const next = wizardStep + 1;
    setWizardStep(next);
    setWizardMaxReached((max) => Math.max(max, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generate = () => {
    setAttempted({ 1: true, 2: true, 3: true });
    if (allIssues.length > 0) {
      setCheckOpen(true);
      return;
    }
    setSpec(compileSpec({ admin, business, workflows: wf.workflows, blocks }));
  };

  const generateAnyway = () => {
    setCheckOpen(false);
    setSpec(compileSpec({ admin, business, workflows: wf.workflows, blocks }));
  };

  const goToIssue = (item) => {
    setCheckOpen(false);
    const nextStep = stepFromScope(item.scope);
    setWizardStep(nextStep);
    setWizardMaxReached((max) => Math.max(max, nextStep));
    markAttempted(nextStep);
    if (item.scope === "workflow") {
      wf.setActiveWorkflowId(item.workflowId);
      if (item.nodeId) wf.selectNode(item.nodeId);
    }
    const anchor =
      item.scope === "admin"
        ? "section-admin"
        : item.scope === "business"
          ? "section-business"
          : item.scope === "workflow"
            ? "section-workflows"
            : `block-${item.blockId}`;
    // Two frames: first commit the new step, then scroll now that the section exists
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document
          .getElementById(anchor)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      ),
    );
  };

  return (
    <div className="min-h-screen pb-40">
      <AppHeader
        saveState={saveState}
        dark={dark}
        onToggleTheme={toggleTheme}
        onReset={resetDraft}
      />

      <WizardStepper
        step={wizardStep}
        maxReached={wizardMaxReached}
        onSelect={goToStep}
        dark={dark}
      />

      <main className="mx-auto max-w-3xl px-5">
        {wizardStep === 1 && (
          <>
            <div className="animate-rise pb-8 pt-10">
              <h1 className="font-display text-[34px] font-black leading-tight text-ink">
                אפיון טכני חדש
              </h1>
              <p className="mt-2 text-[15px] text-stone-500 dark:text-stone-400">
                מלאו את הסעיפים הקבועים, הוסיפו בלוקים טכניים — וקבלו JSON
                מסודר להעברה למפתח.
              </p>
              <button
                type="button"
                onClick={() => setWordModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-teal-700/25 bg-teal-50 px-4 py-2.5 text-[14px] font-semibold text-teal-800 transition-colors hover:border-teal-700/40 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:border-teal-500/50 dark:hover:bg-teal-500/15"
              >
                <FileText className="size-4 shrink-0" />
                המרת אפיון AI ל-Word
              </button>
            </div>

            <div className="space-y-5">
              <AdminSection
                value={admin}
                onChange={setAdmin}
                issues={shown.admin}
                submitted={attempted[1]}
                delay={60}
              />
              <BusinessSection
                value={business}
                onChange={setBusiness}
                issues={shown.business}
                submitted={attempted[1]}
                delay={120}
              />
            </div>
          </>
        )}

        {wizardStep === 2 && (
          <div className="pt-8">
            <WorkflowSection
              api={wf}
              blocks={blocks}
              dark={dark}
              submitted={attempted[2]}
              delay={60}
            />
          </div>
        )}

        {wizardStep === 3 && (
          <>
            <div
              className="animate-rise flex items-center gap-3 pb-4 pt-9"
              style={{ animationDelay: "60ms" }}
            >
              <h2 className="font-display text-[20px] font-bold text-ink">
                בלוקים טכניים
              </h2>
              {blocks.length > 0 && (
                <span className="rounded-full bg-stone-200/70 px-2 py-0.5 text-[11.5px] font-bold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                  {blocks.length}
                </span>
              )}
              <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
            </div>

            <div className="space-y-5">
              {blocks.map((block) =>
                block.type === "http" ? (
                  <HttpBlockCard
                    key={block.id}
                    block={block}
                    issues={shown.blocks.get(block.id) ?? []}
                    submitted={attempted[3]}
                    onDelete={() => deleteBlock(block.id)}
                    errors={fieldErrors(shown.blocks.get(block.id) ?? [])}
                    onUpdate={(patch) => updateBlock(block.id, patch)}
                  />
                ) : (
                  <DynamicBlock
                    key={block.id}
                    block={block}
                    issues={shown.blocks.get(block.id) ?? []}
                    submitted={attempted[3]}
                    onDelete={() => deleteBlock(block.id)}
                  >
                    <BlockBody
                      block={block}
                      errors={fieldErrors(shown.blocks.get(block.id) ?? [])}
                      onUpdate={(patch) => updateBlock(block.id, patch)}
                    />
                  </DynamicBlock>
                ),
              )}

              <div className="animate-rise relative">
                <AddBlockPopover onAdd={addBlock} />
                {blocks.length === 0 && (
                  <p className="mt-3 text-center text-[13px] text-stone-400 dark:text-stone-500">
                    עדיין אין בלוקים — הוסיפו אינטגרציה, נתוני בדיקה, טבלה או
                    טקסט חופשי לפי הצורך
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <AppFooter
        wizardStep={wizardStep}
        attempted={attempted}
        errorCount={errorCount}
        onPrev={goPrev}
        onNext={goNext}
        onGenerate={generate}
      />

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div
            className={`animate-toast pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[14px] font-semibold shadow-lg ${
              toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-900/10 dark:border-emerald-900/60 dark:bg-emerald-950/90 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-700 shadow-red-900/10 dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-300"
            }`}
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 shrink-0" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {spec && <ExportModal spec={spec} onClose={() => setSpec(null)} />}

      {checkOpen && (
        <ValidationModal
          issues={allIssues}
          blocks={blocks}
          onClose={() => setCheckOpen(false)}
          onGenerateAnyway={generateAnyway}
          onNavigate={goToIssue}
        />
      )}

      {wordModalOpen && (
        <MarkdownToWordModal
          onClose={() => setWordModalOpen(false)}
          onSuccess={() => {
            setWordModalOpen(false);
            setToast({
              message: "הועתק בהצלחה! הדביקו ישירות ב-Word או ב-Google Docs",
              tone: "success",
            });
          }}
        />
      )}
    </div>
  );
}
