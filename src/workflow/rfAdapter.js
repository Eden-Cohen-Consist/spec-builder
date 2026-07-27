/** Every business node renders through the same custom component. */
export const RF_NODE_TYPE = 'wf'

export const decisionSourceHandleCount = (outgoing) => {
  const highestUsed = outgoing.reduce((max, edge) => {
    const match = /^branch-(\d+)$/.exec(edge.sourceHandle ?? '')
    return match ? Math.max(max, Number(match[1])) : max
  }, -1)
  return Math.max(2, outgoing.length + 1, highestUsed + 1)
}

export const toRfNodes = (workflow, issuesByNode) =>
  workflow.nodes.map((node) => {
    const issues = issuesByNode.get(node.id) ?? []
    const outgoing = workflow.edges.filter((e) => e.source === node.id)
    return {
      id: node.id,
      type: RF_NODE_TYPE,
      position: node.position,
      data: {
        node,
        hasError: issues.some((i) => i.severity === 'error'),
        hasWarning: issues.some((i) => i.severity === 'warning'),
        issueCount: issues.length,
        sourceHandleCount: node.type === 'DECISION' ? decisionSourceHandleCount(outgoing) : 1,
      },
    }
  })

/**
 * Edges pointing at a node that no longer exists stay in the model (validation reports
 * them) but are filtered here so React Flow doesn't warn about them.
 */
export const toRfEdges = (workflow, onDelete) => {
  const nodeIds = new Set(workflow.nodes.map((n) => n.id))
  return workflow.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? null,
      label: edge.label?.trim() || undefined,
      data: { onDelete },
    }))
}
