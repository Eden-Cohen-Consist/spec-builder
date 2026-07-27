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

// Per-type node payload. HTTP nodes only carry the link — the full request lives once, in
// technicalBlocks, so the AI joins the two sections instead of reading two copies.
const compileNodeConfig = (node, blocks) => {
  const config = node.config ?? {}
  switch (node.type) {
    case 'HTTP_REQUEST': {
      const block = blocks.find((b) => b.id === config.blockId && b.type === 'http')
      return {
        http: {
          linkedBlockId: config.blockId || null,
          linkedBlock: block
            ? {
                method: block.method,
                endpoint: block.endpoint,
                source: block.source,
                destination: block.destination,
              }
            : null,
          ...(config.notes?.trim() && { notes: config.notes }),
        },
      }
    }
    case 'DELAY':
      return { delay: { duration: config.duration ?? '', unit: config.unit ?? 'MINUTES' } }
    case 'PARALLEL':
      return config.notes?.trim() ? { parallel: { notes: config.notes } } : {}
    default:
      return {}
  }
}

export const compileSpec = ({ admin, business, workflows, blocks }) => {
  return {
    meta: {
      tool: 'Glassix Spec Builder',
      generatedAt: new Date().toISOString(),
      language: 'he',
      schemaVersion: 2,
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
      const nodeIds = new Set(workflow.nodes.map((n) => n.id))
      return {
        id: workflow.id,
        name: workflow.name,
        ...(workflow.description?.trim() && { description: workflow.description }),
        trigger: {
          type: workflow.triggerType,
          ...(workflow.triggerDescription?.trim() && { description: workflow.triggerDescription }),
        },
        nodes: workflow.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          title: node.title,
          ...(node.description?.trim() && { description: node.description }),
          ...compileNodeConfig(node, blocks),
        })),
        // Canvas positions are UI state — dropped so they don't distract the reviewer
        edges: workflow.edges
          .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
          .map((edge) => ({
            id: edge.id,
            from: edge.source,
            to: edge.target,
            ...(edge.sourceHandle && { branch: edge.sourceHandle }),
            ...(edge.label?.trim() && { label: edge.label }),
            ...(edge.condition?.trim() && { condition: edge.condition }),
          })),
      }
    }),
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
            security: {
              authType: block.authType,
              errorFallback: block.fallback,
            },
          }
        }
        case 'freeText':
          return {
            type: 'freeText',
            title: block.title,
            description: block.text,
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
