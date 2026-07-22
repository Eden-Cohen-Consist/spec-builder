/**
 * @typedef {'MANUAL'|'FORM_SUBMIT'|'WEBHOOK'|'EVENT'|'SCHEDULE'} WorkflowTriggerType
 * @typedef {'SYNC'|'ASYNC'} WorkflowExecutionMode
 * @typedef {'string'|'number'|'boolean'|'object'|'array'} WorkflowVariableType
 * @typedef {'START'|'ACTION'|'DECISION'|'HTTP_REQUEST'|'CALL_WORKFLOW'|'PARALLEL'|'DELAY'|'END'} WorkflowNodeType
 * @typedef {'STATIC'|'WORKFLOW_INPUT'|'NODE_OUTPUT'|'CONTEXT'} WorkflowMappingSourceType
 * @typedef {'STOP'|'CONTINUE'|'GO_TO_NODE'} WorkflowFailureBehavior
 * @typedef {'SECONDS'|'MINUTES'|'HOURS'|'DAYS'} WorkflowDelayUnit
 */

/**
 * @typedef {object} WorkflowVariable
 * @property {string} id
 * @property {string} name
 * @property {WorkflowVariableType} type
 * @property {boolean} required
 * @property {string=} description
 */

/**
 * @typedef {object} WorkflowInputMapping
 * @property {string} targetInput
 * @property {WorkflowMappingSourceType} sourceType
 * @property {string} sourceValue
 */

/**
 * @typedef {object} WorkflowOutputMapping
 * @property {string} sourceOutput
 * @property {string} targetVariable The output variable name in the calling workflow.
 */

/**
 * @typedef {object} CallWorkflowNodeConfig
 * @property {string} targetWorkflowId
 * @property {boolean} waitForCompletion
 * @property {WorkflowInputMapping[]} inputMappings
 * @property {WorkflowOutputMapping[]} outputMappings
 * @property {{nextNodeId?: string}=} onSuccess
 * @property {{behavior: WorkflowFailureBehavior, targetNodeId?: string}=} onFailure
 */

/**
 * @typedef {object} WorkflowBranch
 * @property {string} id
 * @property {string} label
 * @property {string=} condition
 */

/**
 * @typedef {object} WorkflowNode
 * @property {string} id
 * @property {string} workflowId
 * @property {WorkflowNodeType} type
 * @property {string} title
 * @property {string=} description
 * @property {{x: number, y: number}} position
 * @property {Record<string, unknown>|CallWorkflowNodeConfig} config
 * @property {boolean=} isDraft
 */

/**
 * @typedef {object} WorkflowEdge
 * @property {string} id
 * @property {string} source
 * @property {string} target
 * @property {string=} sourceHandle
 * @property {string=} label
 * @property {string=} condition
 */

/**
 * A relationship drawn on the workflow map. It deliberately does not create
 * or mutate nodes inside either workflow.
 * @typedef {object} WorkflowConnection
 * @property {string} id
 * @property {string} targetWorkflowId
 */

/**
 * @typedef {object} Workflow
 * @property {string} id
 * @property {string} name
 * @property {string=} description
 * @property {WorkflowTriggerType} triggerType
 * @property {string=} triggerDescription
 * @property {WorkflowExecutionMode} executionMode
 * @property {WorkflowVariable[]} inputs
 * @property {WorkflowVariable[]} outputs
 * @property {WorkflowNode[]} nodes
 * @property {WorkflowEdge[]} edges
 * @property {WorkflowConnection[]} connections
 */

/**
 * @typedef {object} WorkflowDependencyEdge
 * @property {string} id
 * @property {string} source
 * @property {string} target
 * @property {string=} callNodeId
 * @property {string=} connectionId
 * @property {boolean=} waitForCompletion
 * @property {WorkflowExecutionMode=} executionMode
 * @property {boolean} targetExists
 */

/**
 * @typedef {object} WorkflowDependencyGraph
 * @property {{id: string, name: string, executionMode: WorkflowExecutionMode, triggerType: WorkflowTriggerType}[]} nodes
 * @property {WorkflowDependencyEdge[]} edges
 */

/**
 * @typedef {object} WorkflowValidationIssue
 * @property {string} code
 * @property {'error'|'warning'} severity
 * @property {string} workflowId
 * @property {string} message
 * @property {string=} nodeId
 * @property {string=} edgeId
 * @property {string=} field
 */

export const WORKFLOW_TRIGGER_TYPES = Object.freeze([
  'MANUAL',
  'FORM_SUBMIT',
  'WEBHOOK',
  'EVENT',
  'SCHEDULE',
])

export const WORKFLOW_EXECUTION_MODES = Object.freeze(['SYNC', 'ASYNC'])
export const WORKFLOW_VARIABLE_TYPES = Object.freeze(['string', 'number', 'boolean', 'object', 'array'])
export const WORKFLOW_NODE_TYPES = Object.freeze([
  'START',
  'ACTION',
  'DECISION',
  'HTTP_REQUEST',
  'CALL_WORKFLOW',
  'PARALLEL',
  'DELAY',
  'END',
])
export const WORKFLOW_MAPPING_SOURCE_TYPES = Object.freeze([
  'STATIC',
  'WORKFLOW_INPUT',
  'NODE_OUTPUT',
  'CONTEXT',
])
export const WORKFLOW_FAILURE_BEHAVIORS = Object.freeze(['STOP', 'CONTINUE', 'GO_TO_NODE'])
export const WORKFLOW_DELAY_UNITS = Object.freeze(['SECONDS', 'MINUTES', 'HOURS', 'DAYS'])

