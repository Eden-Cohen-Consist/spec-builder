import { NODE_META, WORKFLOW_TRIGGER_TYPES } from './constants.js'

/**
 * @typedef {Object} Issue
 * @property {string} id
 * @property {string} workflowId
 * @property {string} [nodeId]
 * @property {string} [edgeId]
 * @property {string} code
 * @property {string} message
 * @property {'error'|'warning'} severity
 */

const issue = (severity, workflowId, code, message, extra = {}) => ({
  id: `${workflowId}:${code}:${extra.nodeId ?? extra.edgeId ?? ''}`,
  workflowId,
  code,
  message,
  severity,
  ...extra,
})

const label = (workflow) => workflow.name.trim() || 'תהליך ללא שם'

const nodeLabel = (node) => node.title?.trim() || NODE_META[node.type]?.label || 'שלב'

/** Node ids reachable from every START node. */
const reachableFromStart = (workflow) => {
  const reached = new Set(workflow.nodes.filter((n) => n.type === 'START').map((n) => n.id))
  const queue = [...reached]
  while (queue.length > 0) {
    const current = queue.pop()
    for (const edge of workflow.edges) {
      if (edge.source === current && !reached.has(edge.target)) {
        reached.add(edge.target)
        queue.push(edge.target)
      }
    }
  }
  return reached
}

/**
 * @param {import('./model.js').Workflow} workflow
 * @returns {Issue[]}
 */
export const validateWorkflow = (workflow) => {
  const issues = []
  const push = (...args) => issues.push(issue(...args))
  const id = workflow.id
  const nodeIds = new Set(workflow.nodes.map((n) => n.id))

  if (!workflow.name.trim()) push('error', id, 'MISSING_NAME', 'לתהליך אין שם')
  if (!WORKFLOW_TRIGGER_TYPES.includes(workflow.triggerType)) {
    push('error', id, 'MISSING_TRIGGER', `לתהליך "${label(workflow)}" אין טריגר תקין`)
  }

  const starts = workflow.nodes.filter((n) => n.type === 'START')
  const ends = workflow.nodes.filter((n) => n.type === 'END')
  if (starts.length === 0) push('error', id, 'NO_START', 'חסר שלב התחלה בתהליך')
  if (starts.length > 1) push('warning', id, 'MULTIPLE_START', 'קיים יותר משלב התחלה אחד')
  if (ends.length === 0) push('error', id, 'NO_END', 'חסר שלב סיום בתהליך')

  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      push('error', id, 'EDGE_MISSING_NODE', 'קיים חיבור שמצביע לשלב שכבר לא קיים', {
        edgeId: edge.id,
      })
    }
  }

  const reached = reachableFromStart(workflow)

  for (const node of workflow.nodes) {
    const nodeId = node.id
    const outgoing = workflow.edges.filter((e) => e.source === nodeId)

    if (!NODE_META[node.type]) {
      push('error', id, 'NODE_UNKNOWN_TYPE', `לשלב "${nodeLabel(node)}" יש סוג לא מוכר`, { nodeId })
      continue
    }

    if (node.type !== 'END' && outgoing.length === 0) {
      push('error', id, 'DEAD_END', `השלב "${nodeLabel(node)}" לא מחובר לשלב הבא`, { nodeId })
    }

    if (node.type !== 'START' && !reached.has(nodeId) && node.config?.draft !== true) {
      push('warning', id, 'ORPHAN_NODE', `השלב "${nodeLabel(node)}" מנותק ולא נגיש מההתחלה`, { nodeId })
    }

    if (node.type === 'DECISION') {
      if (outgoing.length < 2) {
        push('error', id, 'DECISION_PATHS', `להחלטה "${nodeLabel(node)}" חסרים מסלולים — נדרשים לפחות שניים`, { nodeId })
      }
      if (outgoing.some((e) => !e.label?.trim())) {
        push('warning', id, 'DECISION_UNLABELED', `להחלטה "${nodeLabel(node)}" יש מסלול ללא שם תנאי`, { nodeId })
      }
    }

    if (node.type === 'HTTP_REQUEST' && !node.config?.blockId && !node.config?.notes?.trim()) {
      push('warning', id, 'HTTP_NO_BLOCK', `לשלב "${nodeLabel(node)}" לא הוצמד בלוק אינטגרציה`, { nodeId })
    }
  }

  return issues
}

/**
 * Validates every workflow independently.
 * @returns {{issues: Issue[]}}
 */
export const validateAllWorkflows = (workflows) => {
  // Suffix the index so repeated codes on one node (e.g. several DECISION issues) stay
  // unique as React keys
  const issues = workflows
    .flatMap((w) => validateWorkflow(w))
    .map((item, index) => ({ ...item, scope: 'workflow', id: `${item.id}#${index}` }))
  return { issues }
}
