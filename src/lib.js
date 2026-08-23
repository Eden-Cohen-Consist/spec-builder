import { marked } from 'marked'
import { INTERNAL_SYSTEMS } from './constants.js'
import AI_REVIEW_PROMPT from './prompts/ai-review.md?raw'

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

// If the PM pasted valid JSON, embed it as a real object; otherwise keep the raw string
const tryParseJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
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

// A chat UI renders the spec inside a ```markdown fence, and "copy" grabs the fence too.
// Pasted verbatim that makes the whole document one code block instead of a spec, so the
// wrapper is peeled off before parsing. Only an empty or markdown info string is unwrapped —
// a document that really is a single ```json block must stay a code block.
const FULL_DOCUMENT_FENCE = /^(`{3,}|~{3,})[ \t]*([^\n]*)\n([\s\S]*?)\n?\1[ \t]*$/
const MARKDOWN_FENCE_LANGS = new Set(['', 'markdown', 'md'])

export const stripMarkdownFence = (markdown) => {
  const match = FULL_DOCUMENT_FENCE.exec(markdown.trim())
  if (!match) return markdown
  const [, fence, info, content] = match
  if (!MARKDOWN_FENCE_LANGS.has(info.trim().toLowerCase())) return markdown
  // A fence closes at the first line of matching length, so an inner fence that long means
  // this really is a code block rather than a wrapper — leave it alone.
  const closesEarly = new RegExp(`^ {0,3}\\${fence[0]}{${fence.length},}[ \\t]*$`, 'm')
  return closesEarly.test(content) ? markdown : content
}

// Word rebuilds pasted HTML as its own document: it drops stylesheets, maps every block
// element to a paragraph, and resolves direction/alignment per paragraph rather than
// inheriting them from an ancestor. So a single RTL wrapper is not enough — every block
// needs its own dir attribute and inline style.
const WORD_FONT = "font-family:Arial,'Segoe UI',sans-serif;font-size:11pt;"
const WORD_MONO = "font-family:Consolas,'Courier New',monospace;font-size:9.5pt;"
const WORD_RTL = 'direction:rtl;text-align:right;'

const WORD_BLOCK_STYLES = {
  H1: `${WORD_FONT}${WORD_RTL}font-size:19pt;font-weight:bold;margin:0 0 12pt;`,
  H2: `${WORD_FONT}${WORD_RTL}font-size:15pt;font-weight:bold;margin:18pt 0 8pt;`,
  H3: `${WORD_FONT}${WORD_RTL}font-size:13pt;font-weight:bold;margin:14pt 0 6pt;`,
  H4: `${WORD_FONT}${WORD_RTL}font-size:11.5pt;font-weight:bold;margin:12pt 0 6pt;`,
  H5: `${WORD_FONT}${WORD_RTL}font-weight:bold;margin:12pt 0 6pt;`,
  H6: `${WORD_FONT}${WORD_RTL}font-weight:bold;margin:12pt 0 6pt;`,
  P: `${WORD_FONT}${WORD_RTL}margin:0 0 10pt;line-height:1.5;`,
  UL: `${WORD_FONT}${WORD_RTL}margin:0 0 10pt;padding:0 24pt 0 0;`,
  OL: `${WORD_FONT}${WORD_RTL}margin:0 0 10pt;padding:0 24pt 0 0;`,
  LI: `${WORD_FONT}${WORD_RTL}margin:0 0 4pt;line-height:1.5;`,
  BLOCKQUOTE: `${WORD_FONT}${WORD_RTL}margin:0 0 10pt;padding:0 12pt 0 0;border-right:3px solid #d9d9d9;color:#555555;`,
  TABLE: 'direction:rtl;border-collapse:collapse;width:100%;margin:0 0 12pt;mso-table-lspace:0pt;mso-table-rspace:0pt;',
  TH: `${WORD_FONT}${WORD_RTL}border:1px solid #999999;background:#f2f2f2;padding:5px 9px;font-weight:bold;vertical-align:top;`,
  TD: `${WORD_FONT}${WORD_RTL}border:1px solid #999999;padding:5px 9px;vertical-align:top;`,
  HR: 'border:0;border-top:1px solid #d9d9d9;margin:14pt 0;',
}

