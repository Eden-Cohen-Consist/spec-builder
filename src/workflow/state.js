import { createContext, createElement, useContext, useEffect, useMemo, useReducer } from 'react'
import {
  buildWorkflowDependencyGraph,
  createEdge,
  createNode,
  createWorkflow,
  createWorkflowConnection,
  duplicateWorkflowData,
  normalizeWorkflows,
  reconcileCallWorkflowConfig,
  replaceWorkflowVariables,
  validateAllWorkflows as validateEveryWorkflow,
  validateWorkflow as validateOneWorkflow,
} from './model.js'

/** @typedef {import('./model.js').Workflow} Workflow */

/**
 * @typedef {object} WorkflowEditorState
 * @property {Workflow[]} workflows
 * @property {string|null} activeWorkflowId
 * @property {string|null} selectedNodeId
 * @property {'editor'|'dependencies'} view
 */

export const WORKFLOW_ACTIONS = Object.freeze({
  REPLACE_WORKFLOWS: 'REPLACE_WORKFLOWS',
  ADD_WORKFLOW: 'ADD_WORKFLOW',
  UPDATE_WORKFLOW: 'UPDATE_WORKFLOW',
  ADD_WORKFLOW_CONNECTION: 'ADD_WORKFLOW_CONNECTION',
  REMOVE_WORKFLOW_CONNECTION: 'REMOVE_WORKFLOW_CONNECTION',
  DUPLICATE_WORKFLOW: 'DUPLICATE_WORKFLOW',
  REMOVE_WORKFLOW: 'REMOVE_WORKFLOW',
  REORDER_WORKFLOWS: 'REORDER_WORKFLOWS',
  SELECT_WORKFLOW: 'SELECT_WORKFLOW',
  SELECT_NODE: 'SELECT_NODE',
  SET_VIEW: 'SET_VIEW',
  ADD_NODE: 'ADD_NODE',
  UPDATE_NODE: 'UPDATE_NODE',
  REMOVE_NODE: 'REMOVE_NODE',
  CONNECT_NODES: 'CONNECT_NODES',
  REMOVE_EDGE: 'REMOVE_EDGE',
  UPDATE_VARIABLES: 'UPDATE_VARIABLES',
})

/**
 * @param {Workflow[]|undefined} initialWorkflows
 * @param {Partial<WorkflowEditorState>} [options]
 * @returns {WorkflowEditorState}
 */
export const createWorkflowState = (initialWorkflows, options = {}) => {
  const workflows = normalizeWorkflows(initialWorkflows === undefined ? [createWorkflow()] : initialWorkflows)
  const requestedActiveId = options.activeWorkflowId
  const activeWorkflowId = workflows.some((workflow) => workflow.id === requestedActiveId)
    ? requestedActiveId
    : workflows[0]?.id ?? null
  const selectedNodeId = workflows
    .find((workflow) => workflow.id === activeWorkflowId)
    ?.nodes.some((node) => node.id === options.selectedNodeId)
    ? options.selectedNodeId
    : null

  return {
    workflows,
    activeWorkflowId,
    selectedNodeId,
    view: options.view === 'dependencies' ? 'dependencies' : 'editor',
  }
}

const replaceStateWorkflows = (state, nextWorkflows, requestedActiveId) => {
  const workflows = normalizeWorkflows(nextWorkflows)
  const activeWorkflowId = workflows.some((workflow) => workflow.id === requestedActiveId)
    ? requestedActiveId
    : workflows.some((workflow) => workflow.id === state.activeWorkflowId)
      ? state.activeWorkflowId
      : workflows[0]?.id ?? null
  const selectedNodeId = workflows
    .find((workflow) => workflow.id === activeWorkflowId)
    ?.nodes.some((node) => node.id === state.selectedNodeId)
    ? state.selectedNodeId
    : null
  return { ...state, workflows, activeWorkflowId, selectedNodeId }
}

const updateWorkflowHeader = (workflows, workflowId, patch) => {
  let next = workflows
  if (Object.prototype.hasOwnProperty.call(patch, 'inputs')) {
    next = replaceWorkflowVariables(next, workflowId, 'inputs', patch.inputs)
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'outputs')) {
    next = replaceWorkflowVariables(next, workflowId, 'outputs', patch.outputs)
  }
  const safePatch = Object.fromEntries(
    Object.entries(patch).filter(([key]) => !['id', 'inputs', 'outputs'].includes(key)),
  )
  return next.map((workflow) => (workflow.id === workflowId ? { ...workflow, ...safePatch } : workflow))
}