export const WORKFLOW_TRIGGER_LABELS = Object.freeze({
  MANUAL: 'ידני',
  FORM_SUBMIT: 'שליחת טופס',
  WEBHOOK: 'Webhook',
  EVENT: 'אירוע',
  SCHEDULE: 'תזמון',
})

export const WORKFLOW_EXECUTION_MODE_LABELS = Object.freeze({ SYNC: 'סינכרוני', ASYNC: 'אסינכרוני' })
export const WORKFLOW_VARIABLE_TYPE_LABELS = Object.freeze({
  string: 'טקסט',
  number: 'מספר',
  boolean: 'כן / לא',
  object: 'אובייקט',
  array: 'מערך',
})
export const WORKFLOW_NODE_TYPE_LABELS = Object.freeze({
  START: 'התחלה',
  ACTION: 'פעולה',
  DECISION: 'החלטה',
  HTTP_REQUEST: 'בקשת HTTP',
  CALL_WORKFLOW: 'הפעל תהליך אחר',
  PARALLEL: 'פיצול מקבילי',
  DELAY: 'השהיה',
  END: 'סיום',
})
export const WORKFLOW_MAPPING_SOURCE_TYPE_LABELS = Object.freeze({
  STATIC: 'ערך קבוע',
  WORKFLOW_INPUT: 'קלט התהליך',
  NODE_OUTPUT: 'פלט של שלב',
  CONTEXT: 'הקשר מערכת',
})
export const WORKFLOW_FAILURE_BEHAVIOR_LABELS = Object.freeze({
  STOP: 'עצור',
  CONTINUE: 'המשך במסלול הרגיל',
  GO_TO_NODE: 'עבור לשלב אחר',
})
export const WORKFLOW_DELAY_UNIT_LABELS = Object.freeze({
  SECONDS: 'שניות',
  MINUTES: 'דקות',
  HOURS: 'שעות',
  DAYS: 'ימים',
})

const newId = () => globalThis.crypto.randomUUID()
const copy = (value) => (value === undefined ? undefined : structuredClone(value))
const cleanText = (value) => (typeof value === 'string' ? value : '')
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value ?? {}, key)

const branchDefaults = () => [
  { id: newId(), label: 'מסלול א׳', condition: '' },
  { id: newId(), label: 'מסלול ב׳', condition: '' },
]

/** @param {WorkflowNodeType} type */
const defaultNodeConfig = (type) => {
  switch (type) {
    case 'DECISION':
      return { branches: branchDefaults() }
    case 'PARALLEL':
      return { branches: branchDefaults().map(({ id, label }) => ({ id, label })) }
    case 'HTTP_REQUEST':
      return { technicalBlockId: '' }
    case 'CALL_WORKFLOW':
      return {
        targetWorkflowId: '',
        waitForCompletion: true,
        inputMappings: [],
        outputMappings: [],
        onSuccess: {},
        onFailure: { behavior: 'STOP' },
      }
    case 'DELAY':
      return { duration: 1, unit: 'MINUTES' }
    default:
      return {}
  }
}

/**
 * Create a variable with a stable ID.
 * @param {Partial<WorkflowVariable>} [overrides]
 * @returns {WorkflowVariable}
 */
export const createWorkflowVariable = (overrides = {}) => ({
  ...overrides,
  id: overrides.id || newId(),
  name: cleanText(overrides.name),
  type: WORKFLOW_VARIABLE_TYPES.includes(overrides.type) ? overrides.type : 'string',
  required: Boolean(overrides.required),
  description: cleanText(overrides.description),
})

/**
 * Create one workflow node with the minimum valid config for its type.
 * @param {string} workflowId
 * @param {WorkflowNodeType} type
 * @param {Partial<WorkflowNode>} [overrides]
 * @returns {WorkflowNode}
 */
export const createNode = (workflowId, type, overrides = {}) => {
  const safeType = WORKFLOW_NODE_TYPES.includes(type) ? type : 'ACTION'
  const defaults = defaultNodeConfig(safeType)
  const config = { ...defaults, ...(copy(overrides.config) ?? {}) }

  if (safeType === 'DECISION' || safeType === 'PARALLEL') {
    config.branches = (Array.isArray(config.branches) ? config.branches : branchDefaults()).map(
      (branch, index) => ({
        ...branch,
        id: branch?.id || newId(),
        label: cleanText(branch?.label) || `מסלול ${index + 1}`,
        ...(safeType === 'DECISION' && { condition: cleanText(branch?.condition) }),
      }),
    )
  }
  if (safeType === 'CALL_WORKFLOW') {
    config.targetWorkflowId = cleanText(config.targetWorkflowId)
    config.waitForCompletion = config.waitForCompletion !== false
    config.inputMappings = (Array.isArray(config.inputMappings) ? config.inputMappings : []).map((mapping) => ({
      targetInput: cleanText(mapping?.targetInput),
      sourceType: WORKFLOW_MAPPING_SOURCE_TYPES.includes(mapping?.sourceType) ? mapping.sourceType : 'STATIC',
      sourceValue: cleanText(mapping?.sourceValue),
    }))
    config.outputMappings = (Array.isArray(config.outputMappings) ? config.outputMappings : []).map((mapping) => ({
      sourceOutput: cleanText(mapping?.sourceOutput),
      targetVariable: cleanText(mapping?.targetVariable),
    }))
    config.onSuccess = config.onSuccess?.nextNodeId
      ? { nextNodeId: cleanText(config.onSuccess.nextNodeId) }
      : {}
    const failureBehavior = WORKFLOW_FAILURE_BEHAVIORS.includes(config.onFailure?.behavior)
      ? config.onFailure.behavior
      : 'STOP'
    config.onFailure = {
      behavior: failureBehavior,
      ...(failureBehavior === 'GO_TO_NODE' && config.onFailure?.targetNodeId && {
        targetNodeId: cleanText(config.onFailure.targetNodeId),
      }),
    }
  }
  if (safeType === 'HTTP_REQUEST') config.technicalBlockId = cleanText(config.technicalBlockId)
  if (safeType === 'DELAY') {
    config.duration = Number.isFinite(Number(config.duration)) ? Number(config.duration) : 1
    config.unit = WORKFLOW_DELAY_UNITS.includes(config.unit) ? config.unit : 'MINUTES'
  }

  return {
    ...overrides,
    id: overrides.id || newId(),
    workflowId,
    type: safeType,
    title: hasOwn(overrides, 'title') ? cleanText(overrides.title) : WORKFLOW_NODE_TYPE_LABELS[safeType],
    description: cleanText(overrides.description),
    position: {
      x: Number.isFinite(overrides.position?.x) ? overrides.position.x : 0,
      y: Number.isFinite(overrides.position?.y) ? overrides.position.y : 0,
    },
    config,
    ...(overrides.isDraft && { isDraft: true }),
  }
}