const CODE_BLOCK_STYLE = `${WORD_MONO}direction:ltr;text-align:left;background:#f6f6f6;border:1px solid #d9d9d9;padding:8px 10px;margin:0 0 12pt;`

// A <pre> loses its whitespace once Word reflows it into a paragraph, so the code block is
// rebuilt with hard line breaks and non-breaking indentation instead.
const rewriteCodeBlocks = (doc) => {
  doc.querySelectorAll('pre').forEach((pre) => {
    const source = (pre.querySelector('code') ?? pre).textContent.replace(/\n+$/, '')
    const box = doc.createElement('div')
    box.setAttribute('dir', 'ltr')
    box.setAttribute('style', CODE_BLOCK_STYLE)
    source.split('\n').forEach((line, index) => {
      if (index > 0) box.appendChild(doc.createElement('br'))
      box.appendChild(doc.createTextNode(line.replace(/^ +/, (spaces) => '\u00a0'.repeat(spaces.length))))
    })
    pre.replaceWith(box)
  })
}

const styleInlineCode = (doc) => {
  doc.querySelectorAll('code').forEach((code) => {
    code.setAttribute('dir', 'ltr')
    code.setAttribute('style', `${WORD_MONO}background:#f2f2f2;`)
    // LRM guards stop trailing punctuation of a Latin snippet from being re-ordered to the
    // wrong end of the run when Word lays out the surrounding Hebrew text
    code.before(doc.createTextNode('\u200e'))
    code.after(doc.createTextNode('\u200e'))
  })
}

export const markdownToWordHtml = (markdown) => {
  const doc = new DOMParser().parseFromString(marked.parse(markdown, { gfm: true }), 'text/html')
  rewriteCodeBlocks(doc)
  styleInlineCode(doc)
  doc.body.querySelectorAll('*').forEach((el) => {
    const style = WORD_BLOCK_STYLES[el.tagName]
    if (!style) return
    el.setAttribute('style', style)
    if (el.tagName !== 'HR') el.setAttribute('dir', 'rtl')
  })
  return `<div dir="rtl" style="${WORD_FONT}${WORD_RTL}">${doc.body.innerHTML}</div>`
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

// The exported JSON is read by an LLM, so every cross-reference is a human-readable name
// instead of a uuid. Names must still be unique to stay unambiguous — collisions get " (2)".
const uniqueRef = (base, used) => {
  const clean = base.trim() || 'ללא שם'
  let ref = clean
  for (let n = 2; used.has(ref); n++) ref = `${clean} (${n})`
  used.add(ref)
  return ref
}

// Per-type node payload. HTTP nodes only carry the block name — the full request lives once,
// in technicalBlocks, so the AI joins the two sections instead of reading two copies.
const compileNodeConfig = (node, blockRefs) => {
  const config = node.config ?? {}
  switch (node.type) {
    case 'HTTP_REQUEST':
      return {
        integrationBlock: blockRefs.get(config.blockId) ?? null,
        ...(config.notes?.trim() && { notes: config.notes }),
      }
    default:
      return {}
  }
}

/**
 * Flattens a workflow's graph into reading order: a breadth-first walk from START (so shared
 * endpoints like END come after everything leading into them), each node carrying its own
 * outgoing routes. Nodes unreachable from START are appended and flagged, so broken drafts
 * surface instead of vanishing.
 */
const compileWorkflowNodes = (workflow, blockRefs) => {
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]))
  const usedRefs = new Set()
  const refs = new Map(
    workflow.nodes.map((node) => [node.id, uniqueRef(node.title || node.type, usedRefs)]),
  )
  const routesFrom = (id) => workflow.edges.filter((e) => e.source === id && byId.has(e.target))

  const order = []
  const enqueue = (id) => {
    if (order.includes(id)) return
    order.push(id)
  }
  workflow.nodes.filter((node) => node.type === 'START').forEach((node) => enqueue(node.id))
  for (let i = 0; i < order.length; i++) routesFrom(order[i]).forEach((edge) => enqueue(edge.target))
  const reachable = new Set(order)
  workflow.nodes.forEach((node) => enqueue(node.id))

  return order.map((id, index) => {
    const node = byId.get(id)
    const routes = routesFrom(id).map((edge) => ({
      to: refs.get(edge.target),
      ...(edge.label?.trim()
        ? { when: edge.label }
        : edge.sourceHandle && { when: edge.sourceHandle }),
      ...(edge.condition?.trim() && { condition: edge.condition }),
    }))
    return {
      step: index + 1,
      name: refs.get(id),
      type: node.type,
      ...(node.description?.trim() && { description: node.description }),
      ...compileNodeConfig(node, blockRefs),
      ...(routes.length ? { next: routes } : {}),
      ...(!reachable.has(id) && { unreachableFromStart: true }),
    }
  })
}

