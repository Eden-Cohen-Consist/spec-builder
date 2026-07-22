import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  GitBranch,
  Globe2,
  Map,
  MousePointerClick,
  Network,
  Pencil,
  Plus,
  Square,
  Timer,
  Trash2,
  Workflow,
  X,
} from 'lucide-react'
import LockedSection from './LockedSection.jsx'
import { Field, GhostButton, Input, Select, Textarea } from './ui.jsx'
import {
  WORKFLOW_NODE_TYPE_LABELS,
  WORKFLOW_TRIGGER_LABELS,
  WORKFLOW_TRIGGER_TYPES,
  wouldCreateCycle,
} from '../workflow/index.js'
import { WorkflowCanvas, WorkflowDependencyView } from './workflow/WorkflowCanvas.jsx'
import WorkflowNodePanel from './workflow/WorkflowNodePanel.jsx'

const ADDABLE_NODES = [
  ['ACTION', MousePointerClick, 'פעולה עסקית'],
  ['DECISION', GitBranch, 'החלטה ומסלולים'],
  ['HTTP_REQUEST', Globe2, 'בקשת HTTP'],
  ['PARALLEL', Network, 'מסלולים מקבילים'],
  ['DELAY', Timer, 'השהיה'],
  ['END', Square, 'נקודת סיום נוספת'],
]

function dependencyTarget(edge) {
  return edge.targetWorkflowId ?? edge.target
}

function dependencySource(edge) {
  return edge.sourceWorkflowId ?? edge.source
}

