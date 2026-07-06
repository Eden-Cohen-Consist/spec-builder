import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle, RotateCcw, Check, CloudUpload } from 'lucide-react'
import AdminSection from './components/AdminSection.jsx'
import BusinessSection from './components/BusinessSection.jsx'
import FlowBuilder from './components/FlowBuilder.jsx'
import DynamicBlock from './components/DynamicBlock.jsx'
import HttpBlock from './components/HttpBlock.jsx'
import SecurityBlock from './components/SecurityBlock.jsx'
import TestDataBlock from './components/TestDataBlock.jsx'
import AddBlockPopover from './components/AddBlockPopover.jsx'
import ExportModal from './components/ExportModal.jsx'
import { makeId, makeBlock, isThirdParty, compileSpec } from './lib.js'

const DRAFT_KEY = 'glassix-spec-builder:draft:v1'

const DEFAULT_ADMIN = { clientName: '', pmName: '', contacts: '', departmentCreated: false }
const DEFAULT_BUSINESS = { goal: '', trigger: '' }
const defaultFlow = () => [{ id: makeId(), kind: 'step', text: '' }]

const loadDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY))
  } catch {
    return null
  }
}
const draft = loadDraft()

export default function App() {
  const [admin, setAdmin] = useState(draft?.admin ?? DEFAULT_ADMIN)
  const [business, setBusiness] = useState(draft?.business ?? DEFAULT_BUSINESS)
  const [flow, setFlow] = useState(draft?.flow?.length ? draft.flow : defaultFlow())
  const [blocks, setBlocks] = useState(draft?.blocks ?? [])
  const [invalidIds, setInvalidIds] = useState(() => new Set())
  const [toast, setToast] = useState(null)
  const [spec, setSpec] = useState(null)
  const [saveState, setSaveState] = useState('idle')

  // Debounced autosave to localStorage
  useEffect(() => {
    setSaveState('saving')
    const t = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ admin, business, flow, blocks }))
      setSaveState('saved')
    }, 600)
    return () => clearTimeout(t)
  }, [admin, business, flow, blocks])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  const addBlock = (type) => setBlocks((prev) => [...prev, makeBlock(type)])

  const updateBlock = (id, patch) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    // Editing a flagged block clears its validation highlight
    setInvalidIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const deleteBlock = (id) => setBlocks((prev) => prev.filter((b) => b.id !== id))

  const resetDraft = () => {
    if (!window.confirm('לאפס את הטיוטה? כל הנתונים שהוזנו יימחקו.')) return
    localStorage.removeItem(DRAFT_KEY)
    setAdmin(DEFAULT_ADMIN)
    setBusiness(DEFAULT_BUSINESS)
    setFlow(defaultFlow())
    setBlocks([])
    setInvalidIds(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const generate = () => {
    const offenders = blocks.filter(
      (b) =>
        b.type === 'http' &&
        isThirdParty(b.destination) &&
        (!b.requestPayload.trim() || !b.responsePayload.trim()),
    )
    if (offenders.length > 0) {
      setInvalidIds(new Set(offenders.map((b) => b.id)))
      setToast('נא למלא Request/Response JSON Payloads עבור אינטגרציות צד שלישי')
      document
        .getElementById(`block-${offenders[0].id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSpec(compileSpec({ admin, business, flow, blocks }))
  }

  const renderBlockBody = (block) => {
    switch (block.type) {
      case 'http':
        return (
          <HttpBlock
            block={block}
            invalid={invalidIds.has(block.id)}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        )
      case 'security':
        return <SecurityBlock block={block} onUpdate={(patch) => updateBlock(block.id, patch)} />
      case 'testData':
        return <TestDataBlock block={block} onUpdate={(patch) => updateBlock(block.id, patch)} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen pb-40">
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-teal-700 font-display text-[15px] font-black text-white shadow-sm shadow-teal-700/30">
              א
            </span>
            <div>
              <div className="font-display text-[17px] font-bold leading-none text-ink">בונה אפיונים</div>
              <div className="mt-1 text-[11.5px] leading-none text-stone-500">
                אפיונים טכניים לאינטגרציות · Glassix
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[12px] text-stone-400 sm:flex">
              {saveState === 'saving' ? (
                <>
                  <CloudUpload className="size-3.5" />
                  שומר...
                </>
              ) : (
                <>
                  <Check className="size-3.5 text-teal-600" />
                  נשמר אוטומטית
                </>
              )}
            </span>
            <button
              type="button"
              title="איפוס טיוטה"
              onClick={resetDraft}
              className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5">
        <div className="animate-rise pb-8 pt-10">
          <h1 className="font-display text-[34px] font-black leading-tight text-ink">אפיון טכני חדש</h1>
          <p className="mt-2 text-[15px] text-stone-500">
            מלאו את הסעיפים הקבועים, הוסיפו בלוקים טכניים — וקבלו JSON מסודר להעברה למפתח.
          </p>
        </div>

        <div className="space-y-5">
          <AdminSection value={admin} onChange={setAdmin} delay={60} />
          <BusinessSection value={business} onChange={setBusiness} delay={120} />
          <FlowBuilder flow={flow} onChange={setFlow} delay={180} />
        </div>

        <div className="animate-rise flex items-center gap-3 pb-4 pt-9" style={{ animationDelay: '240ms' }}>
          <h2 className="font-display text-[20px] font-bold text-ink">בלוקים טכניים</h2>
          {blocks.length > 0 && (
            <span className="rounded-full bg-stone-200/70 px-2 py-0.5 text-[11.5px] font-bold text-stone-500">
              {blocks.length}
            </span>
          )}
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <div className="space-y-5">
          {blocks.map((block) => (
            <DynamicBlock
              key={block.id}
              block={block}
              invalid={invalidIds.has(block.id)}
              onDelete={() => deleteBlock(block.id)}
            >
              {renderBlockBody(block)}
            </DynamicBlock>
          ))}

          <div className="animate-rise relative z-50" style={{ animationDelay: '300ms' }}>
            <AddBlockPopover onAdd={addBlock} />
            {blocks.length === 0 && (
              <p className="mt-3 text-center text-[13px] text-stone-400">
                עדיין אין בלוקים — הוסיפו אינטגרציה, אבטחה או נתוני בדיקה לפי הצורך
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-paper via-paper/85 to-transparent pb-6 pt-14">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={generate}
            className="group pointer-events-auto inline-flex items-center gap-2.5 rounded-2xl bg-teal-700 px-8 py-3.5 text-[16px] font-bold text-white shadow-lg shadow-teal-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-xl hover:shadow-teal-700/30 active:translate-y-0 active:scale-[0.99]"
          >
            <Sparkles className="size-[18px] transition-transform duration-200 group-hover:rotate-12" />
            ייצר אפיון למפתח
          </button>
        </div>
      </footer>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="animate-toast pointer-events-auto flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700 shadow-lg shadow-red-900/10">
            <AlertTriangle className="size-4 shrink-0" />
            {toast}
          </div>
        </div>
      )}

      {spec && <ExportModal spec={spec} onClose={() => setSpec(null)} />}
    </div>
  )
}
