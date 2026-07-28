import { memo, useEffect } from 'react'
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react'
import { CircleAlert, TriangleAlert, HelpCircle } from 'lucide-react'
import { NODE_META } from '../../workflow/constants.js'

const FALLBACK_META = {
  label: 'שלב לא מוכר',
  icon: HelpCircle,
  accent: '#dc2626',
  accentDark: '#f87171',
  tint: 'rgba(220, 38, 38, 0.08)',
}

const handleClass = '!size-2 !border-0 !bg-stone-400 dark:!bg-stone-600'

/**
 * The single custom node type — `data.node.type` picks the icon and accent. Vertical
 * handles (top in, bottom out) keep the graph direction unambiguous under RTL.
 */
function WorkflowNodeCard({ id, data, selected }) {
  const { node, hasError, hasWarning, sourceHandleCount } = data
  const meta = NODE_META[node.type] ?? FALLBACK_META
  const Icon = meta.icon

  const isDecision = node.type === 'DECISION'
  const sourceHandles = isDecision ? sourceHandleCount : 1

  // React Flow caches handle positions when it measures the node, and only re-measures on a
  // size change. Adding a DECISION route adds a handle and shifts every existing one sideways
  // without resizing the card, so without this the edges keep leaving from the old spots.
  const updateNodeInternals = useUpdateNodeInternals()
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, sourceHandles, updateNodeInternals])

  const ring = hasError
    ? 'border-red-300 ring-2 ring-red-500/20 dark:border-red-500/50'
    : selected
      ? 'border-teal-600/60 ring-2 ring-teal-600/15 dark:border-teal-500/60 dark:ring-teal-500/20'
      : hasWarning
        ? 'border-amber-300/80 dark:border-amber-500/40'
        : 'border-stone-200 hover:border-stone-300 dark:border-stone-700/70 dark:hover:border-stone-600'

  return (
    <>
      {node.type !== 'START' && (
        <Handle type="target" position={Position.Top} className={handleClass} />
      )}

      <div
        dir="rtl"
        aria-label={`${meta.label}: ${node.title || 'ללא כותרת'}`}
        className={`w-[240px] rounded-xl border bg-white p-3 shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-colors duration-150 dark:bg-stone-800 dark:shadow-none ${ring}`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-(--accent) dark:text-(--accent-dark)"
            style={{ background: meta.tint, '--accent': meta.accent, '--accent-dark': meta.accentDark }}
          >
            <Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
              {meta.label}
            </span>
            <span className="block truncate text-[14px] font-bold text-ink">
              {node.title?.trim() || 'ללא כותרת'}
            </span>
          </span>
          {hasError ? (
            <CircleAlert className="size-4 shrink-0 text-red-500 dark:text-red-400" />
          ) : hasWarning ? (
            <TriangleAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : null}
        </div>

        {node.description?.trim() && (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-stone-500 dark:text-stone-400">
            {node.description}
          </p>
        )}
      </div>

      {node.type !== 'END' &&
        Array.from({ length: sourceHandles }, (_, i) => (
          <Handle
            key={i}
            type="source"
            id={isDecision ? `branch-${i}` : undefined}
            position={Position.Bottom}
            className={handleClass}
            style={
              isDecision
                ? { left: `${((i + 1) / (sourceHandles + 1)) * 100}%` }
                : undefined
            }
          />
        ))}
    </>
  )
}

export default memo(WorkflowNodeCard)
