# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start the Vite dev server
npm run build      # production build (vite build)
npm run lint       # oxlint — the only linter configured, see .oxlintrc.json
npm run preview    # preview a production build
```

There is no test runner, no test script, and no TypeScript in this project (despite `@types/react` being present as a devDependency — it exists only so editors can type-check the plain `.jsx` files, there is no `tsconfig.json`). Do not introduce TS or a test framework unless explicitly asked; verify changes by running `npm run lint`, `npm run build`, and exercising the app in a browser.

## Language and stack

Plain JavaScript React (`.jsx`), Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite`, config lives entirely in `src/index.css` under `@theme` — there is no `tailwind.config.js`), `@xyflow/react` (React Flow) for the workflow canvas, `lucide-react` for icons, `marked` for Markdown rendering. Types are expressed as JSDoc `@typedef` blocks next to their factory functions (see `src/workflow/model.js`), not as a separate types file.

## What this app is

A single-page Hebrew/RTL tool ("בונה אפיונים") that lets a PM (non-developer) assemble a technical integration spec for backend developers. The app has no backend — it's a client-only form builder that ends in one action: compile the form state into a JSON object, wrap it with a fixed AI-reviewer prompt, and hand that text to an external LLM chat to produce the final Markdown spec. There is no server, no API calls, no database — everything lives in the browser and one `localStorage` key.

## Architecture

### Three fixed sections + dynamic blocks

`src/App.jsx` is the root and owns most top-level state directly with `useState` (no Redux/Zustand/reducer — see "State management" below for the one exception). The page is: `AdminSection` → `BusinessSection` → `WorkflowSection` (all three are "locked", numbered, non-removable sections built on the shared `LockedSection` shell) followed by a free-form list of **technical blocks** (`http`, `freeText`, `testData`, `table` — see `src/constants.js` `BLOCK_META` and `src/lib.js` `makeBlock`) that the PM adds/removes via `AddBlockPopover`, each rendered inside the shared `DynamicBlock` shell. Most block editors are a single file under `src/components/`; `HttpBlock` is the one big enough to be split further, so its sub-editors (`CurlImport`, `PayloadEditor`, `HeadersEditor`, `MappingTable`, `SecurityFields`) live in `src/components/http/` and are used only by it.

### Workflows: node-graph model, not a linear list

`src/workflow/` holds the data model, migration, validation, and state hook for **workflows** — the app supports multiple independent workflows, each built as a node/edge graph (via React Flow) rather than a linear step list:

