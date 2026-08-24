import { useCallback, useMemo } from 'react'
import { makeBlock } from '../lib.js'
import { isBlockEmpty } from '../validation/rules.js'
import { NODE_META } from './constants.js'

const httpBlocksOf = (blocks) => blocks.filter((b) => b.type === 'http')

const defaultHttpTitle = () => NODE_META.HTTP_REQUEST.label

const isDefaultTitled = (block) => block.title?.trim() === defaultHttpTitle()

const isEmptyHttpBlock = (block) => isBlockEmpty({ ...block, title: '' })

const findReusableSlot = (workflows, blocks) =>
  httpBlocksOf(blocks).find(
    (block) =>
      isDefaultTitled(block) &&
      isEmptyHttpBlock(block) &&
      countBlockRefs(workflows, block.id) === 0,
  ) ?? null

const findNode = (workflows, workflowId, nodeId) => {
  const workflow = workflows.find((w) => w.id === workflowId)
  return workflow?.nodes.find((n) => n.id === nodeId) ?? null
}

const countBlockRefs = (workflows, blockId, excludeNodeId = null) => {
  let count = 0
  for (const workflow of workflows) {
    for (const node of workflow.nodes) {
      if (node.id === excludeNodeId) continue
      if (node.type === 'HTTP_REQUEST' && node.config?.blockId === blockId) count++
    }
  }
  return count
}

const stripOwnership = (block) => {
  const { autoLinkedNodeId: _autoLinkedNodeId, ...rest } = block
  return rest
}

/**
 * Cross-slice adapter: coordinates HTTP workflow nodes with technical HTTP blocks.
 * Decorates the workflow API for add/update/remove and exposes block-update sync.
 */
export function useWorkflowHttpBlocks(wf, blocks, setBlocks) {
  const clearOwnership = useCallback(
    (blockId, nodeId) => {
      if (!blockId) return
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId && b.autoLinkedNodeId === nodeId ? stripOwnership(b) : b,
        ),
      )
    },
    [setBlocks],
  )

  const linkNodeToBlock = useCallback(
    (workflowId, nodeId, blockId, { claimOwnership = true } = {}) => {
      if (claimOwnership) {
        setBlocks((prev) =>
          prev.map((b) => (b.id === blockId ? { ...b, autoLinkedNodeId: nodeId } : b)),
        )
      }
      wf.updateNode(workflowId, nodeId, {
        config: { blockId, notes: '' },
      })
    },
    [wf, setBlocks],
  )

  const createHttpBlockForNode = useCallback(
    (workflowId, nodeId) => {
      const node = findNode(wf.workflows, workflowId, nodeId)
      if (!node || node.type !== 'HTTP_REQUEST') return null

      const prevBlockId = node.config?.blockId
      const block = {
        ...makeBlock('http'),
        title: node.title?.trim() || NODE_META.HTTP_REQUEST.label,
        autoLinkedNodeId: nodeId,
      }

      setBlocks((prev) => {
        let next = [...prev, block]
        if (prevBlockId) {
          next = next.map((b) =>
            b.id === prevBlockId && b.autoLinkedNodeId === nodeId ? stripOwnership(b) : b,
          )
        }
        return next
      })

      wf.updateNode(workflowId, nodeId, {
        config: { ...node.config, blockId: block.id },
      })
      return block.id
    },
    [wf, setBlocks],
  )

  const addNode = useCallback(
    (workflowId, type, options) => {
      const nodeId = wf.addNode(workflowId, type, options)
      if (!nodeId || type !== 'HTTP_REQUEST') return nodeId

      const slot = findReusableSlot(wf.workflows, blocks)
      if (slot) {
        linkNodeToBlock(workflowId, nodeId, slot.id)
        return nodeId
      }

      const block = {
        ...makeBlock('http'),
        title: defaultHttpTitle(),
        autoLinkedNodeId: nodeId,
      }
      setBlocks((prev) => [...prev, block])
      linkNodeToBlock(workflowId, nodeId, block.id, { claimOwnership: false })
      return nodeId
    },
    [wf, blocks, setBlocks, linkNodeToBlock],
  )

  const updateNode = useCallback(
    (workflowId, nodeId, patch) => {
      const node = findNode(wf.workflows, workflowId, nodeId)

      if (node?.type === 'HTTP_REQUEST' && patch.config?.blockId !== undefined) {
        const prevBlockId = node.config?.blockId
        const nextBlockId = patch.config.blockId
        if (prevBlockId && prevBlockId !== nextBlockId) {
          clearOwnership(prevBlockId, nodeId)
        }
      }

      const result = wf.updateNode(workflowId, nodeId, patch)

      if (node?.type === 'HTTP_REQUEST' && patch.title !== undefined) {
        const blockId = patch.config?.blockId ?? node.config?.blockId
        if (blockId) {
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === blockId && b.autoLinkedNodeId === nodeId
                ? { ...b, title: patch.title }
                : b,
            ),
          )
        }
      }

      return result
    },
    [wf, clearOwnership, setBlocks],
  )

  const removeNode = useCallback(
    (workflowId, nodeId) => {
      const node = findNode(wf.workflows, workflowId, nodeId)
      const blockId = node?.type === 'HTTP_REQUEST' ? node.config?.blockId : null

      wf.removeNode(workflowId, nodeId)

      if (!blockId) return

      setBlocks((prev) => {
        const block = prev.find((b) => b.id === blockId)
        if (!block) return prev

        const refs = countBlockRefs(wf.workflows, blockId, nodeId)

        if (block.autoLinkedNodeId === nodeId) {
          if (refs === 0 && isBlockEmpty({ ...block, title: '' })) {
            return prev.filter((b) => b.id !== blockId)
          }
          if (refs > 0) {
            return prev.map((b) => (b.id === blockId ? stripOwnership(b) : b))
          }
        }
        return prev
      })
    },
    [wf, setBlocks],
  )

  const updateBlock = useCallback(
    (id, patch) => {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b
          const next = { ...b, ...patch }
          if (b.autoLinkedNodeId && 'title' in patch) {
            delete next.autoLinkedNodeId
          }
          return next
        }),
      )
    },
    [setBlocks],
  )

  const workflowApi = useMemo(
    () => ({
      ...wf,
      addNode,
      updateNode,
      removeNode,
      createHttpBlockForNode,
    }),
    [wf, addNode, updateNode, removeNode, createHttpBlockForNode],
  )

  return { workflowApi, updateBlock }
}