export const createWorkflowNode = createNode

/**
 * @param {string} source
 * @param {string} target
 * @param {Partial<WorkflowEdge>} [overrides]
 * @returns {WorkflowEdge}
 */
export const createEdge = (source, target, overrides = {}) => ({
  ...overrides,
  id: overrides.id || newId(),
  source,
  target,
  ...(overrides.sourceHandle && { sourceHandle: overrides.sourceHandle }),
  ...(hasOwn(overrides, 'label') && { label: cleanText(overrides.label) }),
  ...(hasOwn(overrides, 'condition') && { condition: cleanText(overrides.condition) }),
})

/** @param {string} targetWorkflowId @param {Partial<WorkflowConnection>} [overrides] */
export const createWorkflowConnection = (targetWorkflowId, overrides = {}) => ({
  ...overrides,
  id: overrides.id || newId(),
  targetWorkflowId: cleanText(targetWorkflowId),
})

/**
 * Create a workflow. When nodes/edges are not explicitly supplied, it starts
 * with a connected START and END pair.
 * @param {Partial<Workflow>} [overrides]
 * @returns {Workflow}
 */
export const createWorkflow = (overrides = {}) => {
  const id = overrides.id || newId()
  let nodes
  let edges

  if (Array.isArray(overrides.nodes)) {
    nodes = overrides.nodes.map((node) => createNode(id, node.type, node))
    edges = Array.isArray(overrides.edges)
      ? overrides.edges.map((edge) => createEdge(edge.source, edge.target, edge))
      : []
  } else {
    const start = createNode(id, 'START', { position: { x: 0, y: 0 } })
    const end = createNode(id, 'END', { position: { x: 0, y: 200 } })
    nodes = [start, end]
    edges = [createEdge(start.id, end.id)]
  }

  return {
    ...overrides,
    id,
    name: hasOwn(overrides, 'name') ? cleanText(overrides.name) : 'תהליך חדש',
    description: cleanText(overrides.description),
    triggerType: WORKFLOW_TRIGGER_TYPES.includes(overrides.triggerType) ? overrides.triggerType : 'MANUAL',
    triggerDescription: cleanText(overrides.triggerDescription),
    executionMode: WORKFLOW_EXECUTION_MODES.includes(overrides.executionMode)
      ? overrides.executionMode
      : 'SYNC',
    inputs: Array.isArray(overrides.inputs) ? overrides.inputs.map(createWorkflowVariable) : [],
    outputs: Array.isArray(overrides.outputs) ? overrides.outputs.map(createWorkflowVariable) : [],
    nodes,
    edges,
    connections: Array.isArray(overrides.connections)
      ? overrides.connections.map((connection) =>
          createWorkflowConnection(connection?.targetWorkflowId, connection),
        )
      : [],
  }
}

/**
 * Normalize persisted workflow data without changing already-valid IDs.
 * Calling this function repeatedly produces the same result.
 * @param {Partial<Workflow>} workflow
 * @returns {Workflow}
 */
export const normalizeWorkflow = (workflow = {}) => createWorkflow(workflow)

/**
 * @param {unknown} value An array, a `{workflows}` document, or legacy `{flow|steps}` data.
 * @param {{business?: object, workflowName?: string}=} options
 * @returns {Workflow[]}
 */
export const normalizeWorkflows = (value, options = {}) => {
  if (Array.isArray(value)) return value.map(normalizeWorkflow)
  if (Array.isArray(value?.workflows)) return value.workflows.map(normalizeWorkflow)
  if (Array.isArray(value?.flow) || Array.isArray(value?.steps)) {
    return [migrateLegacyFlow(value.flow ?? value.steps, { business: value.business ?? options.business, name: options.workflowName })]
  }
  return []
}

const describeLegacyStep = (step) => {
  if (typeof step === 'string') return step
  return cleanText(step?.text || step?.description || step?.action || step?.title)
}

const describeLegacyPath = (path) => {
  if (typeof path === 'string') return path
  if (Array.isArray(path?.actions)) return path.actions.map(describeLegacyStep).filter(Boolean).join('\n')
  return cleanText(path?.actions || path?.text || path?.description || path?.action)
}

const legacyTriggerDescription = (legacy, business, explicit) => {
  if (explicit) return explicit
  if (typeof legacy?.triggerDescription === 'string') return legacy.triggerDescription
  if (typeof legacy?.trigger === 'string') return legacy.trigger
  if (typeof business?.trigger === 'string') return business.trigger
  if (Array.isArray(business?.triggers)) {
    return business.triggers
      .map((trigger) => (typeof trigger === 'string' ? trigger : trigger?.text))
      .filter((text) => typeof text === 'string' && text.trim())
      .join('\n')
  }
  return ''
}

