import { useEffect } from 'react'
import { X } from 'lucide-react'

/** Modal shell shared by the dependency map and the delete dialog — mirrors ExportModal. */
export default function WorkflowModal({ title, icon: Icon, onClose, footer, wide = false, children }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="animate-fade absolute inset-0 bg-stone-950/40 backdrop-blur-[3px] dark:bg-stone-950/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-pop relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-900/25 dark:bg-stone-900 dark:ring-1 dark:ring-stone-700/60 ${
          wide ? 'max-w-4xl' : 'max-w-lg'
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-6 py-4 dark:border-stone-800">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="flex size-9 items-center justify-center rounded-xl bg-teal-700/8 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                <Icon className="size-[18px]" />
              </span>
            )}
            <h2 className="font-display text-[19px] font-bold text-ink">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="סגירה"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-500 dark:hover:bg-stone-800"
          >
            <X className="size-4.5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-4 dark:border-stone-800 dark:bg-stone-950/40">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