export const compileSpec = ({ admin, business, workflows, blocks }) => {
  // Block names are resolved before the workflows so HTTP nodes can point at them by name
  const usedBlockRefs = new Set()
  const blockRefs = new Map(
    blocks.map((block) => [
      block.id,
      uniqueRef(block.title || block.name || block.type, usedBlockRefs),
    ]),
  )

  return {
    meta: {
      tool: 'Glassix Spec Builder',
      generatedAt: new Date().toISOString(),
      language: 'he',
      schemaVersion: 4,
    },
    administrative: {
      clientName: admin.clientName,
      projectManager: admin.pmName,
      contacts: admin.contacts
        .filter(hasContactContent)
        .map(({ name, email, phone, jobTitle }) => ({ name, email, phone, jobTitle })),
      departmentCreated: admin.departmentCreated,
      ...(admin.departmentCreated && {
        departments: admin.departments.map(({ name, shortId, uuid }) => ({ name, shortId, uuid })),
      }),
    },
    businessNeed: {
      businessGoal: business.goal,
    },
    // Canvas positions and ids are UI state — dropped so they don't distract the reviewer
    workflows: workflows.map((workflow) => ({
      name: workflow.name,
      ...(workflow.description?.trim() && { description: workflow.description }),
      trigger: {
        type: workflow.triggerType,
        ...(workflow.triggerDescription?.trim() && { description: workflow.triggerDescription }),
      },
      steps: compileWorkflowNodes(workflow, blockRefs),
    })),
    technicalBlocks: blocks.map((block) => {
      const ref = blockRefs.get(block.id)
      switch (block.type) {
        case 'http': {
          const thirdParty = isThirdParty(block.destination)
          return {
            type: 'httpIntegration',
            // Same name workflow HTTP steps reference via `integrationBlock`
            name: ref,
            sourceSystem: block.source,
            destinationSystem: block.destination,
            isThirdParty: thirdParty,
            endpoint: block.endpoint,
            method: block.method,
            headers: block.headersEnabled
              ? block.headers
                  .filter((h) => h.key.trim() || h.value.trim())
                  .map((h) => ({ key: h.key, value: h.value }))
              : [],
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
              ...(block.ipWhitelistRequired && {
                ipWhitelist: { required: true, addresses: block.whitelistedIps },
              }),
              ...(block.certificateRequired && {
                certificate: { required: true, details: block.certificateDetails },
              }),
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
              .filter((row) => row.key.trim() || row.value.trim() || row.notes?.trim())
              .map((row) => ({ key: row.key, value: row.value, notes: row.notes ?? '' })),
          }
        case 'table': {
          const columnLabels = block.columns.map((col, i) => col.label.trim() || `עמודה ${i + 1}`)
          return {
            type: 'dynamicTable',
            name: block.name,
            ...(block.freeText?.trim() && { freeText: block.freeText }),
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