/**
 * Convert the former linear `flow`/`steps` list into one node graph. A branch
 * becomes a DECISION and one ACTION per path; the following node is their join.
 * @param {unknown[]} legacyItems
 * @param {{id?: string, name?: string, business?: object, triggerDescription?: string}=} options
 * @returns {Workflow}
 */
export const migrateLegacyFlow = (legacyItems = [], options = {}) => {
  const workflowId = options.id || newId()
  const items = Array.isArray(legacyItems) ? legacyItems : []
  const legacyIds = new Set(items.map((item) => item?.id).filter(Boolean))
  const usedIds = new Set()
  const claimId = (candidate) => {
    const wanted = typeof candidate === 'string' && candidate ? candidate : newId()
    if (!usedIds.has(wanted)) {
      usedIds.add(wanted)
      return wanted
    }
    let generated = newId()
    while (usedIds.has(generated)) generated = newId()
    usedIds.add(generated)
    return generated
  }
  const nodes = []
  const edges = []
  const start = createNode(workflowId, 'START', {
    id: claimId(legacyIds.has('start') ? undefined : 'start'),
    position: { x: 0, y: 0 },
  })
  nodes.push(start)
  let tails = [start.id]
  let y = 0
  let stepNumber = 0

  const connectTails = (target) => {
    for (const source of tails) edges.push(createEdge(source, target))
  }

  for (const item of items) {
    const kind = cleanText(item?.kind || item?.type).toLowerCase()
    const paths = Array.isArray(item?.paths) ? item.paths : Array.isArray(item?.branches) ? item.branches : []

    if (kind === 'branch' || paths.length) {
      y += 180
      const decisionId = claimId(item?.id)
      const branchDefinitions = (paths.length ? paths : [{}, {}]).map((path, index) => ({
        id: claimId(path?.id),
        label: cleanText(path?.name || path?.label || path?.condition) || `מסלול ${index + 1}`,
        condition: cleanText(path?.condition || path?.name),
      }))
      const decision = createNode(workflowId, 'DECISION', {
        id: decisionId,
        title: cleanText(item?.title) || 'הסתעפות',
        description: cleanText(item?.description),
        position: { x: 0, y },
        config: { branches: branchDefinitions },
      })
      nodes.push(decision)
      connectTails(decision.id)

      y += 180
      const nextTails = []
      branchDefinitions.forEach((branch, index) => {
        const path = paths[index] ?? {}
        const action = createNode(workflowId, 'ACTION', {
          id: claimId(path?.actionId),
          title: branch.label,
          description: describeLegacyPath(path),
          position: { x: (index - (branchDefinitions.length - 1) / 2) * 280, y },
        })
        nodes.push(action)
        edges.push(
          createEdge(decision.id, action.id, {
            sourceHandle: branch.id,
            label: branch.label,
            condition: branch.condition,
          }),
        )
        nextTails.push(action.id)
      })
      tails = nextTails
      continue
    }

    y += 180
    stepNumber += 1
    const action = createNode(workflowId, 'ACTION', {
      id: claimId(item?.id),
      title: cleanText(item?.title) || `שלב ${stepNumber}`,
      description: describeLegacyStep(item),
      position: { x: 0, y },
    })
    nodes.push(action)
    connectTails(action.id)
    tails = [action.id]
  }

  y += 180
  const end = createNode(workflowId, 'END', {
    id: claimId(legacyIds.has('end') ? undefined : 'end'),
    position: { x: 0, y },
  })
  nodes.push(end)
  connectTails(end.id)

  return createWorkflow({
    id: workflowId,
    name: options.name || 'תהליך ראשי',
    triggerType: 'MANUAL',
    triggerDescription: legacyTriggerDescription({ steps: legacyItems }, options.business, options.triggerDescription),
    executionMode: 'SYNC',
    nodes,
    edges,
  })
}

/**
 * Convert a complete v1 draft while preserving its non-workflow sections.
 * Existing v2 workflows are only normalized, making migration idempotent.
 * @param {object} draft
 * @returns {{schemaVersion: 2, admin: object, business: object, workflows: Workflow[], blocks: object[]}}
 */
export const migrateLegacyDraft = (draft = {}) => ({
  schemaVersion: 2,
  admin: draft.admin ?? {},
  business: draft.business ?? {},
  workflows: Array.isArray(draft.workflows)
    ? normalizeWorkflows(draft.workflows)
    : [migrateLegacyFlow(draft.flow ?? draft.steps ?? [], { business: draft.business })],
  blocks: Array.isArray(draft.blocks) ? draft.blocks : [],
})

const remapNodeReference = (value, nodeIds) => {
  if (typeof value !== 'string' || !value) return value
  const separator = value.indexOf('.')
  const nodeId = separator === -1 ? value : value.slice(0, separator)
  const mapped = nodeIds.get(nodeId)
  return mapped ? `${mapped}${separator === -1 ? '' : value.slice(separator)}` : value
}

/**
 * Deep-copy a workflow with new IDs for the workflow, variables, nodes, branch
 * handles and edges. References to nodes inside the copy are remapped.
 * @param {Workflow} workflow
 * @param {Partial<Workflow>} [overrides]
 * @returns {Workflow}
 */
