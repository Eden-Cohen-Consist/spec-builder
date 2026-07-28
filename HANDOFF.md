# Handoff — 2026-07-28

Branch: `bigEden-UIUX`. Two pieces of work: a React Flow rendering bug fix (committed) and a
refactor of `HttpBlock` (uncommitted).

## 1. Decision-node edge misalignment — fixed, committed as `67b5c10`

**Symptom:** on a DECISION node with 3+ routes, the connecting lines don't meet the handle dots
under the card. Reloading the page made it look correct again.

**Root cause:** React Flow does not read handle positions from the DOM when it draws edges. It
snapshots them into `node.internals.handleBounds` when it *measures* a node
(`getHandleBounds()`, `@xyflow/system` `index.js:884`) and `getEdgePosition()` reads that cached
snapshot (`index.js:1384`). Re-measuring is driven by the ResizeObserver — i.e. a size change — or
by an explicit `useUpdateNodeInternals()` call.

`WorkflowNodeCard` lays its decision handles out as `left: ${((i+1)/(count+1))*100}%`, and
`decisionSourceHandleCount` returns `routes + 1`. So each added route re-spaces every handle
(2 routes → 25/50/75%, 3 routes → 20/40/60/80%) while the card stays a fixed 240×63. No size
change → no re-measure → stale bounds. An edge on a newly-added handle id isn't in the snapshot
at all, so `getHandle$1` returns `null` (`index.js:1458`) and its position falls apart entirely.

**Fix:** `src/components/workflow/WorkflowNodeCard.jsx` now takes React Flow's `id` prop and calls
`useUpdateNodeInternals(id)` from an effect keyed on `sourceHandles`.

**Not visually verified.** `npm run lint` and `npm run build` pass and the mechanism is confirmed
against React Flow's source, but nobody watched it render. Worth 30 seconds: add a third route to
a decision node *without reloading* and check the lines meet the dots.

## 2. `HttpBlock` split into `src/components/http/` — uncommitted

519 → 135 lines. Four of the five components already existed inside the file and were moved
verbatim; only `SecurityFields` is a new extraction. Also removed an empty `<div className="">`
that wrapped `CurlImport`. No logic changed.

| file | lines |
|---|---|
| `src/components/HttpBlock.jsx` | 135 |
| `src/components/http/MappingTable.jsx` | 124 |
| `src/components/http/HeadersEditor.jsx` | 83 |
| `src/components/http/CurlImport.jsx` | 80 |
| `src/components/http/SecurityFields.jsx` | 75 |
| `src/components/http/PayloadEditor.jsx` | 26 |

Deliberately **not** done, and why:

- No generic `<EditableTable>` shared by `HeadersEditor` and `MappingTable`. Two callers is a
  wash; revisit if a third row-editing table appears.
- The dark code-textarea class string is duplicated in `CurlImport` and `PayloadEditor`. Hoist it
  if a third code editor shows up.

`npm run lint` and `npm run build` pass. Not exercised in a browser — the JSX is byte-identical to
what was there, so the build is the meaningful check, but a click through an HTTP block before
merging wouldn't hurt.

## Open items / environment notes

- **A dev server is already running on port 5173** (started outside Claude Code), which is why
  `preview_start` with the `spec-builder` launch config fails with "port in use". Open
  `http://localhost:5173` directly instead.
- **The React Flow canvas cannot be measured while the browser pane is hidden.** Nodes stay
  `visibility: hidden` and no edges render at all. A blank canvas in that situation is the pane,
  not a bug — display the pane and re-check before investigating.
- **Local draft is currently seeded with debug data.** To reproduce the bug, `localStorage`
  key `glassix-spec-builder:draft:v1` had its `workflows` array replaced with a single debug
  workflow (`דיבאג` — a decision node with 3 routes). The original is backed up under the
  `__dbg_backup` key in the same origin. This is browser-local only, nothing in the repo. Restore
  with:
  ```js
  localStorage.setItem('glassix-spec-builder:draft:v1', localStorage.getItem('__dbg_backup'))
  ```
- Pre-existing lint warning, untouched and unrelated: unused `Check` import in
  `src/components/workflow/WorkflowValidationSummary.jsx:2`.
