## 1. HTTP node/block coordination

- [x] 1.1 Add `src/workflow/useWorkflowHttpBlocks.js` as the single cross-slice adapter around the existing workflow API and block state; implement stable-id block creation, explicit `autoLinkedNodeId` ownership, title synchronization, and ownership clearing, then verify `npm run lint` and `npm run build` pass.
- [x] 1.2 Add safe HTTP-node deletion cleanup in the adapter by reusing `isBlockEmpty` with the generated title ignored and checking references across every workflow; verify in a real browser that deleting an owned empty block removes it, while populated and shared blocks remain.
- [x] 1.3 Confirm the existing draft load path preserves optional `autoLinkedNodeId` metadata and old blocks without metadata; make only the minimum sanitize-on-load adjustment if required, then verify in a real browser that an automatically linked draft reloads with title sync intact and an older draft still loads without data loss.
- [x] 1.4 Implement default-slot auto-linking in `addNode`: reuse an empty unlinked HTTP block titled **קריאת API** when one exists, otherwise create and link a new default-titled block; verify `npm run lint` and `npm run build` pass.

## 2. Application and side-panel integration

- [x] 2.1 Compose the adapter in `App.jsx`, pass its decorated API to `WorkflowSection`, and use its block-update callback for technical block edits; verify in a real visible browser canvas that adding the first **קריאת API** node creates and links exactly one titled HTTP block without navigating away from step 2.
- [x] 2.2 Extend `HttpRequestNodePanel.jsx` with a Hebrew **יצירת בלוק חדש** action using existing UI primitives and RTL/dark-mode styles; verify in a real browser that the side panel supports manual block selection and explicit new-block creation.
- [x] 2.3 Verify in a real browser that renaming an automatically linked node updates its block title, manually editing the block title stops later synchronization, changing or clearing the selected block does not delete the previous block, and all behavior works in both normal and fullscreen workflow canvases.
- [x] 2.4 Verify in a real browser that adding a second **קריאת API** node auto-links when a reusable default slot exists and creates a new default block when none exists.

## 3. Compatibility and final verification

- [x] 3.1 Export a document containing an automatically linked HTTP node and verify the compiled JSON contains one technical block, resolves `integrationBlock` by exported name, and contains neither ids nor `autoLinkedNodeId`; confirm no `schemaVersion` or `ai-review.md` change is needed.
- [x] 3.2 Run `npm run lint` and `npm run build`, then complete a final real-browser pass in light and dark modes covering first-block creation, slot reuse, new-block creation when no slot exists, title ownership, reload, and safe deletion.