export const duplicateWorkflowData = (workflow, overrides = {}) => {
  const original = normalizeWorkflow(workflow)
  const workflowId = overrides.id || newId()
  const nodeIds = new Map(original.nodes.map((node) => [node.id, newId()]))
  const branchIds = new Map()

  const nodes = original.nodes.map((node) => {
    const config = copy(node.config) ?? {}
    if ((node.type === 'DECISION' || node.type === 'PARALLEL') && Array.isArray(config.branches)) {
      config.branches = config.branches.map((branch) => {
        const id = newId()
        branchIds.set(branch.id, id)
        return { ...branch, id }
      })
    }
    if (node.type === 'CALL_WORKFLOW') {
      if (config.targetWorkflowId === original.id) config.targetWorkflowId = workflowId
      if (config.onSuccess?.nextNodeId) {
        config.onSuccess.nextNodeId = nodeIds.get(config.onSuccess.nextNodeId) ?? config.onSuccess.nextNodeId
      }
      if (config.onFailure?.targetNodeId) {
        config.onFailure.targetNodeId = nodeIds.get(config.onFailure.targetNodeId) ?? config.onFailure.targetNodeId
      }
      config.inputMappings = (config.inputMappings ?? []).map((mapping) =>
        mapping.sourceType === 'NODE_OUTPUT'
          ? { ...mapping, sourceValue: remapNodeReference(mapping.sourceValue, nodeIds) }
          : mapping,
      )
    }
    return createNode(workflowId, node.type, { ...node, id: nodeIds.get(node.id), config })
  })

  const edges = original.edges.map((edge) =>
    createEdge(nodeIds.get(edge.source) ?? edge.source, nodeIds.get(edge.target) ?? edge.target, {
      ...edge,
      id: newId(),
      ...(edge.sourceHandle && { sourceHandle: branchIds.get(edge.sourceHandle) ?? edge.sourceHandle }),
    }),
  )

  return createWorkflow({
    ...original,
    ...overrides,
    id: workflowId,
    name: hasOwn(overrides, 'name') ? cleanText(overrides.name) : `${original.name} — עותק`,
    inputs: original.inputs.map((variable) => ({ ...variable, id: newId() })),
    outputs: original.outputs.map((variable) => ({ ...variable, id: newId() })),
    connections: original.connections.map((connection) =>
      createWorkflowConnection(
        connection.targetWorkflowId === original.id ? workflowId : connection.targetWorkflowId,
      ),
    ),
    nodes,
    edges,
  })
}

/**
 * Build mapping rows for a newly selected target, preserving compatible rows
 * and automatically mapping equal variable names.
 * @param {Workflow} caller
 * @param {Workflow|null|undefined} target
 * @param {Partial<CallWorkflowNodeConfig>} [config]
 * @returns {CallWorkflowNodeConfig}
 */
export const reconcileCallWorkflowConfig = (caller, target, config = {}) => {
  const base = {
    ...defaultNodeConfig('CALL_WORKFLOW'),
    ...copy(config),
    onSuccess: { ...(config.onSuccess ?? {}) },
    onFailure: { behavior: 'STOP', ...(config.onFailure ?? {}) },
  }
  if (!target) {
    return { ...base, targetWorkflowId: '', inputMappings: [], outputMappings: [] }
  }

  const oldInputs = new Map((base.inputMappings ?? []).map((mapping) => [mapping.targetInput, mapping]))
  const oldOutputs = new Map((base.outputMappings ?? []).map((mapping) => [mapping.sourceOutput, mapping]))
  const callerInputs = new Set(caller.inputs.map((variable) => variable.name))
  const callerOutputs = new Set(caller.outputs.map((variable) => variable.name))

  return {
    ...base,
    targetWorkflowId: target.id,
    inputMappings: target.inputs.map((variable) =>
      oldInputs.get(variable.name) ?? {
        targetInput: variable.name,
        sourceType: callerInputs.has(variable.name) ? 'WORKFLOW_INPUT' : 'STATIC',
        sourceValue: callerInputs.has(variable.name) ? variable.name : '',
      },
    ),
    outputMappings: target.outputs.map((variable) =>
      oldOutputs.get(variable.name) ?? {
        sourceOutput: variable.name,
        targetVariable: callerOutputs.has(variable.name) ? variable.name : '',
      },
    ),
  }
}

/** @param {Workflow[]} workflows @returns {WorkflowDependencyGraph} */
export const buildWorkflowDependencyGraph = (workflows) => {
  const normalized = normalizeWorkflows(workflows)
  const workflowIds = new Set(normalized.map((workflow) => workflow.id))
  const edges = []

  for (const workflow of normalized) {
    for (const connection of workflow.connections) {
      if (!connection.targetWorkflowId) continue
      edges.push({
        id: `connection:${workflow.id}:${connection.id}`,
        source: workflow.id,
        target: connection.targetWorkflowId,
        connectionId: connection.id,
        targetExists: workflowIds.has(connection.targetWorkflowId),
      })
    }
    for (const node of workflow.nodes) {
      if (node.type !== 'CALL_WORKFLOW' || !node.config.targetWorkflowId) continue
      const waitForCompletion = node.config.waitForCompletion !== false
      edges.push({
        id: `dependency:${workflow.id}:${node.id}`,
        source: workflow.id,
        target: node.config.targetWorkflowId,
        callNodeId: node.id,
        waitForCompletion,
        executionMode: waitForCompletion ? 'SYNC' : 'ASYNC',
        targetExists: workflowIds.has(node.config.targetWorkflowId),
      })
    }
  }

  return {
    nodes: normalized.map(({ id, name, executionMode, triggerType }) => ({ id, name, executionMode, triggerType })),
    edges,
  }
}

const dependencyAdjacency = (workflows, excludedSource, excludedNodeId) => {
  const graph = buildWorkflowDependencyGraph(workflows)
  const adjacency = new Map(graph.nodes.map((node) => [node.id, new Set()]))
  for (const edge of graph.edges) {
    if (!edge.targetExists || (edge.source === excludedSource && edge.callNodeId === excludedNodeId)) continue
    adjacency.get(edge.source)?.add(edge.target)
  }
  return adjacency
}

