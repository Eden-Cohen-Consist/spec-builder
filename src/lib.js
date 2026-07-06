import { INTERNAL_SYSTEMS } from './constants.js'

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

export const makeMappingRow = () => ({
  id: makeId(),
  sourceField: '',
  targetField: '',
  type: 'String',
  required: false,
  notes: '',
})

export const makeTestRow = () => ({ id: makeId(), key: '', value: '' })

export const makeBlock = (type) => {
  const base = { id: makeId(), type }
  switch (type) {
    case 'http':
      return {
        ...base,
        source: '',
        destination: '',
        requestPayload: '',
        responsePayload: '',
        mapping: [makeMappingRow()],
      }
    case 'security':
      return { ...base, authType: 'None', fallback: '' }
    case 'testData':
      return { ...base, rows: [makeTestRow()] }
    default:
      return base
  }
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
      contacts: admin.contacts,
      departmentCreated: admin.departmentCreated,
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
        default:
          return { type: block.type }
      }
    }),
  }
}