const reorder = (items, fromIndex, toIndex) => {
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items
  }
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

const mergeNodeConfig = (oldConfig, patchConfig) => ({
  ...oldConfig,
  ...patchConfig,
  ...(Object.prototype.hasOwnProperty.call(patchConfig, 'onSuccess') && {
    onSuccess: { ...(oldConfig.onSuccess ?? {}), ...(patchConfig.onSuccess ?? {}) },
  }),
  ...(Object.prototype.hasOwnProperty.call(patchConfig, 'onFailure') && {
    onFailure: { ...(oldConfig.onFailure ?? {}), ...(patchConfig.onFailure ?? {}) },
  }),
})

const isFailureEdge = (edge) => edge.sourceHandle === 'failure'

const replaceRouteEdge = (edges, nodeId, route, targetNodeId) => {
  const matchesRoute = (edge) =>
    edge.source === nodeId && (route === 'failure' ? isFailureEdge(edge) : !isFailureEdge(edge))
  const current = edges.find(matchesRoute)
  const next = edges.filter((edge) => !matchesRoute(edge))
  if (!targetNodeId) return next
  return [
    ...next,
    current?.target === targetNodeId
      ? current
      : createEdge(nodeId, targetNodeId, { sourceHandle: route === 'failure' ? 'failure' : 'success' }),
  ]
}

const updateNodeInWorkflow = (workflow, nodeId, patch, allWorkflows) => {
  const oldNode = workflow.nodes.find((node) => node.id === nodeId)
  if (!oldNode) return workflow
  const patchConfig = patch.config ?? {}
  let config = mergeNodeConfig(oldNode.config, patchConfig)
  const targetChanged =
    oldNode.type === 'CALL_WORKFLOW' &&
    Object.prototype.hasOwnProperty.call(patchConfig, 'targetWorkflowId') &&
    patchConfig.targetWorkflowId !== oldNode.config.targetWorkflowId

  if (targetChanged) {
    const target = allWorkflows.find((item) => item.id === patchConfig.targetWorkflowId)
    config = target
      ? reconcileCallWorkflowConfig(workflow, target, config)
      : patchConfig.targetWorkflowId
        ? config
        : reconcileCallWorkflowConfig(workflow, null, config)
  }

  let edges = workflow.edges
  if (
    (oldNode.type === 'DECISION' || oldNode.type === 'PARALLEL') &&
    Array.isArray(patchConfig.branches)
  ) {
    const branchById = new Map(patchConfig.branches.map((branch) => [branch.id, branch]))
    edges = edges.map((edge) => {
      if (edge.source !== nodeId || !edge.sourceHandle || !branchById.has(edge.sourceHandle)) return edge
      const branch = branchById.get(edge.sourceHandle)
      return {
        ...edge,
        label: branch.label ?? '',
        ...(oldNode.type === 'DECISION' ? { condition: branch.condition ?? '' } : {}),
      }
    })
  }
  if (oldNode.type === 'CALL_WORKFLOW' && Object.prototype.hasOwnProperty.call(patchConfig, 'onSuccess')) {
    const targetNodeId = config.onSuccess?.nextNodeId
    edges = replaceRouteEdge(edges, nodeId, 'success', targetNodeId)
    config.onSuccess = targetNodeId ? { nextNodeId: targetNodeId } : {}
  }
  if (oldNode.type === 'CALL_WORKFLOW' && Object.prototype.hasOwnProperty.call(patchConfig, 'onFailure')) {
    const behavior = config.onFailure?.behavior ?? 'STOP'
    const targetNodeId = behavior === 'GO_TO_NODE' ? config.onFailure?.targetNodeId : undefined
    edges = replaceRouteEdge(edges, nodeId, 'failure', targetNodeId)
    config.onFailure = targetNodeId ? { behavior, targetNodeId } : { behavior }
  }

  const nextNode = {
    ...oldNode,
    ...patch,
    id: oldNode.id,
    workflowId: workflow.id,
    config,
  }
  return { ...workflow, nodes: workflow.nodes.map((node) => (node.id === nodeId ? nextNode : node)), edges }
}

