import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
} from '@xyflow/react'
import {
  AlertTriangle,
  Clock3,
  GitBranch,
  GitFork,
  Globe2,
  MousePointerClick,
  Play,
  Square,
  Unlink2,
  Workflow,
} from 'lucide-react'
import { WORKFLOW_TRIGGER_LABELS } from '../../workflow/index.js'

const NODE_META = {
  START: { label: 'התחלה', icon: Play, tone: 'teal' },
  ACTION: { label: 'פעולה', icon: MousePointerClick, tone: 'stone' },
  DECISION: { label: 'החלטה', icon: GitBranch, tone: 'amber' },
  HTTP_REQUEST: { label: 'בקשת HTTP', icon: Globe2, tone: 'teal' },
  CALL_WORKFLOW: { label: 'הפעלת תהליך', icon: Workflow, tone: 'teal' },
  PARALLEL: { label: 'מקבילי', icon: GitFork, tone: 'amber' },
  DELAY: { label: 'השהיה', icon: Clock3, tone: 'stone' },
  END: { label: 'סיום', icon: Square, tone: 'stone' },
}

const TONES = {
  teal: 'border-teal-700/20 bg-teal-700/8 text-teal-800 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-300',
  stone: 'border-stone-300/80 bg-stone-100 text-stone-600 dark:border-stone-600 dark:bg-stone-700/50 dark:text-stone-300',
  amber: 'border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/50 dark:text-amber-300',
}

function outputHandles(node) {
  if (node.type === 'END') return []
  if (node.type === 'DECISION' || node.type === 'PARALLEL') {
    return (node.config?.branches ?? []).map((branch, index, branches) => ({
      id: branch.id,
      label: branch.label || `מסלול ${index + 1}`,
      left: `${((index + 1) / (branches.length + 1)) * 100}%`,
      tone: node.type === 'DECISION' ? '#d97706' : '#0f766e',
    }))
  }
  if (node.type === 'CALL_WORKFLOW') {
    const handles = [{ id: 'success', label: 'הצלחה', left: '42%', tone: '#0f766e' }]
    if (node.config?.onFailure?.behavior === 'GO_TO_NODE') {
      handles.push({ id: 'failure', label: 'כשל', left: '72%', tone: '#dc2626' })
    }
    return handles
  }
  return [{ id: 'default', label: 'המשך', left: '50%', tone: '#0f766e' }]
}

function nodeSummary(node, httpBlockTitle) {
  if (node.description?.trim()) return node.description
  if (node.type === 'DELAY') {
    const units = { SECONDS: 'שניות', MINUTES: 'דקות', HOURS: 'שעות', DAYS: 'ימים' }
    return `${node.config?.duration ?? 1} ${units[node.config?.unit] ?? 'דקות'}`
  }
  if (node.type === 'HTTP_REQUEST') {
    return httpBlockTitle || (node.config?.technicalBlockId ? 'מקושר לבלוק HTTP' : 'טרם נבחר בלוק HTTP')
  }
  if (node.type === 'CALL_WORKFLOW') return node.config?.targetWorkflowId ? 'תהליך יעד נבחר' : 'טרם נבחר תהליך יעד'
  return ''
}

