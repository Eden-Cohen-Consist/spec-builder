## Context

See `proposal.md` for motivation and `specs/workflow-http-block-linking/spec.md` for observable behavior.

Workflow state is owned by `useWorkflows`, while technical blocks are owned by `App`. Today, workflow UI calls the API from `WorkflowsContext` directly, and the HTTP side panel can only write `config.blockId`. The change therefore needs one coordination point between those existing state slices without moving either slice or duplicating their domain logic.

The optional draft metadata must survive the existing sanitize-on-load path but must not enter compiled JSON. Existing compilation already constructs output fields explicitly rather than spreading block objects.

## Goals / Non-Goals

**Goals:**

- Keep HTTP node/block lifecycle coordination in one small workflow-domain module.
- Reuse `makeBlock`, `useWorkflows`, and `isBlockEmpty` instead of introducing parallel factories or emptiness rules.
- Make automatic title ownership explicit and persistent rather than inferring user intent from equal strings.
- Preserve existing workflow and block APIs for unrelated node and block types.

**Non-Goals:**

- Moving block state into `useWorkflows` or workflow state into `App`.
- Adding a generalized cross-entity event system for one integration.
- Changing React Flow nodes, handles, layout, or exported JSON.
- Adding a dependency or test framework.

## Decisions

### Add one cross-slice adapter hook under `src/workflow/`

Add `useWorkflowHttpBlocks.js`, which receives the existing workflow API, `blocks`, and `setBlocks`. It returns:

- a decorated workflow API that overrides `addNode`, `updateNode`, and `removeNode`;
- `createHttpBlockForNode` on that API for the side panel;
- an `updateBlock` callback for technical-block editing.

`App` remains the composition root: it creates `wf`, `blocks`, and the adapter, then passes the decorated API to `WorkflowSection`. Existing workflow components continue using `WorkflowsContext`, so node creation from the palette, title edits, deletion, and side-panel actions all pass through one coordinator.

Alternative considered: add block callbacks through every workflow component. Rejected because it creates prop drilling and allows lifecycle rules to be split across the palette, node panel, and `App`.

Alternative considered: make `useWorkflows` own technical blocks. Rejected because technical blocks are document-level entities used outside workflows and this would blur the existing state boundaries.

### Persist explicit UI-only ownership on automatically created blocks

An automatically created HTTP block carries an optional `autoLinkedNodeId` containing the originating node id. While that marker exists and the block remains linked to that node, node-title edits update the block title.

Editing the block title directly clears the marker before applying the title patch. Linking the node to a different block also clears the marker on the former block without deleting it. Existing and older blocks have no marker and are never title-synchronized.

Alternative considered: synchronize whenever the old node and block titles happen to match. Rejected because equal text does not prove ownership and could overwrite a title after the PM intentionally edited it.

The marker is retained in local draft data and omitted automatically by the explicit compiled-output mapping. Existing drafts need no migration because absence of the optional marker means ordinary, manually managed behavior. The existing HTTP migration's object spread must continue preserving unknown fields.

### Auto-link via reusable default slots

The decorated `addNode` delegates graph creation and positioning to the existing `useWorkflows.addNode`.

- If the new type is not `HTTP_REQUEST`, behavior is unchanged.
- If it is `HTTP_REQUEST`, the adapter looks for a **reusable default slot**: an HTTP block whose title is the default **קריאת API**, is otherwise empty per `isBlockEmpty` with the title ignored, and is not linked from any workflow node.
- When a reusable slot exists, the adapter links the new node to that block and sets `autoLinkedNodeId` on the block so title synchronization applies.
- When no reusable slot exists, the adapter creates a `makeBlock('http')` object outside state updater functions, sets the default title and `autoLinkedNodeId`, appends it, and updates the node's `config.blockId`.

This keeps a zero-click flow for typical PM behavior: most new **קריאת API** nodes arrive already linked without opening the picker, while avoiding duplicate empty default blocks when an orphan slot already exists.

The side panel remains for manual override: choosing a different existing block or **יצירת בלוק חדש** when the PM wants an explicit new integration contract.

Creating objects outside React state updater functions preserves stable ids under Strict Mode double invocation.

### Reuse the existing empty-block rule for safe cleanup

On HTTP node deletion, the adapter finds the currently linked block before delegating to `useWorkflows.removeNode`. It removes that block only when:

1. `autoLinkedNodeId` identifies the deleted node;
2. no other node in any workflow references the block; and
3. `isBlockEmpty({ ...block, title: '' })` is true, treating the generated title as ownership metadata rather than PM-entered HTTP content.

If the block is shared or populated, it remains. If it is shared and its origin node is deleted, the adapter clears `autoLinkedNodeId` so no missing node retains title ownership.

Only node deletion performs cleanup. Switching or clearing a selection preserves the previous block, matching the reversible side-panel behavior.

### Extend the existing HTTP side panel

Keep the current select and labels. Add a Hebrew **יצירת בלוק חדש** action in the side panel that calls `createHttpBlockForNode`; the action creates and links one block using the current node title. When no blocks existed, the automatically linked block is shown as selected instead of the current instruction to navigate elsewhere.

The UI uses existing form/button primitives, RTL logical layout, and matching dark-mode styles. No modal is introduced.

### Leave React Flow and export paths untouched

The adapter delegates graph mutations to existing workflow mutators. `WorkflowCanvas` continues merging domain data into measured React Flow nodes; no wholesale RF-node replacement occurs. The palette remains portaled, and handle counts do not change.

`compileSpec` continues resolving `config.blockId` to a unique exported block name. Since neither output shape nor node/block type changes, `schemaVersion` and `ai-review.md` remain unchanged.

## Risks / Trade-offs

- **[Two state slices update in one user action]** → Create the block id before both updates and route all HTTP lifecycle actions through the adapter so the link and block use the same stable id.
- **[A block is removed despite valuable content]** → Require explicit automatic ownership, no references from any other workflow node, and the existing empty-block predicate with only the generated title ignored.
- **[Older draft sanitation drops the new marker]** → Verify the HTTP migration preserves unknown fields and add a reload browser check for synchronization behavior.
- **[Decorating the workflow API causes unnecessary renders]** → Memoize the decorated callbacks/API from their actual state dependencies; do not introduce a second context.
- **[An automatically generated block becomes orphaned after relinking]** → Preserve it intentionally because relinking is reversible and only explicit node deletion authorizes automatic cleanup.

## Migration Plan

No one-time migration is required. Existing blocks load without `autoLinkedNodeId` and retain current manual behavior. New drafts persist the optional marker through the existing autosave payload. Rollback ignores the unknown marker while preserving all node, block, and link data.
