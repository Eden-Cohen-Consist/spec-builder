import { INTERNAL_SYSTEMS } from '../constants.js'

export const makeId = () => crypto.randomUUID()

const WIZARD_STEPS = new Set([1, 2, 3])

/** Clamp a persisted wizard cursor. Missing or junk values fall back to step 1. */
export const sanitizeWizard = (raw) => {
  const toStep = (value) => {
    const n = Number(value)
    return WIZARD_STEPS.has(n) ? n : 1
  }
  const step = toStep(raw?.step)
  const maxReached = Math.max(step, toStep(raw?.maxReached))
  return { step, maxReached }
}

export const isThirdParty = (destination) => {
  const dest = destination.trim().toLowerCase()
  return dest !== '' && !INTERNAL_SYSTEMS.includes(dest)
}

export const makeContactRow = () => ({ id: makeId(), name: '', email: '', phone: '', jobTitle: '' })

export const makeDepartmentRow = () => ({
  id: makeId(),
  name: '',
  shortId: '',
  uuid: '',
})

export const hasContactContent = (contact) =>
  [contact.name, contact.email, contact.phone, contact.jobTitle].some((v) => v?.trim())

export const makeMappingRow = () => ({
  id: makeId(),
  sourceField: '',
  targetField: '',
  type: 'String',
  required: false,
  notes: '',
})

export const makeHeaderRow = () => ({ id: makeId(), key: '', value: '' })

export const makeTestRow = () => ({ id: makeId(), key: '', value: '', notes: '' })

export const makeTableColumn = () => ({ id: makeId(), label: '' })

export const makeTableRow = () => ({ id: makeId(), cells: {} })

export const makeBlock = (type) => {
  const base = { id: makeId(), type }
  switch (type) {
    case 'http':
      return {
        ...base,
        title: '',
        source: '',
        destination: '',
        endpoint: '',
        method: 'GET',
        headers: [],
        headersEnabled: false,
        requestPayload: '',
        responsePayload: '',
        mapping: [makeMappingRow()],
        ipWhitelistRequired: false,
        whitelistedIps: '',
        certificateRequired: false,
        certificateDetails: '',
        fallback: '',
      }
    case 'freeText':
      return { ...base, title: '', text: '' }
    case 'testData':
      return { ...base, rows: [makeTestRow()] }
    case 'table':
      return {
        ...base,
        name: '',
        freeText: '',
        columns: [makeTableColumn(), makeTableColumn()],
        rows: [makeTableRow()],
      }
    default:
      return base
  }
}
