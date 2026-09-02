import { Plus } from 'lucide-react'
import WorkflowCard from './WorkflowCard.jsx'
import { GhostButton } from '../ui.jsx'
import { useWorkflowsApi } from '../../workflow/useWorkflows.js'

export default function WorkflowTabs({ onRequestDelete }) {
  const api = useWorkflowsApi()
  const { workflows, activeWorkflowId } = api

  // Roving tabindex: only the active tab is reachable by Tab, arrows move between them
  const onKeyDown = (e) => {
    const step = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0
    if (step === 0) return
    e.preventDefault()
    const index = workflows.findIndex((w) => w.id === activeWorkflowId)
    const next = workflows[(index + step + workflows.length) % workflows.length]
    if (next) api.setActiveWorkflowId(next.id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-stone-600 dark:text-stone-300">
          התהליכים באפיון
          <span className="ms-2 font-normal text-stone-400 dark:text-stone-500">{workflows.length}</span>
        </span>
        <div className="flex items-center gap-2">
          <GhostButton icon={Plus} onClick={() => api.addWorkflow()}>
            הוסף תהליך
          </GhostButton>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="רשימת התהליכים"
        onKeyDown={onKeyDown}
        className="flex gap-2.5 overflow-x-auto pb-1"
      >
        {workflows.map((workflow, index) => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            index={index}
            total={workflows.length}
            active={workflow.id === activeWorkflowId}
            tabIndex={workflow.id === activeWorkflowId ? 0 : -1}
            onSelect={() => api.setActiveWorkflowId(workflow.id)}
            onRequestDelete={() => onRequestDelete(workflow)}
          />
        ))}
      </div>
    </div>
  )
}