const canReach = (adjacency, start, goal) => {
  const pending = [start]
  const seen = new Set()
  while (pending.length) {
    const current = pending.pop()
    if (current === goal) return true
    if (seen.has(current)) continue
    seen.add(current)
    for (const next of adjacency.get(current) ?? []) pending.push(next)
  }
  return false
}

/**
 * Check a proposed/replaced Call Workflow edge without mutating the graph.
 * @param {Workflow[]} workflows
 * @param {string} sourceWorkflowId
 * @param {string} targetWorkflowId
 * @param {string=} callNodeId Excludes the current call when changing its target.
 */
export const wouldCreateCycle = (workflows, sourceWorkflowId, targetWorkflowId, callNodeId) => {
  if (!sourceWorkflowId || !targetWorkflowId) return false
  if (sourceWorkflowId === targetWorkflowId) return true
  const adjacency = dependencyAdjacency(workflows, sourceWorkflowId, callNodeId)
  return canReach(adjacency, targetWorkflowId, sourceWorkflowId)
}

/**
 * Return strongly connected groups of workflow IDs. A one-item group is only
 * returned for a direct self-call.
 * @param {Workflow[]} workflows
 * @returns {string[][]}
 */
export const findCircularDependencies = (workflows) => {
  const adjacency = dependencyAdjacency(workflows)
  const indexById = new Map()
  const lowById = new Map()
  const stack = []
  const inStack = new Set()
  const components = []
  let index = 0

  const visit = (id) => {
    indexById.set(id, index)
    lowById.set(id, index)
    index += 1
    stack.push(id)
    inStack.add(id)

    for (const next of adjacency.get(id) ?? []) {
      if (!indexById.has(next)) {
        visit(next)
        lowById.set(id, Math.min(lowById.get(id), lowById.get(next)))
      } else if (inStack.has(next)) {
        lowById.set(id, Math.min(lowById.get(id), indexById.get(next)))
      }
    }

    if (lowById.get(id) !== indexById.get(id)) return
    const component = []
    let current
    do {
      current = stack.pop()
      inStack.delete(current)
      component.push(current)
    } while (current !== id)
    if (component.length > 1 || adjacency.get(id)?.has(id)) components.push(component)
  }

  for (const id of adjacency.keys()) if (!indexById.has(id)) visit(id)
  return components
}

const toBlockIdSet = (blockIds) => {
  if (blockIds == null) return null
  const values = blockIds instanceof Set ? [...blockIds] : Array.isArray(blockIds) ? blockIds : []
  return new Set(
    values
      .filter((value) => typeof value === 'string' || !value?.type || value.type === 'http')
      .map((value) => (typeof value === 'string' ? value : value?.id))
      .filter(Boolean),
  )
}

const referencedNodeId = (sourceValue) => cleanText(sourceValue).split(/[.:]/, 1)[0]

/**
 * Validate one workflow in the context of the complete specification.
 * @param {Workflow} workflow
 * @param {Workflow[]} [allWorkflows]
 * @param {Set<string>|string[]|{id: string}[]|null} [blockIds]
 * @returns {WorkflowValidationIssue[]}
 */
