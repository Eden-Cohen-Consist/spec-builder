import { makeId } from '../lib.js'
import { NODE_META, WORKFLOW_TRIGGER_TYPES } from './constants.js'
import { gridPosition, makeWorkflow, makeWorkflowEdge, makeWorkflowNode } from './model.js'

const str = (value, fallback = '') => (typeof value === 'string' ? value : fallback)

const firstLine = (text) => str(text).split('\n')[0].trim()

const titleFrom = (text, fallback) => {
  const line = firstLine(text)
  if (!line) return fallback
  return line.length > 60 ? `${line.slice(0, 59)}…` : line
}

const isPosition = (position) =>
  position && typeof position.x === 'number' && typeof position.y === 'number' &&
  Number.isFinite(position.x) && Number.isFinite(position.y)

/** Mints a fresh id when the candidate is unusable or already taken. */
const claimId = (candidate, used) => {
  const id = typeof candidate === 'string' && candidate.trim() && !used.has(candidate) ? candidate : makeId()
  used.add(id)
  return id
}

/**
 * Normalizes a stored workflow list so a partially-corrupt draft can never white-screen
 * the app. Two classes of damage are kept rather than silently dropped, because the UI
 * surfaces them as errors the PM can act on: unknown node types and edges pointing at
 * missing nodes.
 */
export const sanitizeWorkflows = (list) => {
  const usedWorkflowIds = new Set()

  return list
    .filter((workflow) => workflow && typeof workflow === 'object')
    .map((raw) => {
      const id = claimId(raw.id, usedWorkflowIds)
      const usedNodeIds = new Set()
      const usedEdgeIds = new Set()

      const nodes = (Array.isArray(raw.nodes) ? raw.nodes : [])
        .filter((node) => node && typeof node === 'object')
        .map((node, index) => ({
          ...node,
          id: claimId(node.id, usedNodeIds),
          workflowId: id,
          type: str(node.type, 'ACTION'),
          title: str(node.title),
          description: str(node.description),
          position: isPosition(node.position)
            ? { x: node.position.x, y: node.position.y }
            : gridPosition(index),
          config: node.config && typeof node.config === 'object' ? node.config : {},
        }))

      const edges = (Array.isArray(raw.edges) ? raw.edges : [])
        .filter((edge) => edge && typeof edge === 'object' && edge.source && edge.target)
        .map((edge) => ({
          ...edge,
          id: claimId(edge.id, usedEdgeIds),
          source: String(edge.source),
          target: String(edge.target),
          sourceHandle: typeof edge.sourceHandle === 'string' ? edge.sourceHandle : null,
          label: str(edge.label),
          condition: str(edge.condition),
        }))

      const workflow = {
        id,
        name: str(raw.name),
        description: str(raw.description),
        triggerType: WORKFLOW_TRIGGER_TYPES.includes(raw.triggerType) ? raw.triggerType : 'MANUAL',
        triggerDescription: str(raw.triggerDescription),
        nodes,
        edges,
      }

      // A workflow with no nodes at all would render an empty canvas with nothing to grab
      if (workflow.nodes.length === 0) {
        const seeded = makeWorkflow({ id, name: workflow.name })
        workflow.nodes = seeded.nodes
        workflow.edges = seeded.edges
      }
      return workflow
    })
}

const PATH_FALLBACK_LABELS = ['כן', 'לא']

/**
 * Converts the legacy linear `flow` array into a single node-based workflow.
 * Original step and branch ids are reused so nothing downstream loses its anchor, and
 * empty branch paths still become nodes — dropping them would leave the DECISION with
 * fewer than two routes and would discard text when only one field was filled.
 */
export const workflowFromLegacyFlow = (flow, business) => {
  const workflowId = makeId()
  const used = new Set([workflowId])
  const nodes = []
  const edges = []

  const start = makeWorkflowNode(workflowId, 'START', {
    id: claimId(null, used),
    title: 'התחלה',
    position: gridPosition(0),
  })
  nodes.push(start)

  let open = [start.id]
  let row = 1
  let stepNumber = 0

  const connect = (targetId, overrides = {}) => {
    for (const sourceId of open) edges.push(makeWorkflowEdge(sourceId, targetId, overrides))
  }

  for (const entry of flow) {
    if (!entry || typeof entry !== 'object') continue

    if (entry.kind === 'branch') {
      const paths = Array.isArray(entry.paths) ? entry.paths : []
      const decision = makeWorkflowNode(workflowId, 'DECISION', {
        id: claimId(entry.id, used),
        title: 'החלטה',
        position: gridPosition(row),
      })
      nodes.push(decision)
      connect(decision.id)

      const branchNodes = (paths.length > 0 ? paths : [{}, {}]).map((path, i) => {
        const name = str(path?.name).trim()
        const actions = str(path?.actions)
        const node = makeWorkflowNode(workflowId, 'ACTION', {
          id: claimId(null, used),
          title: name || PATH_FALLBACK_LABELS[i] || `מסלול ${i + 1}`,
          description: actions,
          position: gridPosition(row + 1, i - (paths.length > 0 ? paths.length - 1 : 1) / 2),
        })
        nodes.push(node)
        edges.push(
          makeWorkflowEdge(decision.id, node.id, {
            sourceHandle: `branch-${i}`,
            label: name || PATH_FALLBACK_LABELS[i] || `מסלול ${i + 1}`,
            condition: name,
          }),
        )
        return node.id
      })

      open = branchNodes
      row += 2
      continue
    }

    stepNumber += 1
    const action = makeWorkflowNode(workflowId, 'ACTION', {
      id: claimId(entry.id, used),
      title: titleFrom(entry.text, `שלב ${stepNumber}`),
      description: str(entry.text),
      position: gridPosition(row),
    })
    nodes.push(action)
    connect(action.id)
    open = [action.id]
    row += 1
  }

  const end = makeWorkflowNode(workflowId, 'END', {
    id: claimId(null, used),
    title: 'סיום',
    position: gridPosition(row),
  })
  nodes.push(end)
  connect(end.id)

  // Reuse the business trigger text if one was written — purely additive, nothing is lost
  const triggerText = str(business?.triggers?.[0]?.text).trim()

  return makeWorkflow({
    id: workflowId,
    name: 'תהליך ראשי',
    triggerType: triggerText ? 'EVENT' : 'MANUAL',
    triggerDescription: triggerText,
    nodes,
    edges,
  })
}

/**
 * Loads workflows from a saved draft. The legacy branch never runs once `workflows`
 * exists, so a v2 draft can't be clobbered by a stale `flow` key left behind for rollback.
 */
export const migrateWorkflows = (draft) => {
  if (Array.isArray(draft?.workflows) && draft.workflows.length > 0) {
    const sanitized = sanitizeWorkflows(draft.workflows)
    if (sanitized.length > 0) return sanitized
  }
  if (Array.isArray(draft?.flow) && draft.flow.length > 0) {
    return [workflowFromLegacyFlow(draft.flow, draft.business)]
  }
  return [makeWorkflow({ name: 'תהליך ראשי' })]
}

export const isKnownNodeType = (type) => Boolean(NODE_META[type])