const connectWorkflowNodes = (workflow, connection) => {
  const sourceNode = workflow.nodes.find((node) => node.id === connection.source)
  const targetNode = workflow.nodes.find((node) => node.id === connection.target)
  if (!sourceNode || !targetNode || sourceNode.type === 'END' || targetNode.type === 'START') return workflow

  let edge = createEdge(connection.source, connection.target, connection)
  if (
    edge.sourceHandle &&
    (sourceNode.type === 'DECISION' || sourceNode.type === 'PARALLEL')
  ) {
    const branch = sourceNode.config.branches?.find((item) => item.id === edge.sourceHandle)
    if (branch) {
      edge = {
        ...edge,
        label: branch.label ?? '',
        ...(sourceNode.type === 'DECISION' ? { condition: branch.condition ?? '' } : {}),
      }
    }
  }
  let edges = workflow.edges
  const route = isFailureEdge(edge) ? 'failure' : 'success'
  if (sourceNode.type === 'CALL_WORKFLOW') {
    edges = replaceRouteEdge(edges, sourceNode.id, route, targetNode.id)
  } else if (
    edge.sourceHandle &&
    (sourceNode.type === 'DECISION' || sourceNode.type === 'PARALLEL')
  ) {
    edges = [...edges.filter((item) => !(item.source === edge.source && item.sourceHandle === edge.sourceHandle)), edge]
  } else {
    const duplicate = edges.some(
      (item) =>
        item.source === edge.source &&
        item.target === edge.target &&
        (item.sourceHandle ?? '') === (edge.sourceHandle ?? ''),
    )
    if (!duplicate) edges = [...edges, edge]
  }

  let nodes = workflow.nodes
  if (sourceNode.type === 'CALL_WORKFLOW') {
    nodes = nodes.map((node) => {
      if (node.id !== sourceNode.id) return node
      return route === 'failure'
        ? {
            ...node,
            config: { ...node.config, onFailure: { behavior: 'GO_TO_NODE', targetNodeId: targetNode.id } },
          }
        : { ...node, config: { ...node.config, onSuccess: { nextNodeId: targetNode.id } } }
    })
  }
  return { ...workflow, nodes, edges }
}

const removeWorkflowEdge = (workflow, edgeId) => {
  const removed = workflow.edges.find((edge) => edge.id === edgeId)
  if (!removed) return workflow
  const edges = workflow.edges.filter((edge) => edge.id !== edgeId)
  const nodes = workflow.nodes.map((node) => {
    if (node.id !== removed.source || node.type !== 'CALL_WORKFLOW') return node
    return isFailureEdge(removed)
      ? { ...node, config: { ...node.config, onFailure: { behavior: 'STOP' } } }
      : { ...node, config: { ...node.config, onSuccess: {} } }
  })
  return { ...workflow, nodes, edges }
}

const removeWorkflowNode = (workflow, nodeId) => {
  if (!workflow.nodes.some((node) => node.id === nodeId)) return workflow
  const nodes = workflow.nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => {
      if (node.type !== 'CALL_WORKFLOW') return node
      let config = node.config
      if (config.onSuccess?.nextNodeId === nodeId) config = { ...config, onSuccess: {} }
      if (config.onFailure?.targetNodeId === nodeId) {
        config = { ...config, onFailure: { behavior: 'STOP' } }
      }
      return config === node.config ? node : { ...node, config }
    })
  return {
    ...workflow,
    nodes,
    edges: workflow.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
  }
}

/**
 * Pure reducer for workflow editor state.
 * @param {WorkflowEditorState} state
 * @param {{type: string, [key: string]: any}} action
 * @returns {WorkflowEditorState}
 */
