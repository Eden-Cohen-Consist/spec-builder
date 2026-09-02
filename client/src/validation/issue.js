/**
 * One issue shape for every source in the app. This is the shape
 * src/workflow/validation.js already emits, plus `scope`, `blockId`, `field` and `rowId`,
 * so form issues and graph issues can render through one code path.
 *
 * @typedef {Object} Issue
 * @property {string} id
 * @property {'admin'|'business'|'block'|'workflow'} scope
 * @property {string} code
 * @property {string} message
 * @property {'error'|'warning'} severity
 * @property {string} [blockId]
 * @property {string} [field]   - which control the issue points at
 * @property {string} [rowId]   - the row, when the field is a collection
 * @property {string} [workflowId]
 * @property {string} [nodeId]
 * @property {string} [edgeId]
 */

export const makeIssue = (severity, scope, code, message, extra = {}) => ({
  id: `${scope}:${code}:${extra.blockId ?? ''}:${extra.field ?? ''}:${extra.rowId ?? ''}`,
  scope,
  code,
  message,
  severity,
  ...extra,
})

/** Repeated codes on one block would collide as React keys — suffix by position. */
export const withUniqueIds = (issues) =>
  issues.map((item, index) => ({ ...item, id: `${item.id}#${index}` }))

/** How a component looks its own error up: plain field, or field#rowId inside a collection. */
export const fieldKey = (field, rowId) => (rowId ? `${field}#${rowId}` : field)

export const countIssues = (issues) => ({
  errors: issues.filter((i) => i.severity === 'error').length,
  warnings: issues.filter((i) => i.severity === 'warning').length,
})