function WorkflowNodeCard({ data, selected }) {
  const { node, invalid, httpBlockTitle } = data
  const meta = NODE_META[node.type] ?? NODE_META.ACTION
  const Icon = meta.icon
  const handles = outputHandles(node)
  const summary = nodeSummary(node, httpBlockTitle)

  return (
    <div
      dir="rtl"
      className={`relative min-w-[190px] max-w-[230px] rounded-xl border bg-white px-3.5 py-3 text-right shadow-[0_8px_24px_-18px_rgba(28,25,23,0.5)] transition-[border-color,box-shadow,transform] dark:bg-stone-800 ${
        invalid
          ? 'border-red-400 shadow-red-900/15 dark:border-red-500/70'
          : selected
            ? 'border-teal-600 shadow-[0_0_0_3px_rgba(13,148,136,0.12)] dark:border-teal-400'
            : 'border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600'
      }`}
    >
      {node.type !== 'START' && (
        <Handle
          type="target"
          position={Position.Top}
          aria-label={`כניסה אל ${node.title}`}
          className="!size-2.5 !border-2 !border-white !bg-stone-400 dark:!border-stone-800 dark:!bg-stone-500"
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${TONES[meta.tone]}`}>
          <Icon className="size-3" />
          {meta.label}
        </span>
        {invalid && <AlertTriangle className="size-3.5 shrink-0 text-red-500" aria-label="שגיאת ולידציה" />}
      </div>
      <div className="mt-2.5 text-[14px] font-bold leading-snug text-ink">{node.title || 'ללא שם'}</div>
      {summary && <div className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-stone-500 dark:text-stone-400">{summary}</div>}
      {node.isDraft && (
        <span className="mt-2 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-stone-700 dark:text-stone-400">
          טיוטה
        </span>
      )}

      {handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={Position.Bottom}
          aria-label={`${handle.label} מתוך ${node.title}`}
          title={handle.label}
          style={{ left: handle.left, background: handle.tone }}
          className="!size-2.5 !border-2 !border-white dark:!border-stone-800"
        />
      ))}
    </div>
  )
}

const nodeTypes = { workflowNode: WorkflowNodeCard }

const HEBREW_ARIA = {
  'controls.ariaLabel': 'פקדי הקנבס',
  'controls.zoomIn.ariaLabel': 'התקרבות',
  'controls.zoomOut.ariaLabel': 'התרחקות',
  'controls.fitView.ariaLabel': 'התאמה למסך',
  'handle.ariaLabel': 'נקודת חיבור',
}

export function WorkflowCanvas({
  workflow,
  selectedNodeId,
  issues = [],
  onSelectNode,
  onMoveNode,
  onConnect,
  onRemoveNode,
  onRemoveEdge,
  blocks = [],
}) {
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)
  const invalidIds = useMemo(
    () => new Set(issues.filter((issue) => issue.severity !== 'warning').map((issue) => issue.nodeId).filter(Boolean)),
    [issues],
  )
  const httpBlockTitles = useMemo(
    () => new Map(blocks.filter((block) => block.type === 'http').map((block) => [block.id, block.title?.trim() || ''])),
    [blocks],
  )
  const nodes = useMemo(
    () =>
      workflow.nodes.map((node) => ({
        id: node.id,
        type: 'workflowNode',
        position: node.position,
        data: {
          node,
          invalid: invalidIds.has(node.id),
          httpBlockTitle: httpBlockTitles.get(node.config?.technicalBlockId),
        },
        selected: node.id === selectedNodeId,
        deletable: node.type !== 'START',
        ariaLabel: `${NODE_META[node.type]?.label ?? 'Node'}: ${node.title}`,
      })),
    [workflow.nodes, invalidIds, selectedNodeId, httpBlockTitles],
  )
  const edges = useMemo(
    () =>
      workflow.edges.map((edge) => {
        const failure = edge.sourceHandle === 'failure'
        return {
          ...edge,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          label: edge.label || edge.condition,
          style: failure ? { stroke: '#dc2626', strokeDasharray: '5 4' } : undefined,
          labelStyle: { fill: failure ? '#dc2626' : '#78716c', fontSize: 11, fontWeight: 600 },
          labelBgPadding: [5, 3],
          labelBgBorderRadius: 5,
          selected: edge.id === selectedEdgeId,
        }
      }),
    [workflow.edges, selectedEdgeId],
  )

  useEffect(() => {
    if (selectedEdgeId && !workflow.edges.some((edge) => edge.id === selectedEdgeId)) setSelectedEdgeId(null)
  }, [selectedEdgeId, workflow.edges])

  const disconnectSelectedEdge = () => {
    if (!selectedEdgeId) return
    onRemoveEdge(selectedEdgeId)
    setSelectedEdgeId(null)
  }

  return (
    <div className="workflow-canvas relative h-[560px] min-h-[440px] overflow-hidden rounded-xl border border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-950/45" dir="ltr">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.55, maxZoom: 1.15 }}
        minZoom={0.35}
        maxZoom={1.6}
        snapToGrid
        snapGrid={[16, 16]}
        onNodeClick={(_, node) => {
          setSelectedEdgeId(null)
          onSelectNode(node.id)
        }}
        onEdgeClick={(event, edge) => {
          event.stopPropagation()
          setSelectedEdgeId(edge.id)
          onSelectNode(null)
        }}
        onPaneClick={() => {
          setSelectedEdgeId(null)
          onSelectNode(null)
        }}
        onNodesChange={(changes) => {
          for (const change of changes) {
            if (change.type === 'position' && change.position) onMoveNode(change.id, change.position)
          }
        }}
        onNodesDelete={(deleted) => deleted.forEach((node) => onRemoveNode(node.id))}
        onEdgesDelete={(deleted) => deleted.forEach((edge) => onRemoveEdge(edge.id))}
        onConnect={(connection) => onConnect(connection)}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        ariaLabelConfig={HEBREW_ARIA}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="currentColor" className="text-stone-300/65 dark:text-stone-700/60" />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
      {selectedEdgeId && (
        <button
          type="button"
          onClick={disconnectSelectedEdge}
          className="absolute start-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white/95 px-3 py-2 text-[12px] font-bold text-red-600 shadow-sm backdrop-blur transition-colors hover:bg-red-50 dark:border-red-900/70 dark:bg-stone-900/95 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <Unlink2 className="size-3.5" />
          נתק חיבור
        </button>
      )}
    </div>
  )
}

function dependencyLayout(workflows, dependencies) {
  const ids = new Set(workflows.map((workflow) => workflow.id))
  const incoming = new Map(workflows.map((workflow) => [workflow.id, 0]))
  const outgoing = new Map(workflows.map((workflow) => [workflow.id, []]))
  for (const dependency of dependencies) {
    const source = dependency.sourceWorkflowId ?? dependency.source
    const target = dependency.targetWorkflowId ?? dependency.target
    if (!ids.has(source) || !ids.has(target)) continue
    outgoing.get(source).push(target)
    incoming.set(target, incoming.get(target) + 1)
  }
  const level = new Map(workflows.map((workflow) => [workflow.id, 0]))
  const queue = workflows.filter((workflow) => incoming.get(workflow.id) === 0).map((workflow) => workflow.id)
  const visited = new Set()
  while (queue.length) {
    const source = queue.shift()
    if (visited.has(source)) continue
    visited.add(source)
    for (const target of outgoing.get(source)) {
      level.set(target, Math.max(level.get(target), level.get(source) + 1))
      incoming.set(target, incoming.get(target) - 1)
      if (incoming.get(target) === 0) queue.push(target)
    }
  }
  let fallbackLevel = Math.max(0, ...level.values())
  for (const workflow of workflows) {
    if (!visited.has(workflow.id)) level.set(workflow.id, fallbackLevel++)
  }
  const grouped = new Map()
  for (const workflow of workflows) {
    const itemLevel = level.get(workflow.id)
    if (!grouped.has(itemLevel)) grouped.set(itemLevel, [])
    grouped.get(itemLevel).push(workflow)
  }
  return workflows.map((workflow) => {
    const group = grouped.get(level.get(workflow.id))
    const index = group.indexOf(workflow)
    return { workflow, position: { x: index * 270, y: level.get(workflow.id) * 180 } }
  })
}

function DependencyNode({ data }) {
  const { workflow, invalid } = data
  return (
    <div
      dir="rtl"
      className={`w-[220px] rounded-xl border bg-white p-4 text-right shadow-[0_8px_24px_-18px_rgba(28,25,23,0.45)] dark:bg-stone-800 ${
        invalid ? 'border-red-400 dark:border-red-500/70' : 'border-stone-200 dark:border-stone-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!size-2.5 !border-2 !border-white !bg-stone-400 dark:!border-stone-800" />
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-[15px] font-bold text-ink">{workflow.name || 'ללא שם'}</div>
        {invalid && <AlertTriangle className="size-3.5 text-red-500" />}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px] font-semibold text-stone-500 dark:text-stone-400">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 dark:bg-stone-700">
          {WORKFLOW_TRIGGER_LABELS[workflow.triggerType] ?? workflow.triggerType}
        </span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 dark:bg-stone-700">{workflow.nodes.length} Nodes</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!size-2.5 !border-2 !border-white !bg-teal-700 dark:!border-stone-800 dark:!bg-teal-400" />
    </div>
  )
}

const dependencyNodeTypes = { dependencyWorkflow: DependencyNode }
const dependencyEdgeId = (dependency, index) =>
  dependency.id ?? dependency.callNodeId ?? `dependency-${index}`

export function WorkflowDependencyView({
  workflows,
  dependencies,
  issues = [],
  onOpenWorkflow,
  className = 'h-[580px]',
  editable = false,
  onConnectWorkflows,
  onDisconnectWorkflow,
  isValidConnection,
}) {
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)
  const layout = useMemo(() => dependencyLayout(workflows, dependencies), [workflows, dependencies])
  const invalidWorkflows = useMemo(
    () => new Set(issues.filter((issue) => issue.severity !== 'warning').map((issue) => issue.workflowId)),
    [issues],
  )
  const nodes = useMemo(
    () =>
      layout.map(({ workflow, position }) => ({
        id: workflow.id,
        type: 'dependencyWorkflow',
        position,
        data: { workflow, invalid: invalidWorkflows.has(workflow.id) },
      })),
    [layout, invalidWorkflows],
  )
  const edges = useMemo(
    () =>
      dependencies.map((dependency, index) => {
        const source = dependency.sourceWorkflowId ?? dependency.source
        const target = dependency.targetWorkflowId ?? dependency.target
        const mapConnection = Boolean(dependency.connectionId)
        const asyncCall = (dependency.mode ?? dependency.executionMode) === 'ASYNC' || dependency.waitForCompletion === false
        return {
          id: dependencyEdgeId(dependency, index),
          source,
          target,
          type: 'smoothstep',
          animated: !mapConnection && !asyncCall,
          label: mapConnection ? 'קשר' : asyncCall ? 'ברקע' : 'ממתין',
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          style: asyncCall ? { strokeDasharray: '7 5' } : undefined,
          labelStyle: { fill: '#78716c', fontSize: 11, fontWeight: 600 },
          labelBgPadding: [5, 3],
          labelBgBorderRadius: 5,
          selected: editable && dependencyEdgeId(dependency, index) === selectedEdgeId,
          data: { dependency },
        }
      }),
    [dependencies, editable, selectedEdgeId],
  )

  useEffect(() => {
    if (selectedEdgeId && !edges.some((edge) => edge.id === selectedEdgeId)) setSelectedEdgeId(null)
  }, [edges, selectedEdgeId])

  const disconnectSelected = () => {
    const edge = edges.find((item) => item.id === selectedEdgeId)
    if (!edge) return
    onDisconnectWorkflow?.(edge.data.dependency)
    setSelectedEdgeId(null)
  }

  if (workflows.length === 0) {
    return <div className="rounded-xl border border-dashed border-stone-300 px-6 py-16 text-center text-[14px] text-stone-400 dark:border-stone-700 dark:text-stone-500">אין עדיין תהליכים להצגה</div>
  }

  return (
    <div className={`workflow-canvas relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-950/45 ${className}`} dir="ltr">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={dependencyNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        nodesDraggable={false}
        nodesConnectable={editable}
        edgesReconnectable={false}
        elementsSelectable
        deleteKeyCode={editable ? ['Backspace', 'Delete'] : []}
        onNodeClick={(_, node) => onOpenWorkflow?.(node.id)}
        onConnect={(connection) => onConnectWorkflows?.(connection)}
        isValidConnection={isValidConnection}
        onEdgeClick={(event, edge) => {
          if (!editable) return
          event.stopPropagation()
          setSelectedEdgeId(edge.id)
        }}
        onPaneClick={() => setSelectedEdgeId(null)}
        onEdgesDelete={(deleted) => {
          if (!editable) return
          deleted.forEach((edge) => onDisconnectWorkflow?.(edge.data?.dependency))
        }}
        ariaLabelConfig={HEBREW_ARIA}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="currentColor" className="text-stone-300/65 dark:text-stone-700/60" />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
      {editable && selectedEdgeId && (
        <button
          type="button"
          onClick={disconnectSelected}
          className="absolute start-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white/95 px-3 py-2 text-[12px] font-bold text-red-600 shadow-sm backdrop-blur transition-colors hover:bg-red-50 dark:border-red-900/70 dark:bg-stone-900/95 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <Unlink2 className="size-3.5" />
          נתק קשר
        </button>
      )}
    </div>
  )
}
