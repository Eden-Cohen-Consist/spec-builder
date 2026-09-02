import { useState } from "react";
import { ChevronDown, CircleAlert, TriangleAlert } from "lucide-react";
import { useWorkflowsApi } from "../../workflow/useWorkflows.js";

/**
 * Doubles as the keyboard-accessible way into the graph: each row jumps to the workflow
 * and selects the offending node.
 */
export default function WorkflowValidationSummary() {
  const api = useWorkflowsApi();
  const [open, setOpen] = useState(false);

  const errors = api.issues.filter((i) => i.severity === "error");
  const warnings = api.issues.filter((i) => i.severity === "warning");
  const byId = new Map(api.workflows.map((w) => [w.id, w]));

  if (api.issues.length === 0) {
    return;
  }

  const goTo = (item) => {
    api.setActiveWorkflowId(item.workflowId);
    if (item.nodeId) api.selectNode(item.nodeId);
  };

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700/70">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40"
      >
        <span className="flex items-center gap-3 text-[13.5px] font-semibold">
          {errors.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <CircleAlert className="size-4" />
              {errors.length} שגיאות
            </span>
          )}
          {warnings.length > 0 && (
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <TriangleAlert className="size-4" />
              {warnings.length} אזהרות
            </span>
          )}
        </span>
        <ChevronDown
          className={`size-4 text-stone-400 transition-transform duration-200 dark:text-stone-500 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul className="animate-pop space-y-1 border-t border-stone-100 px-2 py-2 dark:border-stone-800">
          {[...errors, ...warnings].map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => goTo(item)}
                className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-start text-[13px] transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/60"
              >
                {item.severity === "error" ? (
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-red-500 dark:text-red-400" />
                ) : (
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                <span>
                  <span className="text-stone-600 dark:text-stone-300">
                    {item.message}
                  </span>
                  <span className="ms-1.5 text-stone-400 dark:text-stone-500">
                    · {byId.get(item.workflowId)?.name.trim() || "תהליך ללא שם"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
