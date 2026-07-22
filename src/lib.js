import { marked } from 'marked'
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

export const makeTriggerRow = () => ({ id: makeId(), text: '' })

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

// Shell-style tokenizer for cURL commands: handles '...', "..." (with escapes) and bare words
const tokenizeCurl = (text) => {
  const tokens = []
  let current = ''
  let hasCurrent = false
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (' \t\r\n'.includes(ch)) {
      if (hasCurrent) {
        tokens.push(current)
        current = ''
        hasCurrent = false
      }
      i++
    } else if (ch === '$' && text[i + 1] === "'") {
      i++ // ANSI-C quoting ($'...') — treat like a single-quoted string
    } else if (ch === "'") {
      hasCurrent = true
      i++
      while (i < text.length && text[i] !== "'") current += text[i++]
      i++
    } else if (ch === '"') {
      hasCurrent = true
      i++
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\' && '\\"$`'.includes(text[i + 1])) {
          current += text[i + 1]
          i += 2
        } else {
          current += text[i++]
        }
      }
      i++
    } else if (ch === '\\' && i + 1 < text.length) {
      hasCurrent = true
      current += text[i + 1]
      i += 2
    } else {
      hasCurrent = true
      current += ch
      i++
    }
  }
  if (hasCurrent) tokens.push(current)
  return tokens
}

const CURL_DATA_FLAGS = new Set(['-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode'])
// Flags that consume a value we don't import — skip the value so it isn't mistaken for the URL
const CURL_SKIP_FLAGS = new Set(['-o', '--output', '-F', '--form', '-m', '--max-time', '--connect-timeout', '--retry', '-w', '--write-out', '-c', '--cookie-jar', '--cacert', '-E', '--cert', '--key', '-x', '--proxy'])

