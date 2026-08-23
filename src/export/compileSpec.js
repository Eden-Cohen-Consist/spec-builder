import { hasContactContent, isThirdParty } from '../model/factories.js'

// If the PM pasted valid JSON, embed it as a real object; otherwise keep the raw string
const tryParseJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
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
