import { makeId } from '../lib.js'
import { WORKFLOW_TRIGGER_TYPES } from './constants.js'
import { gridPosition, makeWorkflow } from './model.js'

const str = (value, fallback = '') => (typeof value === 'string' ? value : fallback)

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
 * the app. Unknown node types and edges pointing at missing nodes are kept rather than
 * silently dropped — the UI surfaces them as errors the PM can act on.
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

      if (workflow.nodes.length === 0) {
        const seeded = makeWorkflow({ id, name: workflow.name })
        workflow.nodes = seeded.nodes
        workflow.edges = seeded.edges
      }
      return workflow
    })
}

/** Reads workflows from a saved draft, or seeds a default workflow when none exist. */
export const loadWorkflows = (draft) => {
  if (Array.isArray(draft?.workflows) && draft.workflows.length > 0) {
    const sanitized = sanitizeWorkflows(draft.workflows)
    if (sanitized.length > 0) return sanitized
  }
  return [makeWorkflow({ name: 'תהליך ראשי' })]
}
