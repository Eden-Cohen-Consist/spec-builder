import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react'
import { X } from 'lucide-react'

/**
 * Smoothstep edge with a delete affordance. The button only appears once the edge is
 * selected — clicking a connection is the discoverable way in, and it keeps the canvas
 * free of controls the PM didn't ask for.
 */
export default function WorkflowEdgeLine({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
  markerEnd,
  style,
  data,
}) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {/* The wrapper must stay click-through: selecting the edge is what reveals the
            delete button, so only the button itself takes pointer events */}
        <div
          dir="rtl"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          className="pointer-events-none absolute flex items-center gap-1"
        >
          {label && (
            <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-stone-500 dark:bg-stone-800/90 dark:text-stone-400">
              {label}
            </span>
          )}
          {selected && (
            <button
              type="button"
              aria-label="מחיקת החיבור"
              title="מחיקת החיבור"
              onClick={() => data?.onDelete?.(id)}
              className="pointer-events-auto flex size-5 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
