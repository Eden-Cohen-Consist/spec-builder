import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Copy, Trash2, ArrowRight, ArrowLeft, CircleAlert, TriangleAlert, Check } from 'lucide-react'
import { useWorkflowsApi } from '../../workflow/useWorkflows.js'
import { TRIGGER_LABELS } from '../../workflow/constants.js'

function StatusDot({ errors, warnings }) {
  if (errors > 0) {
    return (
      <span className="flex items-center gap-1 text-red-600 dark:text-red-400" title={`${errors} שגיאות`}>
        <CircleAlert className="size-3.5" />
        {errors}
      </span>
    )
  }
  if (warnings > 0) {
    return (
      <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400" title={`${warnings} אזהרות`}>
        <TriangleAlert className="size-3.5" />
        {warnings}
      </span>
    )
  }
  return (
    <span className="flex items-center text-teal-700 dark:text-teal-400" title="תקין">
      <Check className="size-3.5" />
    </span>
  )
}

export default function WorkflowCard({ workflow, index, total, active, onSelect, onRequestDelete, tabIndex }) {
  const api = useWorkflowsApi()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const issues = api.issuesByWorkflow.get(workflow.id) ?? []
  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.length - errors

  const menuItem =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-[13.5px] font-medium text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-300 dark:hover:bg-stone-700/50'

  return (
    <div
      className={`group relative w-[230px] shrink-0 rounded-xl border p-3 text-start transition-all duration-150 ${
        active
          ? 'border-teal-600/50 bg-teal-50/40 shadow-sm dark:border-teal-500/50 dark:bg-teal-500/8'
          : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700/70 dark:bg-stone-800/40 dark:hover:border-stone-600'
      }`}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active}
        tabIndex={tabIndex}
        onClick={onSelect}
        className="block w-full text-start focus:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-600/20 rounded-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-1 text-[14.5px] font-bold text-ink">
            {workflow.name.trim() || 'תהליך ללא שם'}
          </span>
          <StatusDot errors={errors} warnings={warnings} />
        </div>
        {/* The trigger already has its own badge below — don't repeat it as the subtitle */}
        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-stone-500 dark:text-stone-400">
          {workflow.description?.trim() || workflow.triggerDescription?.trim() || ' '}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-stone-500 dark:text-stone-400">
          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-semibold dark:bg-stone-800">
            {TRIGGER_LABELS[workflow.triggerType]}
          </span>
          <span>{workflow.nodes.length} שלבים</span>
        </div>
      </button>

      <div className="absolute end-2 top-2" ref={menuRef}>
        <button
          type="button"
          aria-label={`פעולות עבור ${workflow.name.trim() || 'תהליך ללא שם'}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-1 text-stone-300 opacity-0 transition-all duration-150 hover:bg-stone-100 hover:text-ink group-hover:opacity-100 focus-visible:opacity-100 dark:text-stone-600 dark:hover:bg-stone-700"
        >
          <MoreHorizontal className="size-4" />
        </button>

        {menuOpen && (
          <div className="animate-pop absolute end-0 top-full z-50 mt-1 w-48 rounded-xl border border-stone-200 bg-white p-1 shadow-xl shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-800 dark:shadow-black/40">
            <button
              type="button"
              className={menuItem}
              onClick={() => {
                api.duplicateWorkflow(workflow.id)
                setMenuOpen(false)
              }}
            >
              <Copy className="size-3.5" />
              שכפול
            </button>
            <button
              type="button"
              className={menuItem}
              disabled={index === 0}
              onClick={() => {
                api.reorderWorkflows(index, index - 1)
                setMenuOpen(false)
              }}
            >
              <ArrowRight className="size-3.5" />
              הזז ימינה
            </button>
            <button
              type="button"
              className={menuItem}
              disabled={index === total - 1}
              onClick={() => {
                api.reorderWorkflows(index, index + 1)
                setMenuOpen(false)
              }}
            >
              <ArrowLeft className="size-3.5" />
              הזז שמאלה
            </button>
            <button
              type="button"
              className={`${menuItem} hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/40 dark:hover:!text-red-400`}
              disabled={total <= 1}
              title={total <= 1 ? 'חייב להישאר לפחות תהליך אחד' : undefined}
              onClick={() => {
                setMenuOpen(false)
                onRequestDelete()
              }}
            >
              <Trash2 className="size-3.5" />
              מחיקה
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