function WorkflowRail({ controller, onRequestDelete }) {
  const { workflows, activeWorkflowId, issues, dependencies } = controller
  const dependencyEdges = dependencies?.edges ?? dependencies ?? []

  return (
    <div className="border-b border-stone-100 bg-stone-50/45 px-5 py-4 dark:border-stone-800 dark:bg-stone-950/25">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {workflows.map((workflow, index) => {
          const workflowIssues = issues.filter(
            (issue) => issue.workflowId === workflow.id && issue.severity !== 'warning',
          )
          const connectionCount = dependencyEdges.filter((edge) => dependencySource(edge) === workflow.id).length
          const draft = workflow.nodes.some((node) => node.isDraft)
          const active = workflow.id === activeWorkflowId
          return (
            <div
              key={workflow.id}
              className={`group relative w-[235px] shrink-0 overflow-hidden rounded-xl border bg-white transition-all dark:bg-stone-900 ${
                active
                  ? 'border-teal-600 shadow-[0_0_0_3px_rgba(13,148,136,0.08)] dark:border-teal-500'
                  : 'border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600'
              }`}
            >
              <button
                type="button"
                onClick={() => controller.selectWorkflow(workflow.id)}
                className="block w-full px-3.5 pb-3 pt-3 text-start"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-display text-[14px] font-bold text-ink">{workflow.name || 'ללא שם'}</div>
                    <div className="mt-1 truncate text-[11px] text-stone-400 dark:text-stone-500">
                      {workflow.description || WORKFLOW_TRIGGER_LABELS[workflow.triggerType]}
                    </div>
                  </div>
                  {workflowIssues.length > 0 ? (
                    <span title={`${workflowIssues.length} שגיאות`} className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                      <AlertTriangle className="size-3.5" />
                    </span>
                  ) : draft ? (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9.5px] font-bold text-stone-500 dark:bg-stone-800 dark:text-stone-400">טיוטה</span>
                  ) : (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[9.5px] font-semibold text-stone-500 dark:text-stone-400">
                  <span className="rounded-md bg-stone-100 px-1.5 py-0.5 dark:bg-stone-800">{WORKFLOW_TRIGGER_LABELS[workflow.triggerType]}</span>
                  <span className="rounded-md bg-stone-100 px-1.5 py-0.5 dark:bg-stone-800">{workflow.nodes.length} Nodes</span>
                  <span className="rounded-md bg-stone-100 px-1.5 py-0.5 dark:bg-stone-800">{connectionCount} קשרים</span>
                </div>
              </button>
              <div className="flex items-center justify-end gap-0.5 border-t border-stone-100 px-2 py-1.5 dark:border-stone-800">
                <button
                  type="button"
                  title="הזזה ימינה"
                  aria-label="הזזת תהליך ימינה"
                  disabled={index === 0}
                  onClick={() => controller.reorderWorkflows(index, index - 1)}
                  className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink disabled:opacity-25 dark:hover:bg-stone-800"
                >
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="הזזה שמאלה"
                  aria-label="הזזת תהליך שמאלה"
                  disabled={index === workflows.length - 1}
                  onClick={() => controller.reorderWorkflows(index, index + 1)}
                  className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink disabled:opacity-25 dark:hover:bg-stone-800"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="שכפול"
                  aria-label="שכפול תהליך"
                  onClick={() => controller.duplicateWorkflow(workflow.id)}
                  className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-teal-700 dark:hover:bg-stone-800 dark:hover:text-teal-400"
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="מחיקה"
                  aria-label="מחיקת תהליך"
                  onClick={() => onRequestDelete(workflow)}
                  className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {active && <span className="absolute inset-y-3 start-0 w-0.5 rounded-e-full bg-teal-600 dark:bg-teal-400" />}
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => controller.addWorkflow({ name: `תהליך חדש ${workflows.length + 1}` })}
          className="flex min-h-[152px] w-[170px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white/50 text-stone-400 transition-all hover:border-teal-500/60 hover:bg-teal-50/40 hover:text-teal-700 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-500 dark:hover:border-teal-500/60 dark:hover:bg-teal-950/20 dark:hover:text-teal-400"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
            <Plus className="size-4" />
          </span>
          <span className="text-[12.5px] font-bold">הוסף תהליך</span>
        </button>
      </div>
      {dependencyEdges.some((edge) => !workflows.some((workflow) => workflow.id === dependencyTarget(edge))) && (
        <div className="mt-3 flex items-center gap-2 text-[11.5px] text-red-600 dark:text-red-400">
          <AlertTriangle className="size-3.5" />
          קיימות קריאות לתהליכים שנמחקו
        </div>
      )}
    </div>
  )
}

function WorkflowHeader({ controller, workflow }) {
  const callers = controller.getWorkflowDependencies(workflow.id).callers
  return (
    <div className="grid gap-4 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900 lg:grid-cols-2">
      <Field label="שם התהליך">
        <Input
          value={workflow.name}
          onChange={(event) => controller.updateWorkflow(workflow.id, { name: event.target.value })}
          placeholder="למשל: יצירת קריאה"
        />
      </Field>
      <Field label="Trigger">
        <Select
          value={workflow.triggerType}
          onChange={(event) => controller.updateWorkflow(workflow.id, { triggerType: event.target.value })}
        >
          {WORKFLOW_TRIGGER_TYPES.map((trigger) => (
            <option key={trigger} value={trigger}>
              {WORKFLOW_TRIGGER_LABELS[trigger]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="תיאור קצר" className="lg:col-span-2">
        <Textarea
          rows={2}
          value={workflow.description}
          onChange={(event) => controller.updateWorkflow(workflow.id, { description: event.target.value })}
          placeholder="מה התהליך עושה ומתי משתמשים בו?"
        />
      </Field>
      {workflow.triggerType === 'CALLED_BY_WORKFLOW' && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-[12px] text-stone-600 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-300 lg:col-span-2">
          {callers.length > 0 ? (
            <span>
              בשימוש אצל: {callers.map((caller) => caller.name).join(' · ')}
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-300">התהליך מוגדר כתהליך משנה, אך עדיין אין תהליך שמפעיל אותו.</span>
          )}
        </div>
      )}
    </div>
  )
}

function AddNodePopover({ workflow, onAdd }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'mousedown' && rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const add = (type) => {
    const bottom = Math.max(0, ...workflow.nodes.map((node) => node.position.y))
    onAdd(type, { position: { x: 0, y: bottom + 190 } })
    setOpen(false)
  }

  return (
    <div className="relative" ref={rootRef}>
      <GhostButton icon={Plus} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        הוסף Node
      </GhostButton>
      {open && (
        <div className="animate-pop absolute right-0 top-full z-30 mt-2 max-h-[calc(100vh-10rem)] w-[calc(100vw-3rem)] max-w-[290px] overflow-y-auto rounded-xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/30">
          {ADDABLE_NODES.map(([type, Icon, description]) => (
            <button
              key={type}
              type="button"
              onClick={() => add(type)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-[12.5px] font-bold text-ink">{WORKFLOW_NODE_TYPE_LABELS[type]}</span>
                <span className="mt-0.5 block text-[10.5px] text-stone-400 dark:text-stone-500">{description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ValidationSummary({ issues, workflows, onOpenIssue }) {
  const [open, setOpen] = useState(false)
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-[12.5px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
        <CheckCircle2 className="size-4" />
        כל התהליכים תקינים ומוכנים ליצוא
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/25">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-start">
        <span className="flex items-center gap-2 text-[12.5px] font-bold text-red-700 dark:text-red-300">
          <AlertTriangle className="size-4" />
          {issues.length} שגיאות מונעות יצוא
        </span>
        <ChevronDown className={`size-4 text-red-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-1 border-t border-red-200/70 px-3 py-3 dark:border-red-900/50">
          {issues.map((issue, index) => (
            <button
              key={`${issue.workflowId}-${issue.nodeId ?? issue.code}-${index}`}
              type="button"
              onClick={() => onOpenIssue(issue)}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-start text-[11.5px] text-red-700 transition-colors hover:bg-red-100/70 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-current" />
              <span>
                <strong>{workflows.find((workflow) => workflow.id === issue.workflowId)?.name ?? 'תהליך לא ידוע'}:</strong>{' '}
                {issue.message}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DeleteWorkflowDialog({ workflow, callers, onCancel, onConfirm }) {
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" aria-label="ביטול מחיקה" onClick={onCancel} className="animate-fade absolute inset-0 bg-stone-950/50 backdrop-blur-[3px]" />
      <div role="dialog" aria-modal="true" aria-labelledby="delete-workflow-title" className="animate-pop relative w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900">
        <header className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4 dark:border-stone-800">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">מחיקת תהליך</div>
            <h2 id="delete-workflow-title" className="mt-1 font-display text-[19px] font-bold text-ink">למחוק את “{workflow.name}”?</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="סגירה" className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="size-4" />
          </button>
        </header>
        <div className="px-5 py-4 text-[13px] leading-relaxed text-stone-600 dark:text-stone-300">
          {callers.length > 0 ? (
            <>
              <p>התהליך מופעל על ידי התהליכים הבאים:</p>
              <ul className="mt-3 space-y-1.5">
                {callers.map((caller) => (
                  <li key={caller.id} className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-700 dark:bg-red-950/35 dark:text-red-300">{caller.name}</li>
                ))}
              </ul>
              <p className="mt-3">המחיקה תשאיר את ה־Call Nodes במקומם ותסמן אותם כשבורים עד לבחירת יעד חדש.</p>
            </>
          ) : (
            <p>הפעולה תמחק את התהליך ואת כל ה־Nodes שבתוכו. תהליכים אחרים אינם מפעילים אותו.</p>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-stone-100 bg-stone-50/60 px-5 py-4 dark:border-stone-800 dark:bg-stone-950/30">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-[13px] font-semibold text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800">ביטול</button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-red-700">מחק תהליך</button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function WorkflowPreviewGrid({ workflows, issues, dependencies, onOpenWorkflow }) {
  if (workflows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 px-5 py-8 text-center dark:border-stone-700">
        <Workflow className="mx-auto size-7 text-stone-300 dark:text-stone-600" />
        <p className="mt-2 text-[13px] font-semibold text-stone-500 dark:text-stone-400">אין עדיין תהליכים להצגה</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {workflows.map((workflow) => {
        const workflowIssues = issues.filter((issue) => issue.workflowId === workflow.id && issue.severity !== 'warning')
        const connections = dependencies.filter((edge) => dependencySource(edge) === workflow.id).length
        return (
          <button
            key={workflow.id}
            type="button"
            onClick={() => onOpenWorkflow(workflow.id)}
            className="group rounded-xl border border-stone-200 bg-stone-50/55 p-4 text-start transition-all hover:border-teal-500/60 hover:bg-teal-50/35 dark:border-stone-700 dark:bg-stone-950/30 dark:hover:border-teal-500/50 dark:hover:bg-teal-950/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-[15px] font-bold text-ink">{workflow.name || 'ללא שם'}</h3>
                <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-stone-500 dark:text-stone-400">
                  {workflow.description || workflow.triggerDescription || 'ללא תיאור'}
                </p>
              </div>
              {workflowIssues.length > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-950/45 dark:text-red-400">
                  <AlertTriangle className="size-3" />
                  {workflowIssues.length}
                </span>
              ) : (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400">
              <span className="rounded-md bg-white px-2 py-1 dark:bg-stone-800">{WORKFLOW_TRIGGER_LABELS[workflow.triggerType]}</span>
              <span className="rounded-md bg-white px-2 py-1 dark:bg-stone-800">{workflow.nodes.length} Nodes</span>
              <span className="rounded-md bg-white px-2 py-1 dark:bg-stone-800">{connections} קשרים</span>
            </div>
            <div className="mt-3 flex items-center gap-1 overflow-hidden" dir="ltr">
              {workflow.nodes.slice(0, 5).map((node) => (
                <span key={node.id} title={node.title} className="h-1.5 min-w-5 flex-1 rounded-full bg-stone-300 transition-colors group-hover:bg-teal-600/60 dark:bg-stone-700" />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function WorkflowEditorModal({
  controller,
  blocks,
  onClose,
  onOpenHttpBlock,
  onRequestDelete,
  dialogOpen,
}) {
  const { workflows, activeWorkflow, selectedNodeId, issues, view, dependencies } = controller
  const dependencyEdges = dependencies?.edges ?? dependencies ?? []
  const selectedNode = activeWorkflow?.nodes.find((node) => node.id === selectedNodeId) ?? null
  const activeIssues = activeWorkflow ? issues.filter((issue) => issue.workflowId === activeWorkflow.id) : []

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !dialogOpen) onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [dialogOpen, onClose])

  const unavailableTargetIds = useMemo(() => {
    if (!activeWorkflow || selectedNode?.type !== 'CALL_WORKFLOW') return new Set()
    return new Set(
      workflows
        .filter((workflow) => wouldCreateCycle(workflows, activeWorkflow.id, workflow.id, selectedNode.id))
        .map((workflow) => workflow.id),
    )
  }, [activeWorkflow, selectedNode, workflows])

  const setRoute = (node, sourceHandle, targetId, label, condition) => {
    const matches = (edge) =>
      edge.source === node.id &&
      (sourceHandle === 'success' ? edge.sourceHandle !== 'failure' : edge.sourceHandle === sourceHandle)
    activeWorkflow.edges.filter(matches).forEach((edge) => controller.removeEdge(edge.id, activeWorkflow.id))
    if (targetId) {
      controller.connectNodes(
        { source: node.id, target: targetId, sourceHandle, ...(label && { label }), ...(condition && { condition }) },
        activeWorkflow.id,
      )
    }
  }

  const openIssue = (issue) => {
    controller.selectWorkflow(issue.workflowId)
    if (issue.nodeId) controller.selectNode(issue.nodeId, issue.workflowId)
  }

  const canConnectWorkflows = (connection) => {
    const { source, target } = connection
    if (!source || !target || source === target) return false
    if (dependencyEdges.some((edge) => dependencySource(edge) === source && dependencyTarget(edge) === target)) {
      return false
    }
    return !wouldCreateCycle(workflows, source, target)
  }

  const connectWorkflows = (connection) => {
    if (!canConnectWorkflows(connection)) return
    controller.addWorkflowConnection(connection.source, connection.target)
  }

  const disconnectWorkflow = (dependency) => {
    const sourceWorkflowId = dependencySource(dependency)
    if (!sourceWorkflowId) return
    if (dependency?.connectionId) {
      controller.removeWorkflowConnection(sourceWorkflowId, dependency.connectionId)
      return
    }
    if (!dependency?.callNodeId) return
    controller.updateNode(
      dependency.callNodeId,
      { config: { targetWorkflowId: '', inputMappings: [], outputMappings: [] } },
      sourceWorkflowId,
    )
  }

  const openWorkflow = (workflowId) => {
    controller.selectWorkflow(workflowId)
    controller.setView('editor')
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/65 p-0 backdrop-blur-[4px] sm:p-4" dir="rtl">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-editor-title"
        className="relative flex h-full w-full max-w-[1440px] flex-col overflow-hidden bg-paper shadow-2xl dark:bg-stone-950 sm:h-[min(94vh,960px)] sm:rounded-2xl sm:border sm:border-stone-700"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-4 py-3.5 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90 sm:px-5">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">עורך תהליכים</div>
            <h2 id="workflow-editor-title" className="mt-0.5 font-display text-[19px] font-bold text-ink">
              {view === 'dependencies' ? 'חיבור בין תהליכים' : activeWorkflow?.name || 'בניית Workflow'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="סגירת עורך התהליכים" className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:hover:bg-stone-800">
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <WorkflowRail controller={controller} onRequestDelete={onRequestDelete} />
          <div className="mx-auto max-w-[1360px] space-y-4 p-4 sm:p-5">
            <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-900" role="tablist" aria-label="מצב עריכת תהליכים">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'editor'}
                onClick={() => controller.setView('editor')}
                className={`rounded-lg px-3 py-2 text-[12.5px] font-bold transition-colors ${view === 'editor' ? 'bg-stone-100 text-ink dark:bg-stone-800' : 'text-stone-400 hover:text-ink'}`}
              >
                עריכת תהליך
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'dependencies'}
                onClick={() => controller.setView('dependencies')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-bold transition-colors ${view === 'dependencies' ? 'bg-stone-100 text-ink dark:bg-stone-800' : 'text-stone-400 hover:text-ink'}`}
              >
                <Map className="size-3.5" />
                חיבור בין תהליכים
              </button>
            </div>

            {view === 'dependencies' ? (
              <>
                <div className="rounded-xl border border-teal-700/15 bg-teal-700/5 px-4 py-3 text-[12.5px] leading-relaxed text-stone-600 dark:border-teal-400/15 dark:bg-teal-400/5 dark:text-stone-300">
                  גררו חיבור מהנקודה התחתונה של תהליך אחד אל הנקודה העליונה של תהליך אחר. הקשר נשמר במפה בלבד ואינו מוסיף או משנה Nodes בתוך התהליכים; חיבורים כפולים או מעגליים חסומים.
                </div>
                <WorkflowDependencyView
                  workflows={workflows}
                  dependencies={dependencyEdges}
                  issues={issues}
                  onOpenWorkflow={openWorkflow}
                  editable
                  onConnectWorkflows={connectWorkflows}
                  onDisconnectWorkflow={disconnectWorkflow}
                  isValidConnection={canConnectWorkflows}
                  className="h-[min(68vh,680px)] min-h-[480px]"
                />
                <ValidationSummary issues={issues} workflows={workflows} onOpenIssue={openIssue} />
              </>
            ) : activeWorkflow ? (
              <>
                <div>
                  <h3 className="font-display text-[17px] font-bold text-ink">עריכת התהליך</h3>
                  <p className="mt-0.5 text-[11.5px] text-stone-400">שינויים נשמרים אוטומטית בטיוטה</p>
                </div>

                <WorkflowHeader controller={controller} workflow={activeWorkflow} />

                <div className={`grid min-w-0 gap-4 ${selectedNode ? 'xl:grid-cols-[minmax(0,1fr)_350px]' : ''}`}>
                  <div className="relative min-w-0">
                    <WorkflowCanvas
                      workflow={activeWorkflow}
                      blocks={blocks}
                      selectedNodeId={selectedNodeId}
                      issues={activeIssues}
                      onSelectNode={controller.selectNode}
                      onMoveNode={(nodeId, position) => controller.updateNode(nodeId, { position }, activeWorkflow.id)}
                      onConnect={(connection) => controller.connectNodes(connection, activeWorkflow.id)}
                      onRemoveNode={(nodeId) => controller.removeNode(nodeId, activeWorkflow.id)}
                      onRemoveEdge={(edgeId) => controller.removeEdge(edgeId, activeWorkflow.id)}
                    />
                    <div className="absolute right-3 top-3 z-20" dir="rtl">
                      <AddNodePopover workflow={activeWorkflow} onAdd={controller.addNode} />
                    </div>
                  </div>
                  {selectedNode && (
                    <WorkflowNodePanel
                      node={selectedNode}
                      workflow={activeWorkflow}
                      workflows={workflows}
                      blocks={blocks}
                      issues={activeIssues}
                      unavailableTargetIds={unavailableTargetIds}
                      onClose={() => controller.selectNode(null)}
                      onUpdate={(patch) => controller.updateNode(selectedNode.id, patch, activeWorkflow.id)}
                      onDelete={() => controller.removeNode(selectedNode.id, activeWorkflow.id)}
                      onOpenWorkflow={controller.selectWorkflow}
                      onOpenHttpBlock={onOpenHttpBlock}
                      onSetRoute={(sourceHandle, targetId, label, condition) =>
                        setRoute(selectedNode, sourceHandle, targetId, label, condition)
                      }
                      onRemoveEdge={(edgeId) => controller.removeEdge(edgeId, activeWorkflow.id)}
                    />
                  )}
                </div>

                <ValidationSummary issues={issues} workflows={workflows} onOpenIssue={openIssue} />
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 px-6 py-16 text-center dark:border-stone-700">
                <Workflow className="mx-auto size-8 text-stone-300 dark:text-stone-600" />
                <h3 className="mt-3 font-display text-[17px] font-bold text-ink">אין עדיין תהליכים</h3>
                <GhostButton icon={Plus} onClick={() => controller.addWorkflow({ name: 'תהליך חדש 1' })} className="mt-4">
                  הוסף תהליך
                </GhostButton>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  )
}

export default function FlowBuilder({ controller, blocks, onOpenHttpBlock, delay }) {
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const { workflows, issues, dependencies } = controller
  const dependencyEdges = dependencies?.edges ?? dependencies ?? []

  useEffect(() => {
    if (!deleteTarget) return
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setDeleteTarget(null)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [deleteTarget])

  const callers = deleteTarget
    ? dependencyEdges
        .filter((edge) => dependencyTarget(edge) === deleteTarget.id)
        .map((edge) => workflows.find((workflow) => workflow.id === dependencySource(edge)))
        .filter((workflow, index, list) => workflow && list.findIndex((item) => item.id === workflow.id) === index)
    : []

  const openEditor = (workflowId) => {
    if (workflowId) controller.selectWorkflow(workflowId)
    controller.setView('editor')
    setEditorOpen(true)
  }

  const openMapEditor = () => {
    controller.setView('dependencies')
    setEditorOpen(true)
  }

  const openIssue = (issue) => {
    controller.selectWorkflow(issue.workflowId)
    if (issue.nodeId) controller.selectNode(issue.nodeId, issue.workflowId)
    setEditorOpen(true)
  }

  return (
    <>
      <LockedSection
        id="section-workflows"
        number="3"
        title="תהליכים עסקיים"
        subtitle="תצוגה מקדימה של התהליכים והקשרים ביניהם"
        delay={delay}
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[13.5px] font-bold text-ink">תצוגת Workflow</h3>
              <p className="mt-0.5 text-[11.5px] text-stone-400">לחיצה על תהליך תפתח אותו בעורך המלא</p>
            </div>
            <GhostButton icon={Pencil} onClick={() => openEditor(controller.activeWorkflowId)}>
              עריכת תהליכים
            </GhostButton>
          </div>

          <WorkflowPreviewGrid workflows={workflows} issues={issues} dependencies={dependencyEdges} onOpenWorkflow={openEditor} />

          <div>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Map className="size-4 text-stone-400" />
                <h3 className="text-[13.5px] font-bold text-ink">מפת תהליכים</h3>
              </div>
              <button type="button" onClick={openMapEditor} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/35">
                <Pencil className="size-3.5" />
                ערוך קשרים
              </button>
            </div>
            <WorkflowDependencyView
              workflows={workflows}
              dependencies={dependencyEdges}
              issues={issues}
              onOpenWorkflow={openEditor}
              className="h-[360px] sm:h-[420px]"
            />
          </div>

          <ValidationSummary issues={issues} workflows={workflows} onOpenIssue={openIssue} />
        </div>
      </LockedSection>

      {editorOpen && (
        <WorkflowEditorModal
          controller={controller}
          blocks={blocks}
          onClose={() => setEditorOpen(false)}
          onOpenHttpBlock={(blockId) => {
            setEditorOpen(false)
            requestAnimationFrame(() => onOpenHttpBlock(blockId))
          }}
          onRequestDelete={setDeleteTarget}
          dialogOpen={Boolean(deleteTarget)}
        />
      )}

      {deleteTarget && (
        <DeleteWorkflowDialog
          workflow={deleteTarget}
          callers={callers}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            controller.removeWorkflow(deleteTarget.id)
            setDeleteTarget(null)
          }}
        />
      )}
    </>
  )
}
