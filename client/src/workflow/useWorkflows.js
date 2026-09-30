import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  findNode,
  findWorkflow,
  layoutAnchor,
  makeWorkflow,
  makeWorkflowEdge,
  makeWorkflowNode,
  nextNodePosition,
  remapIds,
} from './model.js'
import { validateAllWorkflows } from './validation.js'

export const WorkflowsContext = createContext(null)

export const useWorkflowsApi = () => useContext(WorkflowsContext)

const ok = { ok: true }
const fail = (error) => ({ ok: false, error })

/**
 * Owns the workflows slice. Lives in App next to the other useState slices so the existing
 * autosave / reset / generate wiring keeps working; the returned object is handed to the
 * section through one context so ~20 callbacks don't get drilled four levels deep.
 */
export function useWorkflows(initializer) {
  const [workflows, setWorkflows] = useState(initializer)
  // Null means "first workflow" — activeWorkflow resolves the fallback, so a deleted or
  // not-yet-loaded id can never leave the section without a selected tab
  const [activeWorkflowId, setActiveWorkflowId] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  // Keeps the active tab valid when the current workflow is deleted or a draft loads late
  const activeWorkflow = useMemo(
    () => findWorkflow(workflows, activeWorkflowId) ?? workflows[0] ?? null,
    [workflows, activeWorkflowId],
  )
  const selectedNode = useMemo(
    () => findNode(activeWorkflow, selectedNodeId),
    [activeWorkflow, selectedNodeId],
  )

  const { issues } = useMemo(() => validateAllWorkflows(workflows), [workflows])

  const issuesByWorkflow = useMemo(() => {
    const map = new Map()
    for (const item of issues) {
      if (!map.has(item.workflowId)) map.set(item.workflowId, [])
      map.get(item.workflowId).push(item)
    }
    return map
  }, [issues])

  const issuesByNode = useMemo(() => {
    const map = new Map()
    for (const item of issues) {
      if (!item.nodeId) continue
      if (!map.has(item.nodeId)) map.set(item.nodeId, [])
      map.get(item.nodeId).push(item)
    }
    return map
  }, [issues])

  const patchWorkflow = useCallback((workflowId, updater) => {
    setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? updater(w) : w)))
  }, [])

  /* ---- workflows ---- */

  // The new object is built outside the updater: StrictMode double-invokes updaters, so
  // creating it inside would leave the returned id out of sync with committed state
  const addWorkflow = useCallback(() => {
    const created = makeWorkflow({ name: `תהליך ${workflows.length + 1}` })
    setWorkflows((prev) => [...prev, created])
    setActiveWorkflowId(created.id)
    setSelectedNodeId(null)
    return created.id
  }, [workflows])

  const updateWorkflow = useCallback(
    (workflowId, patch) => patchWorkflow(workflowId, (w) => ({ ...w, ...patch })),
    [patchWorkflow],
  )

  const duplicateWorkflow = useCallback(
    (workflowId) => {
      const source = workflows.find((w) => w.id === workflowId)
      if (!source) return null
      const created = { ...remapIds(source), name: `${source.name.trim() || 'תהליך'} (עותק)` }
      setWorkflows((prev) => {
        const index = prev.findIndex((w) => w.id === workflowId)
        if (index === -1) return prev
        return [...prev.slice(0, index + 1), created, ...prev.slice(index + 1)]
      })
      setActiveWorkflowId(created.id)
      setSelectedNodeId(null)
      return created.id
    },
    [workflows],
  )

  const removeWorkflow = useCallback(
    (workflowId) => {
      if (workflows.length <= 1) return { ok: false, error: 'חייב להישאר לפחות תהליך אחד' }

      setWorkflows((prev) => prev.filter((w) => w.id !== workflowId))
      setSelectedNodeId(null)
      setActiveWorkflowId((current) => {
        if (current !== workflowId) return current
        const remaining = workflows.filter((w) => w.id !== workflowId)
        return remaining[0]?.id ?? null
      })
      return { ok: true }
    },
    [workflows],
  )

  const reorderWorkflows = useCallback((fromIndex, toIndex) => {
    setWorkflows((prev) => {
      if (toIndex < 0 || toIndex >= prev.length || fromIndex === toIndex) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const selectWorkflow = useCallback((workflowId) => {
    setActiveWorkflowId(workflowId)
    setSelectedNodeId(null)
  }, [])

  /* ---- nodes ---- */

  /**
   * Auto-positions below the anchor and, when the anchor is a loose end, wires the edge
   * too — that is what makes the canvas behave like the old linear builder for simple flows.
   */
  const addNode = useCallback(
    (workflowId, type, { anchorId = null, connect = true } = {}) => {
      const workflow = findWorkflow(workflows, workflowId)
      if (!workflow) return null

      const anchor = layoutAnchor(workflow, anchorId ?? selectedNodeId)
      const created = makeWorkflowNode(workflowId, type, {
        position: nextNodePosition(workflow.nodes, anchor),
      })
      const shouldConnect =
        connect &&
        anchor &&
        anchor.type !== 'END' &&
        type !== 'START' &&
        !workflow.edges.some((e) => e.source === anchor.id)
      const edge = shouldConnect ? makeWorkflowEdge(anchor.id, created.id) : null

      patchWorkflow(workflowId, (w) => ({
        ...w,
        nodes: [...w.nodes, created],
        edges: edge ? [...w.edges, edge] : w.edges,
      }))
      setSelectedNodeId(created.id)
      return created.id
    },
    [workflows, selectedNodeId, patchWorkflow],
  )

  /** Returns a result object instead of throwing so panels can render an inline message. */
  const updateNode = useCallback(
    (workflowId, nodeId, patch) => {
      patchWorkflow(workflowId, (w) => ({
        ...w,
        nodes: w.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
      }))
      return ok
    },
    [patchWorkflow],
  )

  const removeNode = useCallback(
    (workflowId, nodeId) => {
      patchWorkflow(workflowId, (w) => ({
        ...w,
        nodes: w.nodes.filter((n) => n.id !== nodeId),
        edges: w.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      }))
      setSelectedNodeId((current) => (current === nodeId ? null : current))
    },
    [patchWorkflow],
  )

  /** Batch commit from onNodeDragStop — one state write per drag, not per frame. */
  const moveNodes = useCallback(
    (workflowId, positionsById) => {
      patchWorkflow(workflowId, (w) => ({
        ...w,
        nodes: w.nodes.map((n) => (positionsById[n.id] ? { ...n, position: positionsById[n.id] } : n)),
      }))
    },
    [patchWorkflow],
  )

  const selectNode = useCallback((nodeId) => setSelectedNodeId(nodeId), [])

  /* ---- edges ---- */

  const connectNodes = useCallback(
    (workflowId, connection) => {
      const { source, target, sourceHandle = null } = connection
      if (!source || !target) return fail('חיבור לא תקין')
      if (source === target) return fail('לא ניתן לחבר שלב לעצמו')

      const workflow = findWorkflow(workflows, workflowId)
      const sourceNode = findNode(workflow, source)
      const targetNode = findNode(workflow, target)
      if (!sourceNode || !targetNode) return fail('אחד השלבים לא קיים')
      if (sourceNode.type === 'END') return fail('לא ניתן להמשיך משלב סיום')
      if (targetNode.type === 'START') return fail('לא ניתן לחבר שלב אל ההתחלה')

      const duplicate = workflow.edges.some(
        (e) => e.source === source && e.target === target && (e.sourceHandle ?? null) === sourceHandle,
      )
      if (duplicate) return fail('החיבור הזה כבר קיים')

      const edge = makeWorkflowEdge(source, target, { sourceHandle })
      patchWorkflow(workflowId, (w) => ({ ...w, edges: [...w.edges, edge] }))
      return ok
    },
    [workflows, patchWorkflow],
  )

  const updateEdge = useCallback(
    (workflowId, edgeId, patch) =>
      patchWorkflow(workflowId, (w) => ({
        ...w,
        edges: w.edges.map((e) => (e.id === edgeId ? { ...e, ...patch } : e)),
      })),
    [patchWorkflow],
  )

  const removeEdge = useCallback(
    (workflowId, edgeId) =>
      patchWorkflow(workflowId, (w) => ({ ...w, edges: w.edges.filter((e) => e.id !== edgeId) })),
    [patchWorkflow],
  )

  /* ---- queries ---- */

  const validateOne = useCallback(
    (workflowId) => issuesByWorkflow.get(workflowId) ?? [],
    [issuesByWorkflow],
  )

  const reset = useCallback(() => {
    const fresh = makeWorkflow({ name: 'תהליך ראשי' })
    setWorkflows([fresh])
    setActiveWorkflowId(fresh.id)
    setSelectedNodeId(null)
  }, [])

  return useMemo(
    () => ({
      workflows,
      activeWorkflowId: activeWorkflow?.id ?? null,
      activeWorkflow,
      selectedNodeId,
      selectedNode,
      issues,
      issuesByWorkflow,
      issuesByNode,

      addWorkflow,
      updateWorkflow,
      duplicateWorkflow,
      removeWorkflow,
      reorderWorkflows,
      setActiveWorkflowId: selectWorkflow,

      addNode,
      updateNode,
      removeNode,
      moveNodes,
      selectNode,

      connectNodes,
      updateEdge,
      removeEdge,

      validateWorkflow: validateOne,
      reset,
      setWorkflows,
    }),
    [
      workflows,
      activeWorkflow,
      selectedNodeId,
      selectedNode,
      issues,
      issuesByWorkflow,
      issuesByNode,
      addWorkflow,
      updateWorkflow,
      duplicateWorkflow,
      removeWorkflow,
      reorderWorkflows,
      selectWorkflow,
      addNode,
      updateNode,
      removeNode,
      moveNodes,
      selectNode,
      connectNodes,
      updateEdge,
      removeEdge,
      validateOne,
      reset,
    ],
  )
}
