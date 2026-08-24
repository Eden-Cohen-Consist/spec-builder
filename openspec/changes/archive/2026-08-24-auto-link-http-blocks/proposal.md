## Why

The Hebrew, non-developer PM currently has to create an HTTP step in the workflow, move to the technical-block step, create the matching HTTP Request block, then return to the workflow to link them. The three-step wizard makes this repeated navigation especially disruptive and leaves HTTP workflow steps easy to export without a linked integration contract.

## What Changes

- Creating an HTTP workflow node immediately links it to a technical HTTP Request block whenever a reusable default slot exists or a new one can be created.
- When no HTTP Request block exists, the system creates one automatically with the default title **קריאת API**.
- When an empty, unlinked HTTP Request block already exists with the default title **קריאת API**, the new node links to that block instead of creating a duplicate.
- When HTTP blocks exist but no reusable default slot is available, the system creates and links a new default-titled block automatically.
- The HTTP node side panel still lets the PM manually select a different existing block or explicitly create a new linked block.
- A newly created or auto-linked block title follows later node-title edits until the PM edits that block title directly.
- Deleting an HTTP node automatically removes its linked block only when that block is unused by every other node and still otherwise empty.
- The single export path remains unchanged: compiled JSON plus `ai-review.md` is copied to an external LLM, and linked workflow steps continue to reference technical blocks by exported name.

## Capabilities

### New Capabilities

- `workflow-http-block-linking`: Automatic slot reuse, creation, selection, title synchronization, and safe cleanup of technical HTTP Request blocks linked from workflow HTTP nodes.

### Modified Capabilities

None.

## Impact

- Workflow-node creation and deletion coordination in `src/App.jsx` and `src/workflow/`.
- HTTP node controls in `src/components/workflow/panels/HttpRequestNodePanel.jsx`.
- Technical-block creation, updates, and empty-state detection using the existing factories and validation rules.
- Automatically created blocks gain optional UI-only origin metadata so title synchronization and cleanup are explicit. Existing drafts remain valid, and compiled JSON remains unchanged; no schema-version bump, prompt update, backend, API, or new dependency is required.

## Non-goals

- Embedding the full HTTP Request editor in the workflow step.
- Automatically creating workflow nodes when a technical HTTP block is added.
- Deleting populated or shared HTTP blocks when a workflow node is removed or unlinked.
- Changing HTTP node types, technical block types, validation severity, or exported JSON structure.
