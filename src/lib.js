import { INTERNAL_SYSTEMS } from './constants.js'
import AI_REVIEW_PROMPT from './prompts/ai-review.md?raw'

export const makeId = () => crypto.randomUUID()

export const isThirdParty = (destination) => {
  const dest = destination.trim().toLowerCase()
  return dest !== '' && !INTERNAL_SYSTEMS.includes(dest)
}

// If the PM pasted valid JSON, embed it as a real object; otherwise keep the raw string
const tryParseJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const makeContactRow = () => ({ id: makeId(), name: '', email: '', phone: '', jobTitle: '' })

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

export const makeTestRow = () => ({ id: makeId(), key: '', value: '' })

export const makeTableColumn = () => ({ id: makeId(), label: '' })

export const makeTableRow = () => ({ id: makeId(), cells: {} })

export const makeBlock = (type) => {
  const base = { id: makeId(), type }
  switch (type) {
    case 'http':
      return {
        ...base,
        source: '',
        destination: '',
        endpoint: '',
        method: 'GET',
        headers: [],
        requestPayload: '',
        responsePayload: '',
        mapping: [makeMappingRow()],
      }
    case 'security':
      return { ...base, authType: 'None', fallback: '' }
    case 'testData':
      return { ...base, rows: [makeTestRow()] }
    case 'table':
      return {
        ...base,
        name: '',
        columns: [makeTableColumn(), makeTableColumn()],
        rows: [makeTableRow()],
      }
    default:
      return base
  }
}

export const buildAiExportText = (spec) => {
  const jsonBlock = JSON.stringify(spec, null, 2)
  return `${AI_REVIEW_PROMPT.trim()}

---

## PM Draft Specification (JSON Input)

\`\`\`json
${jsonBlock}
\`\`\`
`
}

export const compileSpec = ({ admin, business, flow, blocks }) => {
  let stepCounter = 0

  return {
    meta: {
      tool: 'Glassix Spec Builder',
      generatedAt: new Date().toISOString(),
      language: 'he',
    },
    administrative: {
      clientName: admin.clientName,
      projectManager: admin.pmName,
      contacts: admin.contacts
        .filter(hasContactContent)
        .map(({ name, email, phone, jobTitle }) => ({ name, email, phone, jobTitle })),
      departmentCreated: admin.departmentCreated,
      ...(admin.departmentCreated && { departmentId: admin.departmentId }),
    },
    businessNeed: {
      businessGoal: business.goal,
      trigger: business.trigger,
    },
    logicalFlow: flow.map((node) =>
      node.kind === 'step'
        ? { type: 'step', step: ++stepCounter, description: node.text }
        : {
            type: 'branch',
            paths: node.paths.map((path) => ({
              condition: path.name,
              actions: path.actions,
            })),
          },
    ),
    technicalBlocks: blocks.map((block) => {
      switch (block.type) {
        case 'http': {
          const thirdParty = isThirdParty(block.destination)
          return {
            type: 'httpIntegration',
            sourceSystem: block.source,
            destinationSystem: block.destination,
            isThirdParty: thirdParty,
            endpoint: block.endpoint,
            method: block.method,
            headers: block.headers
              .filter((h) => h.key.trim() || h.value.trim())
              .map((h) => ({ key: h.key, value: h.value })),
            ...(thirdParty && {
              requestPayload: tryParseJson(block.requestPayload),
              responsePayload: tryParseJson(block.responsePayload),
            }),
            dataMapping: block.mapping
              .filter((row) => row.sourceField.trim() || row.targetField.trim())
              .map((row) => ({
                sourceField: row.sourceField,
                targetField: row.targetField,
                type: row.type,
                required: row.required,
                notes: row.notes,
              })),
          }
        }
        case 'security':
          return {
            type: 'securityAndErrorHandling',
            authType: block.authType,
            errorFallback: block.fallback,
          }
        case 'testData':
          return {
            type: 'testData',
            entries: block.rows
              .filter((row) => row.key.trim() || row.value.trim())
              .map((row) => ({ key: row.key, value: row.value })),
          }
        case 'table': {
          const columnLabels = block.columns.map((col, i) => col.label.trim() || `עמודה ${i + 1}`)
          return {
            type: 'dynamicTable',
            name: block.name,
            columns: columnLabels,
            rows: block.rows
              .filter((row) => block.columns.some((col) => (row.cells[col.id] ?? '').trim()))
              .map((row) =>
                Object.fromEntries(
                  block.columns.map((col, i) => [columnLabels[i], row.cells[col.id] ?? '']),
                ),
              ),
          }
        }
        default:
          return { type: block.type }
      }
    }),
  }
}
