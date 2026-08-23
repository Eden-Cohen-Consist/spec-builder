import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  CheckCircle2,
  CloudUpload,
  Sun,
  Moon,
  FileText,
} from "lucide-react";
import AdminSection from "./components/AdminSection.jsx";
import BusinessSection from "./components/BusinessSection.jsx";
import WorkflowSection from "./components/workflow/WorkflowSection.jsx";
import DynamicBlock from "./components/DynamicBlock.jsx";
import { HttpBlockCard } from "./components/HttpBlock.jsx";
import FreeTextBlock from "./components/FreeTextBlock.jsx";
import TestDataBlock from "./components/TestDataBlock.jsx";
import TableBlock from "./components/TableBlock.jsx";
import AddBlockPopover from "./components/AddBlockPopover.jsx";
import ExportModal from "./components/ExportModal.jsx";
import MarkdownToWordModal from "./components/MarkdownToWordModal.jsx";
import ValidationModal from "./components/ValidationModal.jsx";
import WizardStepper from "./components/WizardStepper.jsx";
import { GhostButton } from "./components/ui.jsx";
import {
  makeBlock,
  makeContactRow,
  makeDepartmentRow,
  compileSpec,
  sanitizeWizard,
} from "./lib.js";
import { useWorkflows } from "./workflow/useWorkflows.js";
import { migrateWorkflows } from "./workflow/migrate.js";
import { validateSpec, fieldErrors } from "./validation/index.js";
import { countIssues } from "./validation/issue.js";

const DRAFT_KEY = "glassix-spec-builder:draft:v1";
const THEME_KEY = "glassix-spec-builder:theme";

const STEP_SCOPES = {
  1: new Set(["admin", "business"]),
  2: new Set(["workflow"]),
  3: new Set(["block"]),
};

const stepFromScope = (scope) => {
  if (scope === "admin" || scope === "business") return 1;
  if (scope === "workflow") return 2;
  return 3;
};

const issuesForStep = (issues, step) =>
  issues.filter((item) => STEP_SCOPES[step].has(item.scope));

const stepHasError = (issues, step) =>
  issuesForStep(issues, step).some((item) => item.severity === "error");

const defaultAdmin = () => ({
  clientName: "",
  pmName: "",
  contacts: [makeContactRow()],
  departmentCreated: false,
  departments: [makeDepartmentRow()],
});
const defaultBusiness = () => ({ goal: "" });

// Older drafts stored contacts as free text and http blocks without endpoint/method/headers
const migrateAdmin = (saved) => {
  const admin = { ...defaultAdmin(), ...saved };
  if (!Array.isArray(admin.contacts) || admin.contacts.length === 0) {
    const legacyLines =
      typeof admin.contacts === "string"
        ? admin.contacts
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
        : [];
    admin.contacts = legacyLines.length
      ? legacyLines.map((line) => ({ ...makeContactRow(), name: line }))
      : [makeContactRow()];
  }
  return admin;
};

// Drop legacy trigger fields — workflow triggers own that concern now
const migrateBusiness = (saved) => {
  if (!saved) return defaultBusiness();
  return { goal: saved.goal ?? "" };
};

const foldSecurityIntoHttp = (httpBlock, security) => {
  // authType UI was removed — keep any legacy value as a note in fallback
  const authNote =
    security.authType && security.authType !== "None"
      ? `Authentication: ${security.authType}`
      : "";
  const merged = [httpBlock.fallback, authNote, security.fallback]
    .filter((t) => t?.trim())
    .join("\n");
  if (merged) httpBlock.fallback = merged;
};

// Security is now part of the http block — fold legacy standalone security blocks into
// their nearest http block; orphans with content become a free-text block so nothing is lost
const migrateBlocks = (blocks) => {
  const migrated = [];
  const pending = [];
  for (const block of blocks) {
    if (block.type === "http") {
      const httpBlock = {
        title: "",
        endpoint: "",
        method: "GET",
        headers: [],
        fallback: "",
        ...block,
      };
      // Older drafts had no toggle — open the table when any row already has content
      if (!("headersEnabled" in block)) {
        httpBlock.headersEnabled = httpBlock.headers.some(
          (h) => h.key?.trim() || h.value?.trim(),
        );
      }
      for (const security of pending.splice(0))
        foldSecurityIntoHttp(httpBlock, security);
      migrated.push(httpBlock);
    } else if (block.type === "security") {
      const target = migrated.findLast((b) => b.type === "http");
      if (target) foldSecurityIntoHttp(target, block);
      else pending.push(block);
    } else {
      migrated.push(block);
    }
  }
  for (const security of pending) {
    if (
      !security.fallback?.trim() &&
      (!security.authType || security.authType === "None")
    )
      continue;
    migrated.push({
      ...makeBlock("freeText"),
      title: "אבטחה וטיפול בשגיאות",
      text: [
        `Authentication: ${security.authType ?? "None"}`,
        security.fallback ?? "",
      ]
        .filter((t) => t.trim())
        .join("\n"),
    });
  }
  return migrated;
};

const loadDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
};
const draft = loadDraft();
// The legacy linear flow is round-tripped untouched so a rollback never loses text the PM
// already wrote — migrateWorkflows only reads it when no `workflows` key exists yet
const legacyFlow = Array.isArray(draft?.flow) ? draft.flow : null;
const initialWizard = sanitizeWizard(draft?.wizard);

export default function App() {
  const [admin, setAdmin] = useState(() =>
    draft?.admin ? migrateAdmin(draft.admin) : defaultAdmin(),
  );
  const [business, setBusiness] = useState(() =>
    migrateBusiness(draft?.business),
  );
  const wf = useWorkflows(() => migrateWorkflows(draft));
  const [blocks, setBlocks] = useState(() =>
    migrateBlocks(draft?.blocks ?? []),
  );
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

  const renderBlockBody = (block) => {
    const errors = fieldErrors(shown.blocks.get(block.id) ?? []);
    switch (block.type) {
      case "freeText":
        return (
          <FreeTextBlock
            block={block}
            errors={errors}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        );
      case "testData":
        return (
          <TestDataBlock
            block={block}
            errors={errors}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        );
      case "table":
        return (
          <TableBlock
            block={block}
            errors={errors}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-40">
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-paper/85 backdrop-blur-md dark:border-stone-800/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
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
              onClick={toggleTheme}
              className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-500 dark:hover:bg-stone-800"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              type="button"
              title="איפוס טיוטה"
              onClick={resetDraft}
              className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-500 dark:hover:bg-stone-800"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
      </header>

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
                    {renderBlockBody(block)}
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

      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-paper via-paper/85 to-transparent pb-6 pt-14">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between px-5">
          {wizardStep > 1 ? (
            <GhostButton onClick={goPrev}>הקודם</GhostButton>
          ) : (
            <span />
          )}
          {wizardStep < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-7 py-3 text-[15px] font-bold text-white shadow-lg shadow-teal-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-xl hover:shadow-teal-700/30 active:translate-y-0 active:scale-[0.99]"
            >
              הבא
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
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
