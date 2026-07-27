import { makeId } from '../lib.js'
import { NODE_META } from './constants.js'

/**
 * @typedef {'MANUAL'|'FORM_SUBMIT'|'WEBHOOK'|'EVENT'|'SCHEDULE'} WorkflowTriggerType
 * @typedef {'START'|'ACTION'|'DECISION'|'HTTP_REQUEST'|'PARALLEL'|'DELAY'|'END'} WorkflowNodeType
 *
 * @typedef {Object} WorkflowNode
 * @property {string} id
 * @property {string} workflowId
 * @property {WorkflowNodeType} type
 * @property {string} title
 * @property {string} [description]
 * @property {{x: number, y: number}} position
 * @property {Record<string, unknown>} config
 *
 * @typedef {Object} WorkflowEdge
 * @property {string} id
 * @property {string} source
 * @property {string} target
 * @property {string} [sourceHandle]
 * @property {string} [label]
 * @property {string} [condition]
 *
 * @typedef {Object} Workflow
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {WorkflowTriggerType} triggerType
 * @property {string} [triggerDescription]
 * @property {WorkflowNode[]} nodes
 * @property {WorkflowEdge[]} edges
 */

// Canvas layout grid — one "row" is a step down the flow, one "col" a parallel branch
export const NODE_W = 240
export const GAP_X = 290
export const GAP_Y = 150

export const gridPosition = (row, col = 0) => ({ x: Math.round(col * GAP_X), y: row * GAP_Y })

/** Per-type starting config. Kept minimal — advanced fields are added by the panels on demand. */
export const defaultNodeConfig = (type) => {
  switch (type) {
    case 'HTTP_REQUEST':
      return { blockId: '', notes: '' }
    case 'DELAY':
      return { duration: '', unit: 'MINUTES' }
    case 'PARALLEL':
      return { notes: '' }
    default:
      return {}
  }
}

/** @returns {WorkflowNode} */
export const makeWorkflowNode = (workflowId, type, overrides = {}) => ({
  id: makeId(),
  workflowId,
  type,
  title: NODE_META[type]?.label ?? type,
  description: '',
  position: gridPosition(0, 0),
  config: defaultNodeConfig(type),
  ...overrides,
})

/** @returns {WorkflowEdge} */
export const makeWorkflowEdge = (source, target, overrides = {}) => ({
  id: makeId(),
  source,
  target,
  sourceHandle: null,
  label: '',
  condition: '',
  ...overrides,
})

/**
 * Creates a workflow. Seeds START + END only when no nodes are supplied, so migration
 * can hand over a fully-built node list without getting stray extras.
 * @returns {Workflow}
 */
export const makeWorkflow = (overrides = {}) => {
  const id = overrides.id ?? makeId()
  const base = {
    name: '',
    description: '',
    triggerType: 'MANUAL',
    triggerDescription: '',
    nodes: [],
    edges: [],
    ...overrides,
    id,
  }
  if (!overrides.nodes) {
    const start = makeWorkflowNode(id, 'START', { position: gridPosition(0) })
    const end = makeWorkflowNode(id, 'END', { position: gridPosition(1) })
    base.nodes = [start, end]
    base.edges = [makeWorkflowEdge(start.id, end.id)]
  }
  return base
}

export const findWorkflow = (workflows, id) => workflows.find((w) => w.id === id) ?? null

export const findNode = (workflow, nodeId) => workflow?.nodes.find((n) => n.id === nodeId) ?? null

export const outgoingEdges = (workflow, nodeId) => workflow.edges.filter((e) => e.source === nodeId)

export const incomingEdges = (workflow, nodeId) => workflow.edges.filter((e) => e.target === nodeId)

/**
 * Finds a free slot for a new node: directly below the anchor, nudged sideways while
 * anything already sits within snapping distance.
 */
export const nextNodePosition = (nodes, anchor) => {
  const base = anchor?.position ?? { x: 0, y: -GAP_Y }
  const target = { x: base.x, y: base.y + GAP_Y }
  const collides = () =>
    nodes.some((n) => Math.abs(n.position.x - target.x) < 40 && Math.abs(n.position.y - target.y) < 40)
  let guard = 0
  while (collides() && guard++ < 20) target.x += GAP_X
  return target
}

/** The node a new node should hang off: the selected one, else the lowest on the canvas. */
export const layoutAnchor = (workflow, selectedNodeId) => {
  const selected = findNode(workflow, selectedNodeId)
  if (selected) return selected
  return workflow.nodes.reduce(
    (lowest, n) => (!lowest || n.position.y > lowest.position.y ? n : lowest),
    null,
  )
}

/**
 * Deep-clones a workflow with fresh ids everywhere, rewiring every internal reference.
 * @returns {Workflow}
 */
export const remapIds = (workflow) => {
  const workflowId = makeId()
  const nodeIds = new Map(workflow.nodes.map((n) => [n.id, makeId()]))
  const remap = (id) => nodeIds.get(id) ?? id

  return {
    ...workflow,
    id: workflowId,
    nodes: workflow.nodes.map((node) => ({
      ...node,
      id: remap(node.id),
      workflowId,
      position: { ...node.position },
      config: { ...node.config },
    })),
    edges: workflow.edges.map((edge) => ({
      ...edge,
      id: makeId(),
      source: remap(edge.source),
      target: remap(edge.target),
    })),
  }
}
