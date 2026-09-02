import { useCallback, useEffect } from 'react'
import {
  Background,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { ZoomIn, ZoomOut, Scan, Maximize2, Minimize2 } from 'lucide-react'
import WorkflowNodeCard from './WorkflowNodeCard.jsx'
import WorkflowNodePalette from './WorkflowNodePalette.jsx'
import WorkflowNodePanel from './WorkflowNodePanel.jsx'
import WorkflowEdgeLine from './WorkflowEdgeLine.jsx'
import { useWorkflowsApi } from '../../workflow/useWorkflows.js'
import { RF_NODE_TYPE, toRfEdges, toRfNodes } from '../../workflow/rfAdapter.js'

// Module scope: React Flow remounts every node if these change identity between renders
const nodeTypes = { [RF_NODE_TYPE]: WorkflowNodeCard }
const edgeTypes = { wf: WorkflowEdgeLine }
const defaultEdgeOptions = {
  type: 'wf',
  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
}
const fitViewOptions = { padding: 0.25, maxZoom: 1 }

function CanvasControls({ fullscreen, onToggleFullscreen }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const button =
    'rounded-lg border border-stone-200 bg-white p-1.5 text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-colors hover:border-teal-600/40 hover:text-teal-700 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-400 dark:shadow-none dark:hover:border-teal-500/50 dark:hover:text-teal-400'

  return (
    <div className="flex gap-1.5">
      <button type="button" aria-label="הגדל" title="הגדל" onClick={() => zoomIn()} className={button}>
        <ZoomIn className="size-3.5" />
      </button>
      <button type="button" aria-label="הקטן" title="הקטן" onClick={() => zoomOut()} className={button}>
        <ZoomOut className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="התאם למסך"
        title="התאם למסך"
        onClick={() => fitView(fitViewOptions)}
        className={button}
      >
        <Scan className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label={fullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
        title={fullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
        onClick={onToggleFullscreen}
        className={button}
      >
        {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
      </button>
    </div>
  )
}

function Canvas({ workflow, blocks, dark, fullscreen, onToggleFullscreen }) {
  const api = useWorkflowsApi()
  const { issuesByNode, selectedNode } = api

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([])

  // Merge rather than replace: React Flow stores measured dimensions on the node objects,
  // and handing it brand-new ones wipes them — unmeasured nodes stay hidden and their edges
  // never get drawn. During a drag `workflow` keeps its reference so this doesn't fire.
  useEffect(() => {
    setRfNodes((current) => {
      const previous = new Map(current.map((n) => [n.id, n]))
      return toRfNodes(workflow, issuesByNode, blocks).map((next) => {
        const prev = previous.get(next.id)
        return prev ? { ...prev, ...next } : next
      })
    })
  }, [workflow, issuesByNode, blocks, setRfNodes])

  const deleteEdge = useCallback(
    (edgeId) => api.removeEdge(workflow.id, edgeId),
    [api, workflow.id],
  )

  useEffect(() => {
    setRfEdges(toRfEdges(workflow, deleteEdge))
  }, [workflow, deleteEdge, setRfEdges])

  const onNodeDragStop = useCallback(
    (_event, _node, draggedNodes) => {
      const positions = Object.fromEntries(draggedNodes.map((n) => [n.id, n.position]))
      api.moveNodes(workflow.id, positions)
    },
    [api, workflow.id],
  )

  const onConnect = useCallback(
    (connection) => api.connectNodes(workflow.id, connection),
    [api, workflow.id],
  )

  const isValidConnection = useCallback(
    (connection) => {
      if (connection.source === connection.target) return false
      const source = workflow.nodes.find((n) => n.id === connection.source)
      const target = workflow.nodes.find((n) => n.id === connection.target)
      if (!source || !target) return false
      if (source.type === 'END' || target.type === 'START') return false
      const handle = connection.sourceHandle ?? null
      // One route per handle keeps DECISION branches unambiguous
      return !workflow.edges.some((e) => e.source === connection.source && (e.sourceHandle ?? null) === handle)
    },
    [workflow],
  )

  const onEdgesDelete = useCallback(
    (deleted) => {
      for (const edge of deleted) api.removeEdge(workflow.id, edge.id)
    },
    [api, workflow.id],
  )

  return (
    <>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onEdgesDelete={onEdgesDelete}
        onNodeClick={(_e, rfNode) => api.selectNode(rfNode.id)}
        onPaneClick={() => api.selectNode(null)}
        colorMode={dark ? 'dark' : 'light'}
        fitView
        fitViewOptions={fitViewOptions}
        minZoom={0.3}
        maxZoom={1.5}
        // In the form the wheel scrolls the page; in fullscreen it controls the canvas
        zoomOnScroll={fullscreen}
        panOnScroll={false}
        preventScrolling={fullscreen}
        selectionOnDrag={false}
        multiSelectionKeyCode={null}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: false }}
      >
        <Background variant="dots" gap={20} size={1} />
        <Panel position="top-right">
          <WorkflowNodePalette onAdd={(type) => api.addNode(workflow.id, type)} />
        </Panel>
        <Panel position="bottom-left">
          <CanvasControls fullscreen={fullscreen} onToggleFullscreen={onToggleFullscreen} />
        </Panel>
      </ReactFlow>

      {selectedNode && (
        <WorkflowNodePanel
          workflow={workflow}
          node={selectedNode}
          blocks={blocks}
          onClose={() => api.selectNode(null)}
        />
      )}
    </>
  )
}

export default function WorkflowCanvas({ workflow, blocks, dark, fullscreen, onToggleFullscreen }) {
  return (
    <div
      className={`wf-canvas relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50/60 dark:border-stone-700/70 dark:bg-stone-950/40 ${
        fullscreen ? 'h-full' : 'h-[520px]'
      }`}
    >
      {/* Keyed on the workflow so switching tabs remounts the canvas and re-runs fitView */}
      <ReactFlowProvider key={workflow.id}>
        <Canvas
          workflow={workflow}
          blocks={blocks}
          dark={dark}
          fullscreen={fullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      </ReactFlowProvider>
    </div>
  )
}