export const workflowReducer = (state, action) => {
  switch (action.type) {
    case WORKFLOW_ACTIONS.REPLACE_WORKFLOWS:
      return replaceStateWorkflows(state, action.workflows, action.activeWorkflowId)
    case WORKFLOW_ACTIONS.ADD_WORKFLOW: {
      const workflow = action.workflow ? createWorkflow(action.workflow) : createWorkflow()
      return {
        ...state,
        workflows: [...state.workflows, workflow],
        activeWorkflowId: action.select === false ? state.activeWorkflowId : workflow.id,
        selectedNodeId: action.select === false ? state.selectedNodeId : null,
        view: action.select === false ? state.view : 'editor',
      }
    }
    case WORKFLOW_ACTIONS.UPDATE_WORKFLOW:
      return {
        ...state,
        workflows: updateWorkflowHeader(state.workflows, action.workflowId, action.patch ?? {}),
      }
    case WORKFLOW_ACTIONS.ADD_WORKFLOW_CONNECTION: {
      if (!action.sourceWorkflowId || !action.targetWorkflowId || action.sourceWorkflowId === action.targetWorkflowId) {
        return state
      }
      return {
        ...state,
        workflows: state.workflows.map((workflow) =>
          workflow.id === action.sourceWorkflowId &&
          !workflow.connections.some((connection) => connection.targetWorkflowId === action.targetWorkflowId)
            ? {
                ...workflow,
                connections: [
                  ...workflow.connections,
                  createWorkflowConnection(action.targetWorkflowId, action.connection),
                ],
              }
            : workflow,
        ),
      }
    }
    case WORKFLOW_ACTIONS.REMOVE_WORKFLOW_CONNECTION:
      return {
        ...state,
        workflows: state.workflows.map((workflow) =>
          workflow.id === action.sourceWorkflowId
            ? {
                ...workflow,
                connections: workflow.connections.filter(
                  (connection) => connection.id !== action.connectionId,
                ),
              }
            : workflow,
        ),
      }
    case WORKFLOW_ACTIONS.DUPLICATE_WORKFLOW: {
      const index = state.workflows.findIndex((workflow) => workflow.id === action.workflowId)
      if (index === -1) return state
      const duplicate = duplicateWorkflowData(state.workflows[index], action.overrides)
      const workflows = [...state.workflows]
      workflows.splice(index + 1, 0, duplicate)
      return { ...state, workflows, activeWorkflowId: duplicate.id, selectedNodeId: null, view: 'editor' }
    }
    case WORKFLOW_ACTIONS.REMOVE_WORKFLOW: {
      const index = state.workflows.findIndex((workflow) => workflow.id === action.workflowId)
      if (index === -1) return state
      const workflows = state.workflows.filter((workflow) => workflow.id !== action.workflowId)
      const activeRemoved = state.activeWorkflowId === action.workflowId
      const activeWorkflowId = activeRemoved
        ? workflows[Math.min(index, workflows.length - 1)]?.id ?? null
        : state.activeWorkflowId
      return { ...state, workflows, activeWorkflowId, selectedNodeId: activeRemoved ? null : state.selectedNodeId }
    }
    case WORKFLOW_ACTIONS.REORDER_WORKFLOWS:
      return {
        ...state,
        workflows: Array.isArray(action.orderedIds)
          ? action.orderedIds
              .map((id) => state.workflows.find((workflow) => workflow.id === id))
              .filter(Boolean)
              .concat(state.workflows.filter((workflow) => !action.orderedIds.includes(workflow.id)))
          : reorder(state.workflows, action.fromIndex, action.toIndex),
      }
    case WORKFLOW_ACTIONS.SELECT_WORKFLOW:
      if (!state.workflows.some((workflow) => workflow.id === action.workflowId)) return state
      return { ...state, activeWorkflowId: action.workflowId, selectedNodeId: null, view: 'editor' }
    case WORKFLOW_ACTIONS.SELECT_NODE: {
      const workflow = state.workflows.find((item) => item.id === (action.workflowId ?? state.activeWorkflowId))
      if (action.nodeId && !workflow?.nodes.some((node) => node.id === action.nodeId)) return state
      return {
        ...state,
        activeWorkflowId: workflow?.id ?? state.activeWorkflowId,
        selectedNodeId: action.nodeId ?? null,
        view: 'editor',
      }
    }
    case WORKFLOW_ACTIONS.SET_VIEW:
      return {
        ...state,
        view: action.view === 'dependencies' ? 'dependencies' : 'editor',
        selectedNodeId: action.view === 'dependencies' ? null : state.selectedNodeId,
      }
    case WORKFLOW_ACTIONS.ADD_NODE: {
      const workflowId = action.workflowId ?? state.activeWorkflowId
      const workflow = state.workflows.find((item) => item.id === workflowId)
      if (!workflow) return state
      const node = action.node
        ? createNode(workflowId, action.node.type, action.node)
        : createNode(workflowId, action.nodeType, action.options)
      return {
        ...state,
        workflows: state.workflows.map((item) =>
          item.id === workflowId ? { ...item, nodes: [...item.nodes, node] } : item,
        ),
        activeWorkflowId: workflowId,
        selectedNodeId: action.select === false ? state.selectedNodeId : node.id,
        view: 'editor',
      }
    }
    case WORKFLOW_ACTIONS.UPDATE_NODE: {
      const workflowId = action.workflowId ?? state.activeWorkflowId
      return {
        ...state,
        workflows: state.workflows.map((workflow) =>
          workflow.id === workflowId
            ? updateNodeInWorkflow(workflow, action.nodeId, action.patch ?? {}, state.workflows)
            : workflow,
        ),
      }
    }
    case WORKFLOW_ACTIONS.REMOVE_NODE: {
      const workflowId = action.workflowId ?? state.activeWorkflowId
      return {
        ...state,
        workflows: state.workflows.map((workflow) =>
          workflow.id === workflowId ? removeWorkflowNode(workflow, action.nodeId) : workflow,
        ),
        selectedNodeId: state.selectedNodeId === action.nodeId ? null : state.selectedNodeId,
      }
    }
    case WORKFLOW_ACTIONS.CONNECT_NODES: {
      const workflowId = action.workflowId ?? state.activeWorkflowId
      return {
        ...state,
        workflows: state.workflows.map((workflow) =>
          workflow.id === workflowId ? connectWorkflowNodes(workflow, action.connection) : workflow,
        ),
      }
    }
    case WORKFLOW_ACTIONS.REMOVE_EDGE: {
      const workflowId = action.workflowId ?? state.activeWorkflowId
      return {
        ...state,
        workflows: state.workflows.map((workflow) =>
          workflow.id === workflowId ? removeWorkflowEdge(workflow, action.edgeId) : workflow,
        ),
      }
    }
    case WORKFLOW_ACTIONS.UPDATE_VARIABLES:
      return {
        ...state,
        workflows: replaceWorkflowVariables(
          state.workflows,
          action.workflowId ?? state.activeWorkflowId,
          action.direction,
          action.variables,
        ),
      }
    default:
      return state
  }
}

