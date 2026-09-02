import { Trash2 } from 'lucide-react'
import { DeleteButton, Field, Input } from '../../ui.jsx'
import { useWorkflowsApi } from '../../../workflow/useWorkflows.js'

/**
 * The routes are the outgoing edges — editing here writes the edge label/condition rather
 * than duplicating them in the node config.
 */
export default function DecisionNodePanel({ workflow, node }) {
  const api = useWorkflowsApi()
  const routes = workflow.edges.filter((edge) => edge.source === node.id)
  const nodesById = new Map(workflow.nodes.map((n) => [n.id, n]))

  return (
    <div className="space-y-3">
      <div className="text-[13px] font-semibold text-stone-600 dark:text-stone-300">מסלולי ההחלטה</div>

      {routes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 px-3 py-2.5 text-[13px] text-stone-400 dark:border-stone-700 dark:text-stone-500">
          אין עדיין מסלולים — גררו קו מהעיגול התחתון של הכרטיס אל השלב הבא
        </p>
      ) : (
        routes.map((edge, index) => {
          const target = nodesById.get(edge.target)
          return (
            <div
              key={edge.id}
              className="group rounded-xl border border-stone-200 p-3 dark:border-stone-700/70"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  מסלול {index + 1}
                </span>
                <DeleteButton
                  aria-label={`מחיקת מסלול ${index + 1}`}
                  onClick={() => api.removeEdge(workflow.id, edge.id)}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </DeleteButton>
              </div>
              <Field label="שם התנאי" className="mb-2">
                <Input
                  value={edge.label ?? ''}
                  onChange={(e) =>
                    api.updateEdge(workflow.id, edge.id, {
                      label: e.target.value,
                      condition: e.target.value,
                    })
                  }
                  placeholder="למשל: הלקוח קיים"
                  className="!py-1.5 !text-[13.5px]"
                />
              </Field>
              <p className="text-[12.5px] text-stone-400 dark:text-stone-500">
                ממשיך אל: {target?.title?.trim() || 'שלב שנמחק'}
              </p>
            </div>
          )
        })
      )}

      {routes.length < 2 && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400">
          להחלטה נדרשים לפחות שני מסלולים
        </p>
      )}
    </div>
  )
}