- `model.js` — JSDoc typedefs (`Workflow`, `WorkflowNode`, `WorkflowEdge`) and factory functions (`makeWorkflow`, `makeWorkflowNode`, `makeWorkflowEdge`). `makeWorkflow()` auto-seeds a `START`→`END` pair when no nodes are given. Current node types: `START`, `ACTION`, `DECISION`, `HTTP_REQUEST`, `END` (defined in `src/workflow/constants.js` `NODE_META`/`WORKFLOW_NODE_TYPES` — this is the single source of truth for what node types exist; keep the palette (`WorkflowNodePalette.jsx`'s `ADDABLE` list), `NODE_META`, and any switch statements over `node.type` in sync when adding/removing a type).
- `useWorkflows.js` — the one hook that owns all workflow state (`workflows`, `activeWorkflowId`, `selectedNodeId`) and every mutator (`addWorkflow`, `addNode`, `connectNodes`, etc.). It's created once in `App.jsx` and handed down through a `WorkflowsContext` (see `WorkflowSection.jsx`) so the deep component tree under `src/components/workflow/` doesn't need prop drilling — call `useWorkflowsApi()` from any workflow component instead of threading props. Node/edge mutators return `{ ok: true }` or `{ ok: false, error }` instead of throwing, so panels can show inline errors.
- `validation.js` — `validateAllWorkflows(workflows)` runs per-workflow structural checks (missing name/trigger, no START/END, dead ends, orphan nodes unless `config.draft === true`, DECISION needs ≥2 labeled routes, HTTP_REQUEST should reference a block) and returns an `issues[]` list consumed by `WorkflowValidationSummary`, node cards (error/warning rings), and the export gate in `App.jsx`'s `generate()`.
- `migrate.js` — `migrateWorkflows(draft)` is the single entry point called at load time. It never mutates in place: `sanitizeWorkflows()` repairs a stored `workflows` array (missing ids, dangling edges, unknown types are *kept* and flagged as validation errors rather than silently dropped or coerced — corrupt data should surface to the PM, not disappear); `workflowFromLegacyFlow()` converts the pre-graph linear `flow` format (steps + branches) into one node/edge workflow, reusing original ids so nothing loses its identity across the migration.
- `rfAdapter.js` — pure translation between the app's `Workflow`/`WorkflowNode` model and React Flow's `nodes`/`edges` shape (`toRfNodes`, `toRfEdges`). Keep model logic out of this file; it only reshapes data for the canvas.

### Workflow UI (`src/components/workflow/`)

`WorkflowSection` is the top-level shell (renders the `WorkflowsContext.Provider`, the tab bar, the active workflow's canvas, fullscreen toggle, delete confirmation). `WorkflowCanvas` wraps `@xyflow/react`'s `ReactFlow` — note it **merges** incoming node data into the existing React Flow node objects rather than replacing them (`setRfNodes((current) => ...)` in `WorkflowCanvas.jsx`), because replacing wholesale wipes React Flow's internally-measured node dimensions and breaks edge rendering. `WorkflowNodeCard` calls `useUpdateNodeInternals()` from an effect keyed on its handle count for the same class of reason: React Flow snapshots handle positions into `node.internals.handleBounds` when it *measures* a node and re-measures only on a size change, but adding a DECISION route adds a bottom handle and shifts every existing one's `left` % without resizing the fixed-width card — drop that call and the cached bounds go stale, so edges keep leaving from the old positions (visible as lines that miss the handles once a decision has 3+ routes). Any future node type with a dynamic handle count needs the same treatment. `WorkflowNodePalette` renders its dropdown through a `createPortal` to `document.body` (not inline), because the canvas container has `overflow-hidden` and would clip an inline dropdown. Per-node-type editing panels live in `src/components/workflow/panels/` and are switched on `node.type` inside `WorkflowNodePanel.jsx` — when adding a new node type that needs custom fields, add a panel there and wire it into that switch.

### Spec compilation and export

`src/lib.js`'s `compileSpec({ admin, business, workflows, blocks })` is the single place that turns UI state into the exported JSON (`meta`, `administrative`, `businessNeed`, `workflows`, `technicalBlocks`). It deliberately drops UI-only fields (canvas `position`, dangling edges) and — because the consumer is an LLM, not code — **exports no ids at all**: every uuid is replaced by the PM's own wording, made unique via `uniqueRef` (` (2)` suffix on collisions). Each workflow becomes a `steps` array produced by `compileWorkflowNodes`: the graph flattened into breadth-first reading order from `START`, where each step carries its outgoing routes inline (`next: [{ to, when, condition }]`, `to` being the target step's name) instead of a separate `edges` array, and nodes not reachable from `START` are appended with `unreachableFromStart: true` rather than dropped. Cross-references work the same way: an `HTTP_REQUEST` node's `config.blockId` is exported as `integrationBlock`, the `name` of the matching entry in `technicalBlocks` (`null` when nothing is linked), so the two sections join without duplicating the request contract. `buildAiExportText()` concatenates this JSON with the fixed prompt in `src/prompts/ai-review.md` (imported via Vite's `?raw` suffix) — that file is the contract for what the external LLM is instructed to produce; if the `workflows` JSON shape changes, update the corresponding instructions in `ai-review.md` §3/§4 to match (they describe the `steps`/`next`/`integrationBlock` shape above and the fact that names are the only references).

### Persistence and migrations

Everything autosaves (600ms debounce, see `App.jsx`) to a single `localStorage` key, `glassix-spec-builder:draft:v1`, as `{ admin, business, workflows, blocks, flow? }`. `App.jsx` also carries forward several ad-hoc migrations for older draft shapes (`migrateAdmin`, `migrateBusiness`, `migrateBlocks`) — free-text contacts → contact rows, a single trigger string → a triggers list, standalone `security` blocks folded into their nearest `http` block. The legacy `flow` key (pre-workflow-graph linear format) is round-tripped verbatim in the saved draft even after migration to the graph model, so a rollback never loses data. Follow this pattern (sanitize on load, never destructively drop unrecognized data, keep old keys around when cheap) for any future draft-shape change.

## Design constraints

RTL Hebrew UI (`dir="rtl"` throughout, includes handling `sourceHandle`/positions carefully in the workflow canvas since React Flow itself is LTR-internal). Dark mode via a `.dark` class toggled on `<html>` (see `toggleTheme` in `App.jsx`) with a matching Tailwind `@custom-variant dark`; workflow-canvas-specific dark tokens are scoped under `.wf-canvas .react-flow` in `src/index.css` rather than touching React Flow's base styles globally. No component library beyond the small shared primitives in `src/components/ui.jsx` (`Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `GhostButton`, `DeleteButton`) — reuse these instead of hand-rolling form controls.
