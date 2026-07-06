import { Trash2 } from 'lucide-react'
import { BLOCK_META } from '../constants.js'

export default function DynamicBlock({ block, invalid, onDelete, children }) {
  const meta = BLOCK_META[block.type]
  const Icon = meta.icon

  return (
    <section
      id={`block-${block.id}`}
      className={`group/block animate-block-in relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
        invalid
          ? 'border-red-300 shadow-[0_1px_3px_rgba(220,38,38,0.08)] ring-[3px] ring-red-500/10'
          : 'border-stone-200 shadow-[0_1px_3px_rgba(28,25,23,0.04),0_10px_28px_-16px_rgba(28,25,23,0.1)] hover:shadow-[0_1px_3px_rgba(28,25,23,0.05),0_14px_36px_-16px_rgba(28,25,23,0.14)]'
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-[3px]"
        style={{ background: invalid ? '#dc2626' : meta.accent }}
      />
      <header className="flex items-center justify-between gap-3 px-6 pb-4 pt-5">
        <div className="flex items-center gap-3.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: meta.tint, color: meta.accent }}
          >
            <Icon className="size-[18px]" />
          </span>
          <div>
            <h3 className="text-[16px] font-bold leading-tight text-ink">{meta.title}</h3>
            <p className="mt-0.5 text-[12.5px] text-stone-500">{meta.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="מחיקת בלוק"
          onClick={onDelete}
          className="rounded-lg p-2 text-stone-300 opacity-0 transition-all duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover/block:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      </header>
      <div className="px-6 pb-6">{children}</div>
    </section>
  )
}
