import { useState, useEffect } from 'react'
import { Sparkles, X, Copy, Check, ListChecks } from 'lucide-react'
import { buildAiExportText } from '../lib.js'

const EXPORT_REMINDERS = [
  'לא לשכוח לפתוח את כל המחלקות בצורה מלאה.',
  'נא לספק את כל הסודות והמפתחות ההכרחיים לעבודה.',
  'במידה ויש postman collection להוסיף אותו למשימה.',
]

export default function ExportModal({ spec, onClose }) {
  const [copied, setCopied] = useState(false)
  const text = buildAiExportText(spec)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2500)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for environments where the Clipboard API is unavailable
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
    }
    setCopied(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="animate-fade absolute inset-0 bg-stone-950/40 backdrop-blur-[3px] dark:bg-stone-950/60"
        onClick={onClose}
      />
      <div className="animate-pop relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-900/25 dark:bg-stone-900 dark:ring-1 dark:ring-stone-700/60">
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-6 py-4 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-teal-700/8 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              <Sparkles className="size-[18px]" />
            </span>
            <h2 className="font-display text-[19px] font-bold text-ink">האפיון מוכן</h2>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-4 text-[14.5px] leading-relaxed text-stone-600 dark:text-stone-300">
            הכל מוכן להדבקה בצ&apos;אט AI — הוראות לסוכן + טיוטת האפיון ב-JSON:
          </p>
          <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3.5 dark:border-amber-500/25 dark:bg-amber-950/30">
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-bold text-amber-900 dark:text-amber-300">
              <ListChecks className="size-4 shrink-0" />
              לפני ההעתקה
            </h3>
            <ol className="list-inside list-decimal space-y-1 text-[13.5px] leading-relaxed text-amber-950/90 dark:text-amber-100/90">
              {EXPORT_REMINDERS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? 'הועתק ללוח' : 'העתק ללוח'}
              title={copied ? 'הועתק!' : 'העתק ללוח'}
              className={`absolute end-3 top-3 z-10 flex size-9 items-center justify-center rounded-lg backdrop-blur-sm transition-all duration-300 active:scale-95 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-400'
                  : 'bg-white/10 text-stone-400 hover:bg-white/15 hover:text-stone-200'
              }`}
            >
              <Copy
                strokeWidth={2}
                className={`absolute size-[17px] transition-all duration-300 ${
                  copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
                }`}
              />
              <Check
                strokeWidth={2.5}
                className={`absolute size-[17px] transition-all duration-300 ${
                  copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                }`}
              />
            </button>
            <pre
              dir="ltr"
              className="code-scroll max-h-[46vh] overflow-auto rounded-xl bg-[#161412] p-5 pe-14 text-left whitespace-pre-wrap dark:ring-1 dark:ring-stone-700/60"
            >
              <code className="font-mono text-[12.5px] leading-[1.75] text-stone-200">{text}</code>
            </pre>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-4 dark:border-stone-800 dark:bg-stone-950/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-400 dark:hover:bg-stone-800"
          >
            סגירה
          </button>
        </footer>
      </div>
    </div>
  )
}