export const validateWorkflow = (workflow, allWorkflows = [workflow], blockIds = null) => {
  if (!workflow) return []
  const workflows = Array.isArray(allWorkflows) ? allWorkflows : [workflow]
  const current = workflows.find((item) => item.id === workflow.id) ?? workflow
  const workflowById = new Map(workflows.map((item) => [item.id, item]))
  const nodeById = new Map(current.nodes.map((node) => [node.id, node]))
  const validEdges = current.edges.filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target))
  const outgoing = new Map(current.nodes.map((node) => [node.id, []]))
  for (const edge of validEdges) outgoing.get(edge.source)?.push(edge)
  const issues = []
  const add = (code, message, details = {}) =>
    issues.push({ code, severity: 'error', workflowId: current.id, message, ...details })

  if (!cleanText(current.name).trim()) add('WORKFLOW_NAME_REQUIRED', 'יש להזין שם לתהליך.', { field: 'name' })
  if (!current.triggerType) add('WORKFLOW_TRIGGER_REQUIRED', 'יש לבחור טריגר לתהליך.', { field: 'triggerType' })
  for (const [direction, variables] of [
    ['inputs', current.inputs],
    ['outputs', current.outputs],
  ]) {
    const names = new Set()
    for (const variable of variables) {
      const name = cleanText(variable.name).trim()
      if (!name) {
        add('VARIABLE_NAME_REQUIRED', 'יש להזין שם לכל משתנה.', { field: direction })
      } else if (names.has(name)) {
        add('DUPLICATE_VARIABLE_NAME', `שם המשתנה "${name}" מופיע יותר מפעם אחת.`, {
          field: direction,
        })
      }
      if (name) names.add(name)
    }
  }

  const connectionTargets = new Set()
  for (const connection of current.connections) {
    const targetId = cleanText(connection.targetWorkflowId)
    if (!targetId || !workflowById.has(targetId)) {
      add('WORKFLOW_CONNECTION_TARGET_NOT_FOUND', 'קיים קשר לתהליך שאינו קיים.', {
        field: 'connections',
      })
    } else if (targetId === current.id) {
      add('SELF_WORKFLOW_CONNECTION', 'תהליך אינו יכול להתחבר לעצמו.', { field: 'connections' })
    } else if (connectionTargets.has(targetId)) {
      add('DUPLICATE_WORKFLOW_CONNECTION', 'קיים קשר כפול לאותו תהליך יעד.', {
        field: 'connections',
      })
    } else if (wouldCreateCycle(workflows, current.id, targetId)) {
      add('CIRCULAR_WORKFLOW_CONNECTION', 'הקשר יוצר תלות מעגלית בין תהליכים.', {
        field: 'connections',
      })
    }
    if (targetId) connectionTargets.add(targetId)
  }

  const starts = current.nodes.filter((node) => node.type === 'START')
  const ends = current.nodes.filter((node) => node.type === 'END')
  if (starts.length === 0) add('START_NODE_REQUIRED', 'יש להוסיף נקודת התחלה לתהליך.')
  if (starts.length > 1) add('MULTIPLE_START_NODES', 'לתהליך יכולה להיות נקודת התחלה אחת בלבד.')
  if (ends.length === 0) add('END_NODE_REQUIRED', 'יש להוסיף לפחות נקודת סיום אחת לתהליך.')

  for (const edge of current.edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      add('DANGLING_EDGE', 'קיים חיבור שמצביע לשלב שאינו קיים.', { edgeId: edge.id })
    }
  }

  for (const node of current.nodes) {
    const nodeEdges = outgoing.get(node.id) ?? []
    if (node.type === 'START' && validEdges.some((edge) => edge.target === node.id)) {
      add('START_HAS_INCOMING_EDGE', 'נקודת התחלה אינה יכולה לקבל חיבור נכנס.', { nodeId: node.id })
    }
    if (node.type === 'END' && nodeEdges.length) {
      add('END_HAS_OUTGOING_EDGE', 'נקודת סיום אינה יכולה להוציא חיבור.', { nodeId: node.id })
    }
    if (node.type !== 'END' && !nodeEdges.some((edge) => edge.sourceHandle !== 'failure')) {
      add('NODE_WITHOUT_SUCCESSOR', 'יש לחבר את השלב לשלב הבא.', { nodeId: node.id })
    }

    if (node.type === 'DECISION' || node.type === 'PARALLEL') {
      const branches = Array.isArray(node.config.branches) ? node.config.branches : []
      const codePrefix = node.type === 'DECISION' ? 'DECISION' : 'PARALLEL'
      if (branches.length < 2) {
        add(`${codePrefix}_BRANCHES_REQUIRED`, 'יש להגדיר לפחות שני מסלולים.', { nodeId: node.id })
      }
      for (const branch of branches) {
        if (!nodeEdges.some((edge) => edge.sourceHandle === branch.id)) {
          add(`${codePrefix}_BRANCH_UNCONNECTED`, `המסלול "${branch.label || 'ללא שם'}" אינו מחובר.`, {
            nodeId: node.id,
          })
        }
      }
    }
  }

  if (starts.length) {
    const reachable = new Set()
    const pending = [starts[0].id]
    while (pending.length) {
      const nodeId = pending.pop()
      if (reachable.has(nodeId)) continue
      reachable.add(nodeId)
      for (const edge of outgoing.get(nodeId) ?? []) pending.push(edge.target)
    }
    for (const node of current.nodes) {
      if (!reachable.has(node.id) && !node.isDraft) {
        add('DISCONNECTED_NODE', 'השלב אינו מחובר למסלול שמתחיל בנקודת ההתחלה.', { nodeId: node.id })
      }
    }
  }

  const availableBlockIds = toBlockIdSet(blockIds)
  for (const node of current.nodes) {
    if (node.type === 'HTTP_REQUEST') {
      const technicalBlockId = cleanText(node.config.technicalBlockId)
      if (!technicalBlockId) {
        add('HTTP_BLOCK_REQUIRED', 'יש לבחור בלוק HTTP עבור השלב.', { nodeId: node.id })
      } else if (availableBlockIds && !availableBlockIds.has(technicalBlockId)) {
        add('HTTP_BLOCK_NOT_FOUND', 'בלוק ה־HTTP שנבחר אינו קיים.', { nodeId: node.id })
      }
      continue
    }
    if (node.type !== 'CALL_WORKFLOW') continue

    const targetId = cleanText(node.config.targetWorkflowId)
    const target = workflowById.get(targetId)
    if (!targetId) {
      add('CALL_TARGET_REQUIRED', 'יש לבחור תהליך יעד.', { nodeId: node.id })
      continue
    }
    if (!target) {
      add('CALL_TARGET_NOT_FOUND', 'תהליך היעד שנבחר אינו קיים.', { nodeId: node.id })
      continue
    }
    if (targetId === current.id) {
      add('SELF_WORKFLOW_CALL', 'תהליך אינו יכול להפעיל את עצמו.', { nodeId: node.id })
    } else if (wouldCreateCycle(workflows, current.id, targetId, node.id)) {
      add('CIRCULAR_WORKFLOW_DEPENDENCY', 'הקריאה יוצרת תלות מעגלית בין תהליכים.', { nodeId: node.id })
    }

    const inputByName = new Map(target.inputs.map((variable) => [variable.name, variable]))
    const callerInputNames = new Set(current.inputs.map((variable) => variable.name))
    const inputMappings = Array.isArray(node.config.inputMappings) ? node.config.inputMappings : []
    const mappingByTarget = new Map(inputMappings.map((mapping) => [mapping.targetInput, mapping]))
    for (const variable of target.inputs) {
      const mapping = mappingByTarget.get(variable.name)
      if (variable.required && !cleanText(mapping?.sourceValue).trim()) {
        add('REQUIRED_INPUT_NOT_MAPPED', `הקלט החובה "${variable.name}" אינו ממופה.`, { nodeId: node.id })
      }
    }
    for (const mapping of inputMappings) {
      if (!inputByName.has(mapping.targetInput)) {
        add('INPUT_MAPPING_TARGET_NOT_FOUND', `הקלט "${mapping.targetInput}" אינו קיים בתהליך היעד.`, {
          nodeId: node.id,
        })
      }
      if (!cleanText(mapping.sourceValue).trim()) continue
      if (mapping.sourceType === 'WORKFLOW_INPUT' && !callerInputNames.has(mapping.sourceValue)) {
        add('WORKFLOW_INPUT_SOURCE_NOT_FOUND', `קלט המקור "${mapping.sourceValue}" אינו קיים בתהליך הנוכחי.`, {
          nodeId: node.id,
        })
      }
      if (mapping.sourceType === 'NODE_OUTPUT') {
        const sourceNodeId = referencedNodeId(mapping.sourceValue)
        if (!sourceNodeId || !nodeById.has(sourceNodeId)) {
          add('NODE_OUTPUT_SOURCE_NOT_FOUND', 'שלב המקור שהוגדר במיפוי אינו קיים.', { nodeId: node.id })
        }
      }
    }

    const targetOutputNames = new Set(target.outputs.map((variable) => variable.name))
    const callerOutputNames = new Set(current.outputs.map((variable) => variable.name))
    for (const mapping of Array.isArray(node.config.outputMappings) ? node.config.outputMappings : []) {
      if (!targetOutputNames.has(mapping.sourceOutput)) {
        add('OUTPUT_MAPPING_SOURCE_NOT_FOUND', `הפלט "${mapping.sourceOutput}" אינו קיים בתהליך היעד.`, {
          nodeId: node.id,
        })
      }
      if (mapping.targetVariable && !callerOutputNames.has(mapping.targetVariable)) {
        add('OUTPUT_MAPPING_TARGET_NOT_FOUND', `משתנה היעד "${mapping.targetVariable}" אינו קיים בתהליך הנוכחי.`, {
          nodeId: node.id,
        })
      }
    }

    const failure = node.config.onFailure ?? { behavior: 'STOP' }
    if (failure.behavior === 'GO_TO_NODE' && (!failure.targetNodeId || !nodeById.has(failure.targetNodeId))) {
      add('FAILURE_TARGET_NOT_FOUND', 'יש לבחור שלב קיים למסלול הכשל.', { nodeId: node.id })
    }
  }

  return issues
}

