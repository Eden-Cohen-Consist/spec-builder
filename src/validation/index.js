import { fieldKey, withUniqueIds } from './issue.js'
import { validateAdmin, validateBusiness, validateBlock } from './rules.js'

/**
 * Everything the form can complain about, in one list. Workflow issues are produced
 * separately by validateAllWorkflows and concatenated by App.
 * @returns {import('./issue.js').Issue[]}
 */
export const validateSpec = ({ admin, business, blocks }) =>
  withUniqueIds([
    ...validateAdmin(admin),
    ...validateBusiness(business),
    ...blocks.flatMap(validateBlock),
  ])

/**
 * Field key -> message, errors only. Warnings never paint a control red, so a block can
 * carry advice without any of its inputs looking broken.
 */
export const fieldErrors = (issues) => {
  const map = new Map()
  for (const item of issues) {
    if (item.severity !== 'error' || !item.field) continue
    const key = fieldKey(item.field, item.rowId)
    if (!map.has(key)) map.set(key, item.message)
  }
  return map
}