// Parse a cURL command (Postman / browser "Copy as cURL" style) into request parts.
// Returns { method, url, headers, body } or null if the text isn't a cURL command.
export const parseCurl = (input) => {
  const text = input.trim().replace(/(\\|\^|`)\r?\n\s*/g, ' ') // join multi-line commands
  if (!/^curl(\s|$)/i.test(text)) return null

  const tokens = tokenizeCurl(text).slice(1)
  const result = { method: '', url: '', headers: [], body: '' }
  const bodyParts = []
  let forceGet = false

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const next = () => tokens[++i] ?? ''
    if (token === '-X' || token === '--request') {
      result.method = next().toUpperCase()
    } else if (/^-X./.test(token)) {
      result.method = token.slice(2).toUpperCase()
    } else if (token === '-H' || token === '--header') {
      const raw = next()
      const colon = raw.indexOf(':')
      if (colon > 0) result.headers.push({ key: raw.slice(0, colon).trim(), value: raw.slice(colon + 1).trim() })
    } else if (CURL_DATA_FLAGS.has(token)) {
      bodyParts.push(next())
    } else if (token === '--url') {
      result.url = next()
    } else if (token === '-u' || token === '--user') {
      const creds = next()
      try {
        result.headers.push({ key: 'Authorization', value: `Basic ${btoa(creds)}` })
      } catch {
        /* non-latin credentials — can't base64-encode, skip */
      }
    } else if (token === '-b' || token === '--cookie') {
      result.headers.push({ key: 'Cookie', value: next() })
    } else if (token === '-A' || token === '--user-agent') {
      result.headers.push({ key: 'User-Agent', value: next() })
    } else if (token === '-e' || token === '--referer') {
      result.headers.push({ key: 'Referer', value: next() })
    } else if (token === '-G' || token === '--get') {
      forceGet = true
    } else if (CURL_SKIP_FLAGS.has(token)) {
      next()
    } else if (token.startsWith('-')) {
      // boolean flags (--compressed, -s, -L, -k, -i, -v, ...) — ignore
    } else if (!result.url) {
      result.url = token
    }
  }

  result.body = bodyParts.join('&')
  result.method = forceGet ? 'GET' : result.method || (result.body ? 'POST' : 'GET')
  try {
    result.body = JSON.stringify(JSON.parse(result.body), null, 2)
  } catch {
    /* not JSON — keep raw */
  }
  return result
}

// Convert AI-generated Markdown to Word/Docs-friendly HTML: RTL wrapper + inline
// table borders, since Word ignores external CSS when pasting from the clipboard
export const markdownToWordHtml = (markdown) => {
  const body = marked.parse(markdown, { gfm: true })
  const styled = body
    .replace(/<table>/g, '<table dir="rtl" style="border-collapse:collapse;">')
    .replace(/<th([ >])/g, '<th style="border:1px solid #999;background:#f2f2f2;padding:5px 10px;text-align:right;"$1')
    .replace(/<td([ >])/g, '<td style="border:1px solid #999;padding:5px 10px;"$1')
  return `<div dir="rtl" style="font-family:Arial,sans-serif;">${styled}</div>`
}

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
        requestPayload: '',
        responsePayload: '',
        mapping: [makeMappingRow()],
        authType: 'None',
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

// --- Reader-facing flow export -------------------------------------------------
// The internal graph links nodes and branches by UUID. For the AI hand-off we
// re-express each workflow with human names: every node gets a unique readable id
// and every edge/branch points at that name instead of an opaque handle, so the
// flow reads like a sentence instead of a lookup table of IDs.

// Map node id -> a unique, human-readable name. Titles are reused as-is; repeats
// get a numeric suffix so references stay unambiguous.
const buildNodeRefs = (nodes) => {
  const refs = new Map()
  const used = new Map()
  for (const node of nodes) {
    const base = (node.title || '').trim() || node.type
    const seen = used.get(base) ?? 0
    used.set(base, seen + 1)
    refs.set(node.id, seen === 0 ? base : `${base} (${seen + 1})`)
  }
  return refs
}

// Describe a Call Workflow input source in words instead of a "nodeId.field" pointer.
const describeMappingSource = (mapping, refOf) => {
  const value = (mapping.sourceValue || '').trim()
  switch (mapping.sourceType) {
    case 'WORKFLOW_INPUT':
      return { from: 'workflowInput', value }
    case 'NODE_OUTPUT': {
      const dot = value.indexOf('.')
      const nodeId = dot === -1 ? value : value.slice(0, dot)
      return { from: 'nodeOutput', node: refOf(nodeId) ?? nodeId, field: dot === -1 ? '' : value.slice(dot + 1) }
    }
    case 'CONTEXT':
      return { from: 'context', value }
    default:
      return { from: 'static', value }
  }
}

// Turn one workflow's node/edge graph into a name-based `flow` plus a plain-text
// `flowSummary` (a list of "from → to" transitions to verify against).
const buildWorkflowFlow = (workflow, { workflowNameById, blockTitleById }) => {
  const nodeRefs = buildNodeRefs(workflow.nodes)
  const nodeById = new Map(workflow.nodes.map((node) => [node.id, node]))
  const refOf = (id) => nodeRefs.get(id) ?? null
  const validEdges = workflow.edges.filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target))
  const outgoing = new Map(workflow.nodes.map((node) => [node.id, []]))
  for (const edge of validEdges) outgoing.get(edge.source).push(edge)

  const flowSummary = []
  const arrow = (from, to, note) => flowSummary.push(`${from} → ${to ?? '(מנותק)'}${note ? ` [${note}]` : ''}`)

  const flow = workflow.nodes.map((node) => {
    const ref = nodeRefs.get(node.id)
    const edges = outgoing.get(node.id) ?? []
    const out = {
      id: ref,
      type: node.type,
      ...(node.description?.trim() && { description: node.description }),
    }

    // Decision / parallel: fold each branch's label, condition and destination together.
    if (node.type === 'DECISION' || node.type === 'PARALLEL') {
      const branches = Array.isArray(node.config?.branches) ? node.config.branches : []
      out.branches = branches.map((branch) => {
        const edge = edges.find((candidate) => candidate.sourceHandle === branch.id)
        const goesTo = edge ? refOf(edge.target) : null
        const condition = node.type === 'DECISION' ? (branch.condition || '').trim() : ''
        arrow(ref, goesTo, [branch.label, condition].filter(Boolean).join(': '))
        return { label: branch.label, ...(condition && { condition }), goesTo }
      })
      return out
    }

    if (node.type === 'HTTP_REQUEST') {
      const title = blockTitleById.get(node.config?.technicalBlockId)
      if (title) out.technicalBlock = title
    } else if (node.type === 'DELAY') {
      out.duration = node.config?.duration
      out.unit = node.config?.unit
    } else if (node.type === 'CALL_WORKFLOW') {
      out.targetWorkflow = workflowNameById.get(node.config?.targetWorkflowId) ?? null
      out.waitForCompletion = node.config?.waitForCompletion !== false
      const inputMappings = Array.isArray(node.config?.inputMappings) ? node.config.inputMappings : []
      if (inputMappings.length) {
        out.inputMappings = inputMappings.map((mapping) => ({
          targetInput: mapping.targetInput,
          source: describeMappingSource(mapping, refOf),
        }))
      }
      const outputMappings = Array.isArray(node.config?.outputMappings) ? node.config.outputMappings : []
      if (outputMappings.length) {
        out.outputMappings = outputMappings.map(({ sourceOutput, targetVariable }) => ({ sourceOutput, targetVariable }))
      }
      const successEdge = edges.find((edge) => edge.sourceHandle === 'success') || edges.find((edge) => !edge.sourceHandle)
      out.onSuccess = successEdge ? refOf(successEdge.target) : refOf(node.config?.onSuccess?.nextNodeId)
      arrow(ref, out.onSuccess, 'הצלחה')
      const behavior = node.config?.onFailure?.behavior ?? 'STOP'
      if (behavior === 'GO_TO_NODE') {
        const failureEdge = edges.find((edge) => edge.sourceHandle === 'failure')
        const goesTo = refOf(failureEdge?.target ?? node.config?.onFailure?.targetNodeId)
        out.onFailure = { behavior, goesTo }
        arrow(ref, goesTo, 'כשל')
      } else {
        out.onFailure = { behavior }
      }
      return out
    }

    // Everything else has a plain successor (or several): resolve to names.
    if (node.type !== 'END') {
      const routes = edges.map((edge) => ({
        ...(edge.label?.trim() && { label: edge.label }),
        goesTo: refOf(edge.target),
      }))
      if (routes.length === 1 && !routes[0].label) {
        out.next = routes[0].goesTo
        arrow(ref, routes[0].goesTo)
      } else if (routes.length) {
        out.next = routes
        for (const route of routes) arrow(ref, route.goesTo, route.label)
      }
    }

    return out
  })

  return { flow, flowSummary }
}

export const compileSpec = ({ admin, business, workflows, blocks }) => {
  const workflowNameById = new Map(workflows.map((workflow) => [workflow.id, workflow.name]))
  const blockTitleById = new Map(
    blocks
      .filter((block) => block.type === 'http')
      .map((block) => [block.id, (block.title || '').trim() || block.destination || 'HTTP']),
  )
  return {
    meta: {
      tool: 'Glassix Spec Builder',
      schemaVersion: 2,
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
      triggers: business.triggers.map((t) => t.text).filter((text) => text.trim()),
    },
    workflows: workflows.map((workflow) => {
      const { flow, flowSummary } = buildWorkflowFlow(workflow, { workflowNameById, blockTitleById })
      const connections = workflow.connections
        .map((connection) => workflowNameById.get(connection.targetWorkflowId))
        .filter(Boolean)
        .map((name) => ({ to: name }))
      const variable = ({ name, type, required, description }) => ({
        name,
        type,
        required,
        ...(description?.trim() && { description }),
      })
      return {
        name: workflow.name,
        ...(workflow.description?.trim() && { description: workflow.description }),
        triggerType: workflow.triggerType,
        ...(workflow.triggerDescription?.trim() && { triggerDescription: workflow.triggerDescription }),
        executionMode: workflow.executionMode,
        ...(connections.length && { connections }),
        ...(workflow.inputs.length && { inputs: workflow.inputs.map(variable) }),
        ...(workflow.outputs.length && { outputs: workflow.outputs.map(variable) }),
        flow,
        ...(flowSummary.length && { flowSummary }),
      }
    }),
    technicalBlocks: blocks.map((block) => {
      switch (block.type) {
        case 'http': {
          const thirdParty = isThirdParty(block.destination)
          return {
            id: block.id,
            type: 'httpIntegration',
            ...(block.title?.trim() && { title: block.title }),
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
            security: {
              authType: block.authType,
              errorFallback: block.fallback,
            },
          }
        }
        case 'freeText':
          return {
            id: block.id,
            type: 'freeText',
            title: block.title,
            description: block.text,
          }
        case 'testData':
          return {
            id: block.id,
            type: 'testData',
            entries: block.rows
              .filter((row) => row.key.trim() || row.value.trim())
              .map((row) => ({ key: row.key, value: row.value })),
          }
        case 'table': {
          const columnLabels = block.columns.map((col, i) => col.label.trim() || `עמודה ${i + 1}`)
          return {
            id: block.id,
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
          return { id: block.id, type: block.type }
      }
    }),
  }
}
