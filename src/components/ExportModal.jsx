import { useState, useEffect } from 'react'
import { Sparkles, X, Copy, Check } from 'lucide-react'

export default function ExportModal({ spec, onClose }) {
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(spec, null, 2)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2200)
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
      <div className="animate-fade absolute inset-0 bg-ink/40 backdrop-blur-[3px]" onClick={onClose} />
      <div className="animate-pop relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-900/25">
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-teal-700/8 text-teal-700">
              <Sparkles className="size-[18px]" />
            </span>
            <h2 className="font-display text-[19px] font-bold text-ink">האפיון מוכן</h2>
          </div>
          <button
            type="button"
            aria-label="סגירה"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink"
          >
            <X className="size-4.5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-4 text-[14.5px] leading-relaxed text-stone-600">
            השתמשו ב-JSON הזה יחד עם ה-<b className="text-ink">Master Prompt</b> שלנו כדי לייצר את
            האפיון המלא בכלי ה-AI שלכם:
          </p>
          <pre
            dir="ltr"
            className="code-scroll max-h-[46vh] overflow-auto rounded-xl bg-[#161412] p-5 text-left"
          >
            <code className="font-mono text-[12.5px] leading-[1.75] text-stone-200">{text}</code>
          </pre>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-4">
          <button
            type="button"
            onClick={copy}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14.5px] font-bold text-white shadow-md transition-all duration-200 active:scale-[0.98] ${
              copied
                ? 'bg-emerald-600 shadow-emerald-600/25'
                : 'bg-teal-700 shadow-teal-700/25 hover:bg-teal-800'
            }`}
          >
            {copied ? <Check className="size-4" strokeWidth={3} /> : <Copy className="size-4" />}
            {copied ? 'הועתק ללוח' : 'העתקה ללוח'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-ink"
          >
            סגירה
          </button>
        </footer>
      </div>
    </div>
  )
}