/**
 * @param {Workflow[]} workflows
 * @param {Set<string>|string[]|{id: string}[]|null} [blockIds]
 * @returns {WorkflowValidationIssue[]}
 */
export const validateAllWorkflows = (workflows, blockIds = null) => {
  const list = Array.isArray(workflows) ? workflows : []
  return list.flatMap((workflow) => validateWorkflow(workflow, list, blockIds))
}

/** @param {WorkflowValidationIssue[]} issues @param {string} workflowId */
export const getWorkflowStatus = (issues, workflowId) =>
  issues.some((issue) => issue.workflowId === workflowId && issue.severity === 'error') ? 'error' : 'complete'

// Internal helpers used by the reducer. They are exported to keep mutations
// testable and usable by non-React consumers without adding another state layer.
/**
 * @param {Workflow[]} workflows
 * @param {string} workflowId
 * @param {'inputs'|'outputs'} direction
 * @param {WorkflowVariable[]} variables
 * @returns {Workflow[]}
 */
export const replaceWorkflowVariables = (workflows, workflowId, direction, variables) => {
  const current = workflows.find((workflow) => workflow.id === workflowId)
  if (!current) return workflows
  const normalizedVariables = (Array.isArray(variables) ? variables : []).map(createWorkflowVariable)
  const oldById = new Map(current[direction].map((variable) => [variable.id, variable.name]))
  const renames = new Map()
  for (const variable of normalizedVariables) {
    const oldName = oldById.get(variable.id)
    if (oldName && oldName !== variable.name) renames.set(oldName, variable.name)
  }

  return workflows.map((workflow) => {
    let nodes = workflow.nodes
    if (renames.size) {
      nodes = nodes.map((node) => {
        if (node.type !== 'CALL_WORKFLOW') return node
        const config = copy(node.config)
        let changed = false

        if (direction === 'inputs' && workflow.id === workflowId) {
          config.inputMappings = (config.inputMappings ?? []).map((mapping) => {
            if (mapping.sourceType !== 'WORKFLOW_INPUT' || !renames.has(mapping.sourceValue)) return mapping
            changed = true
            return { ...mapping, sourceValue: renames.get(mapping.sourceValue) }
          })
        }
        if (direction === 'outputs' && workflow.id === workflowId) {
          config.outputMappings = (config.outputMappings ?? []).map((mapping) => {
            if (!renames.has(mapping.targetVariable)) return mapping
            changed = true
            return { ...mapping, targetVariable: renames.get(mapping.targetVariable) }
          })
        }
        if (config.targetWorkflowId === workflowId && direction === 'inputs') {
          config.inputMappings = (config.inputMappings ?? []).map((mapping) => {
            if (!renames.has(mapping.targetInput)) return mapping
            changed = true
            return { ...mapping, targetInput: renames.get(mapping.targetInput) }
          })
        }
        if (config.targetWorkflowId === workflowId && direction === 'outputs') {
          config.outputMappings = (config.outputMappings ?? []).map((mapping) => {
            if (!renames.has(mapping.sourceOutput)) return mapping
            changed = true
            return { ...mapping, sourceOutput: renames.get(mapping.sourceOutput) }
          })
        }
        return changed ? { ...node, config } : node
      })
    }

    return workflow.id === workflowId ? { ...workflow, [direction]: normalizedVariables, nodes } : { ...workflow, nodes }
  })
}