const blockIdsFrom = (blocks) => {
  if (blocks == null || blocks instanceof Set) return blocks
  if (!Array.isArray(blocks)) return null
  return blocks
    .filter((block) => typeof block === 'string' || !block?.type || block.type === 'http')
    .map((block) => (typeof block === 'string' ? block : block?.id))
    .filter(Boolean)
}

/**
 * Reducer-backed workflow state. Both signatures are supported:
 * `useWorkflowState(workflows, technicalBlocks)` and
 * `useWorkflowState({ initialWorkflows, technicalBlocks, onChange })`.
 *
 * @param {Workflow[]|{initialWorkflows?: Workflow[], technicalBlocks?: ({id: string}|string)[], blockIds?: string[], onChange?: (workflows: Workflow[]) => void, activeWorkflowId?: string, selectedNodeId?: string, view?: 'editor'|'dependencies'}} [initialOrOptions]
 * @param {({id: string}|string)[]} [technicalBlocks]
 */
export function useWorkflowState(initialOrOptions, technicalBlocks) {
  const options = Array.isArray(initialOrOptions)
    ? { initialWorkflows: initialOrOptions, technicalBlocks }
    : (initialOrOptions ?? {})
  const [state, dispatch] = useReducer(
    workflowReducer,
    undefined,
    () => createWorkflowState(options.initialWorkflows, options),
  )
  const configuredBlocks = options.blockIds ?? options.technicalBlocks
  const validationBlockIds = useMemo(() => blockIdsFrom(configuredBlocks), [configuredBlocks])
  const onChange = options.onChange
  const issues = useMemo(
    () => validateEveryWorkflow(state.workflows, validationBlockIds),
    [state.workflows, validationBlockIds],
  )
  const dependencyGraph = useMemo(() => buildWorkflowDependencyGraph(state.workflows), [state.workflows])
  const activeWorkflow = state.workflows.find((workflow) => workflow.id === state.activeWorkflowId) ?? null

  useEffect(() => {
    onChange?.(state.workflows)
  }, [onChange, state.workflows])

  const resolveBlocks = (override) => blockIdsFrom(override) ?? validationBlockIds

  return {
    ...state,
    activeWorkflow,
    issues,
    dependencies: dependencyGraph.edges,
    dependencyGraph,
    dispatch,
    replaceWorkflows: (workflows, activeWorkflowId) =>
      dispatch({ type: WORKFLOW_ACTIONS.REPLACE_WORKFLOWS, workflows, activeWorkflowId }),
    resetWorkflows: (workflows = [createWorkflow()]) =>
      dispatch({ type: WORKFLOW_ACTIONS.REPLACE_WORKFLOWS, workflows, activeWorkflowId: workflows[0]?.id }),
    addWorkflow: (workflow, select = true) =>
      dispatch({ type: WORKFLOW_ACTIONS.ADD_WORKFLOW, workflow, select }),
    updateWorkflow: (workflowId, patch) =>
      dispatch({ type: WORKFLOW_ACTIONS.UPDATE_WORKFLOW, workflowId, patch }),
    addWorkflowConnection: (sourceWorkflowId, targetWorkflowId) =>
      dispatch({ type: WORKFLOW_ACTIONS.ADD_WORKFLOW_CONNECTION, sourceWorkflowId, targetWorkflowId }),
    removeWorkflowConnection: (sourceWorkflowId, connectionId) =>
      dispatch({ type: WORKFLOW_ACTIONS.REMOVE_WORKFLOW_CONNECTION, sourceWorkflowId, connectionId }),
    duplicateWorkflow: (workflowId, overrides) =>
      dispatch({ type: WORKFLOW_ACTIONS.DUPLICATE_WORKFLOW, workflowId, overrides }),
    removeWorkflow: (workflowId) => dispatch({ type: WORKFLOW_ACTIONS.REMOVE_WORKFLOW, workflowId }),
    reorderWorkflows: (fromIndex, toIndex) =>
      dispatch({ type: WORKFLOW_ACTIONS.REORDER_WORKFLOWS, fromIndex, toIndex }),
    setWorkflowOrder: (orderedIds) =>
      dispatch({ type: WORKFLOW_ACTIONS.REORDER_WORKFLOWS, orderedIds }),
    selectWorkflow: (workflowId) => dispatch({ type: WORKFLOW_ACTIONS.SELECT_WORKFLOW, workflowId }),
    selectNode: (nodeId, workflowId) =>
      dispatch({ type: WORKFLOW_ACTIONS.SELECT_NODE, nodeId, workflowId }),
    setView: (view) => dispatch({ type: WORKFLOW_ACTIONS.SET_VIEW, view }),
    addNode: (nodeType, options, workflowId) =>
      dispatch({ type: WORKFLOW_ACTIONS.ADD_NODE, nodeType, options, workflowId }),
    updateNode: (nodeId, patch, workflowId) =>
      dispatch({ type: WORKFLOW_ACTIONS.UPDATE_NODE, nodeId, patch, workflowId }),
    removeNode: (nodeId, workflowId) =>
      dispatch({ type: WORKFLOW_ACTIONS.REMOVE_NODE, nodeId, workflowId }),
    connectNodes: (connection, workflowId) =>
      dispatch({ type: WORKFLOW_ACTIONS.CONNECT_NODES, connection, workflowId }),
    removeEdge: (edgeId, workflowId) =>
      dispatch({ type: WORKFLOW_ACTIONS.REMOVE_EDGE, edgeId, workflowId }),
    updateWorkflowInputs: (workflowId, variables) =>
      dispatch({ type: WORKFLOW_ACTIONS.UPDATE_VARIABLES, workflowId, direction: 'inputs', variables }),
    updateWorkflowOutputs: (workflowId, variables) =>
      dispatch({ type: WORKFLOW_ACTIONS.UPDATE_VARIABLES, workflowId, direction: 'outputs', variables }),
    validateWorkflow: (workflowId = state.activeWorkflowId, blocksOverride) => {
      const workflow = state.workflows.find((item) => item.id === workflowId)
      return workflow ? validateOneWorkflow(workflow, state.workflows, resolveBlocks(blocksOverride)) : []
    },
    validateAllWorkflows: (blocksOverride) =>
      validateEveryWorkflow(state.workflows, resolveBlocks(blocksOverride)),
  }
}

const WorkflowContext = createContext(null)

/**
 * Local provider that avoids prop-drilling without introducing an external
 * state dependency.
 */
export function WorkflowProvider({ children, ...options }) {
  const value = useWorkflowState(options)
  return createElement(WorkflowContext.Provider, { value }, children)
}

export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext)
  if (!context) throw new Error('useWorkflowContext must be used inside WorkflowProvider')
  return context
}
