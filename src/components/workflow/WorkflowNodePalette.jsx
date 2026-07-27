import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'
import { NODE_META } from '../../workflow/constants.js'

// START is seeded with the workflow and there is only ever meant to be one
const ADDABLE = ['ACTION', 'DECISION', 'HTTP_REQUEST', 'END']

const MENU_WIDTH = 196
const MARGIN = 8

export default function WorkflowNodePalette({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  // Portaled to document.body: the canvas has overflow-hidden, so an absolutely-positioned
  // dropdown nested inside it gets clipped instead of floating over the graph
  useEffect(() => {
    if (!open) return
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const left = Math.min(
        Math.max(MARGIN, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - MARGIN,
      )
      setMenuPos({ top: rect.bottom + 6, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (
        buttonRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div dir="rtl">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-150 ${
          open
            ? 'border-teal-600/50 bg-teal-50/60 text-teal-700 dark:border-teal-500/50 dark:bg-teal-500/10 dark:text-teal-300'
            : 'border-stone-200 bg-white text-stone-600 hover:border-teal-600/40 hover:text-teal-700 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-300 dark:shadow-none dark:hover:border-teal-500/50 dark:hover:text-teal-400'
        }`}
      >
        <Plus className={`size-3.5 transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
        הוסף שלב
      </button>

      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            dir="rtl"
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
            className="animate-pop z-[80] rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-800 dark:shadow-black/40"
          >
            {ADDABLE.map((type) => {
              const meta = NODE_META[type]
              const Icon = meta.icon
              return (
                <button
                  key={type}
                  type="button"
                  title={meta.hint}
                  onClick={() => {
                    onAdd(type)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start transition-colors duration-100 hover:bg-stone-50 dark:hover:bg-stone-700/50"
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-(--accent) dark:text-(--accent-dark)"
                    style={{ background: meta.tint, '--accent': meta.accent, '--accent-dark': meta.accentDark }}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-[13px] font-semibold text-ink">{meta.label}</span>
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
