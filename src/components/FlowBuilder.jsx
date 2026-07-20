import { Plus, Split, Trash2, ChevronDown } from 'lucide-react'
import LockedSection from './LockedSection.jsx'
import { GhostButton, DeleteButton, Input } from './ui.jsx'
import { makeId } from '../lib.js'

function Connector() {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden="true">
      <div className="h-5 w-px bg-stone-300 dark:bg-stone-700" />
      <ChevronDown strokeWidth={2.5} className="-mt-2 size-3.5 text-stone-300 dark:text-stone-700" />
    </div>
  )
}

// A "T" split: one line dropping from the previous node, a horizontal bar,
// and two lines dropping into the centers of the branch columns
function SplitConnector() {
  return (
    <div className="relative h-9" aria-hidden="true">
      <div className="absolute right-1/2 top-0 h-3.5 w-px bg-stone-300 dark:bg-stone-700" />
      <div className="absolute left-1/4 right-1/4 top-3.5 h-px bg-stone-300 dark:bg-stone-700" />
      <div className="absolute left-1/4 top-3.5 h-[22px] w-px bg-stone-300 dark:bg-stone-700" />
      <div className="absolute right-1/4 top-3.5 h-[22px] w-px bg-stone-300 dark:bg-stone-700" />
    </div>
  )
}

const nodeCard =
  'rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-colors duration-150 hover:border-stone-300 dark:border-stone-700/70 dark:bg-stone-800/40 dark:shadow-none dark:hover:border-stone-600'

function StepNode({ node, number, deletable, onUpdate, onDelete }) {
  return (
    <div className={`group animate-block-in ${nodeCard}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center rounded-md bg-teal-700/8 px-2 py-0.5 text-[12px] font-bold text-teal-800 dark:bg-teal-400/10 dark:text-teal-300">
          שלב {number}
        </span>
        {deletable && (
          <DeleteButton
            aria-label="מחיקת שלב"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </DeleteButton>
        )}
      </div>
      <textarea
        rows={2}
        value={node.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="תארו מה קורה בשלב הזה..."
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
      />
    </div>
  )
}

const PATH_LABELS = ['מסלול א׳', 'מסלול ב׳']

function BranchNode({ node, number, onUpdate, onDelete }) {
  const setPath = (index, patch) =>
    onUpdate({ paths: node.paths.map((path, i) => (i === index ? { ...path, ...patch } : path)) })

  return (
    <div className="group animate-block-in">
      <div className="relative flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[12px] font-bold text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400">
          <Split className="size-3.5" />
          הסתעפות {number}
        </span>
        <DeleteButton
          aria-label="מחיקת הסתעפות"
          onClick={onDelete}
          className="absolute end-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </DeleteButton>
      </div>
      <SplitConnector />
      <div className="grid grid-cols-2 gap-4">
        {node.paths.map((path, i) => (
          <div key={i} className={nodeCard}>
            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-stone-400 dark:text-stone-500">
              {PATH_LABELS[i]}
            </div>
            <Input
              value={path.name}
              onChange={(e) => setPath(i, { name: e.target.value })}
              placeholder="שם התנאי (למשל: אושר)"
              className="mb-2.5 !py-1.5 !text-[14px]"
            />
            <textarea
              rows={3}
              value={path.actions}
              onChange={(e) => setPath(i, { actions: e.target.value })}
              placeholder="אילו פעולות מתבצעות במסלול הזה?"
              className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-ink outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FlowBuilder({ flow, onChange, delay }) {
  const addStep = () => onChange([...flow, { id: makeId(), kind: 'step', text: '' }])

  const addBranch = () =>
    onChange([
      ...flow,
      {
        id: makeId(),
        kind: 'branch',
        paths: [
          { name: '', actions: '' },
          { name: '', actions: '' },
        ],
      },
    ])

  const updateNode = (id, patch) =>
    onChange(flow.map((node) => (node.id === id ? { ...node, ...patch } : node)))

  const removeNode = (id) => onChange(flow.filter((node) => node.id !== id))

  let stepCounter = 0
  let branchCounter = 0

  return (
    <LockedSection number="3" title="תהליך לוגי — מבט על" subtitle="השלבים העסקיים של התהליך, מהטריגר ועד הסוף" delay={delay}>
      <div className="rounded-xl bg-stone-50/60 p-4 ring-1 ring-inset ring-stone-100 dark:bg-stone-950/40 dark:ring-stone-800">
        {flow.map((node, index) => {
          const isStep = node.kind === 'step'
          if (isStep) stepCounter += 1
          else branchCounter += 1
          return (
            <div key={node.id}>
              {index > 0 && <Connector />}
              {isStep ? (
                <StepNode
                  node={node}
                  number={stepCounter}
                  deletable={index > 0}
                  onUpdate={(patch) => updateNode(node.id, patch)}
                  onDelete={() => removeNode(node.id)}
                />
              ) : (
                <BranchNode
                  node={node}
                  number={branchCounter}
                  onUpdate={(patch) => updateNode(node.id, patch)}
                  onDelete={() => removeNode(node.id)}
                />
              )}
            </div>
          )
        })}

        <div className="flex flex-col items-center pt-1" aria-hidden="true">
          <div className="h-5 w-px bg-gradient-to-b from-stone-300 to-transparent dark:from-stone-700" />
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <GhostButton icon={Plus} onClick={addStep}>
            הוסף שלב
          </GhostButton>
          <GhostButton icon={Split} onClick={addBranch}>
            הוסף הסתעפות
          </GhostButton>
        </div>
      </div>
    </LockedSection>
  )
}
