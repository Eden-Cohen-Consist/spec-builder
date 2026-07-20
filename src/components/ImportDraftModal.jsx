import { useState, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import { Field } from './ui.jsx'
import { parseDraftJson } from '../lib.js'

export default function ImportDraftModal({ onClose, onImport }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const submit = () => {
    const result = parseDraftJson(text)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onImport(result.draft)
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
              <Upload className="size-[18px]" />
            </span>
            <h2 className="font-display text-[19px] font-bold text-ink">ייבוא טיוטת טופס</h2>
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
            הדביקו כאן JSON שיוצא מ«ייצוא טופס». אם הקובץ פגום — הטופס לא יתמלא.
          </p>
          <Field label="JSON של טיוטת הטופס">
            <textarea
              dir="ltr"
              spellCheck={false}
              rows={12}
              autoFocus
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setError('')
              }}
              placeholder={'{\n  "admin": { ... },\n  "business": { ... },\n  "flow": [ ... ],\n  "blocks": [ ... ]\n}'}
              className={`code-scroll w-full resize-y rounded-xl bg-[#161412] p-4 text-left font-mono text-[12.5px] leading-relaxed text-stone-200 caret-teal-400 outline-none ring-1 transition-shadow duration-150 placeholder:text-stone-600 ${
                error ? 'ring-2 ring-red-500' : 'ring-stone-700/80 focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500'
              }`}
            />
          </Field>
          {error && <p className="mt-2 text-[12.5px] font-semibold text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-4 dark:border-stone-800 dark:bg-stone-950/40">
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-[14.5px] font-bold text-white shadow-sm shadow-teal-700/30 transition-all duration-150 hover:bg-teal-800 active:scale-[0.98]"
          >
            <Upload className="size-4" />
            ייבוא לטופס
          </button>
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
