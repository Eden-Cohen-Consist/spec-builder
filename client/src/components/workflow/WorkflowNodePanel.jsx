import { useEffect, useRef } from "react";
import { X, Trash2, CircleAlert, TriangleAlert } from "lucide-react";
import { Field, Input, Textarea } from "../ui.jsx";
import DecisionNodePanel from "./panels/DecisionNodePanel.jsx";
import HttpRequestNodePanel from "./panels/HttpRequestNodePanel.jsx";
import { useWorkflowsApi } from "../../workflow/useWorkflows.js";
import { NODE_META } from "../../workflow/constants.js";

/**
 * Side drawer for the selected node. Keeping the fields here rather than on the card keeps
 * the canvas readable and the cards uniform.
 */
export default function WorkflowNodePanel({ workflow, node, blocks, onClose }) {
  const api = useWorkflowsApi();
  const firstFieldRef = useRef(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [node.id]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const meta = NODE_META[node.type];
  const issues = api.issuesByNode.get(node.id) ?? [];
  const set = (patch) => api.updateNode(workflow.id, node.id, patch);
  const onConfig = (patch) => set({ config: { ...node.config, ...patch } });
  const deletable = node.type !== "START";

  return (
    <aside
      dir="rtl"
      role="region"
      aria-label={`עריכת ${meta?.label ?? "שלב"}`}
      className="animate-pop absolute inset-y-0 end-0 z-20 flex w-[330px] max-w-[85%] flex-col border-s border-stone-200 bg-white shadow-xl shadow-stone-900/5 dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/30"
    >
      <header className="flex items-start justify-between gap-3 border-b border-stone-100 px-4 py-3 dark:border-stone-800">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-stone-400 dark:text-stone-500">
            {meta?.label ?? "שלב לא מוכר"}
          </div>
          <div className="text-[15px] font-bold text-ink">
            {node.title?.trim() || "ללא כותרת"}
          </div>
        </div>
        <button
          type="button"
          aria-label="סגירת הפאנל"
          onClick={onClose}
          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-500 dark:hover:bg-stone-800"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {issues.length > 0 && (
          <ul className="space-y-1.5">
            {issues.map((item) => (
              <li
                key={item.id}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-semibold ${
                  item.severity === "error"
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    : "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400"
                }`}
              >
                {item.severity === "error" ? (
                  <CircleAlert className="mt-px size-3.5 shrink-0" />
                ) : (
                  <TriangleAlert className="mt-px size-3.5 shrink-0" />
                )}
                {item.message}
              </li>
            ))}
          </ul>
        )}

        <Field label="כותרת השלב">
          <Input
            ref={firstFieldRef}
            value={node.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="מה קורה בשלב הזה"
          />
        </Field>

        <Field label="תיאור" hint="לא חובה">
          <Textarea
            rows={3}
            value={node.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="פרטו את מה שהמפתח צריך לדעת"
          />
        </Field>

        {node.type === "DECISION" && (
          <DecisionNodePanel workflow={workflow} node={node} />
        )}
        {node.type === "HTTP_REQUEST" && (
          <HttpRequestNodePanel
            node={node}
            blocks={blocks}
            workflow={workflow}
            onConfig={onConfig}
            onCreateBlock={api.createHttpBlockForNode}
          />
        )}
      </div>

      {deletable && (
        <footer className="border-t border-stone-100 px-4 py-3 dark:border-stone-800">
          <button
            type="button"
            onClick={() => api.removeNode(workflow.id, node.id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-[13.5px] font-semibold text-stone-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Trash2 className="size-3.5" />
            מחיקת השלב
          </button>
        </footer>
      )}
    </aside>
  );
}
