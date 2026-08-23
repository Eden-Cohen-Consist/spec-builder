# Required-field markers and pre-generate validation

**Date:** 2026-07-29
**Status:** Approved design, ready for planning

## Problem

Two gaps, both around the moment a PM presses **צור פרומפט לאפיון**.

1. **Nothing marks a field as required before you press.** `Field` in `src/components/ui.jsx` exposes only `label` and `hint`. `LockedSection` shows a `חובה` badge over an entire section, and `AdminSection` hand-renders one red `*` on the contacts "שם מלא" column — that is the whole vocabulary. A PM filling an HTTP block has no way to know which of its ~15 fields the developer actually needs.

2. **Validation is ad-hoc and reports one problem at a time.** `generate()` in `src/App.jsx` runs three checks in sequence — admin contacts, third-party HTTP payloads, workflow errors — and each one bails with a toast and a scroll. A draft with problems in all three areas surfaces them across three separate button presses. The checks are also thin: an entirely empty contacts list passes, as does an HTTP block with no endpoint, a table with no name, and a test-data block with no rows.

Meanwhile `src/workflow/validation.js` already does this properly for the graph — a flat `Issue[]` with `error`/`warning` severity, rendered as node rings and a collapsible `WorkflowValidationSummary`. The form half of the app has no equivalent.

## Goals

- Mark required fields visibly, at rest, before any validation has run.
- Replace the three sequential checks with a single pass that reports everything at once.
- Distinguish blocking problems (חובה) from advice (מומלץ), and let the PM export over advice.
- Reuse the issue shape and conventions that `src/workflow/` established, so the two halves render through one code path.

## Non-goals

- No new dependencies, no TypeScript, no test framework (per `CLAUDE.md`).
- No change to `compileSpec` output or to `src/prompts/ai-review.md`. This work gates *when* the spec is produced, never *what* it contains.
- No change to the workflow graph's own rules — `validateWorkflow` keeps its current logic.

## Decisions

| Decision | Choice |
|---|---|
| Strictness | Two tiers. `error` (חובה) blocks generation; `warning` (מומלץ) does not. Mirrors the existing workflow severities. |
| Required marker | Red `*` after the label. Rejected: a `חובה` pill per field (too heavy at ~20 required fields), and marking only the optional fields (relies on silence meaning "required"). |
| Generate behaviour | A checkpoint modal, opened only when there is something to report. A clean form goes straight to `ExportModal`. |
| Footer button | Stays teal but desaturated once errors exist, and stays **enabled** — it is the only way to open the modal. |
| Untouched blocks | Neutral. A block with no content at all produces no errors, only a single `EMPTY_BLOCK` warning. |
| When red appears | Silent until the first generate press. Asterisks show from the start; chips, rings and inline messages appear only after the first press, then update live. |
| Where the logic lives | An imperative validator mirroring `workflow/validation.js`. Rejected: a declarative field schema (the rules that matter are collection- and condition-shaped, and templated Hebrew reads worse), and extending `compileSpec` (couples a pure function to UI, and only runs at generate time so it cannot feed live chips). |

## Architecture

### `src/validation/` — one issue list for the whole form

Three new files, laid out to match `src/workflow/`.

**`issue.js`** — the `Issue` typedef and its factory. One shape covers every source:

```js
/**
 * @typedef {Object} Issue
 * @property {string} id
 * @property {'admin'|'business'|'block'|'workflow'} scope
 * @property {string} code
 * @property {string} message
 * @property {'error'|'warning'} severity
 * @property {string} [blockId]
 * @property {string} [field]      // e.g. 'endpoint'
 * @property {string} [rowId]      // a row inside a collection field
 * @property {string} [workflowId]
 * @property {string} [nodeId]
 * @property {string} [edgeId]
 */
```

This is exactly what `workflow/validation.js` emits today plus `scope`, `blockId`, `field` and `rowId`. `validateAllWorkflows` gains one line stamping `scope: 'workflow'` onto its results; nothing else in `src/workflow/` changes and `WorkflowValidationSummary` keeps working untouched.

**`rules.js`** — `validateAdmin(admin)`, `validateBusiness(business)`, `validateBlock(block)`, plus the `isBlockEmpty(block)` helper. Plain imperative functions in the style of `validateWorkflow`, each pushing issues with hand-written Hebrew messages.

**`index.js`** — `validateSpec({ admin, business, blocks })` returning a flat `Issue[]`, with ids suffixed by index the way `validateAllWorkflows` already does so React keys stay unique across repeated codes.

`App.jsx` memoises the result and concatenates the workflow issues:

```js
const formIssues = useMemo(
  () => validateSpec({ admin, business, blocks }),
  [admin, business, blocks],
);
const allIssues = useMemo(
  () => [...formIssues, ...wf.issues],
  [formIssues, wf.issues],
);
```

Recomputing on every keystroke is fine at this data size — a few hundred fields, no I/O.

### The neutral-block rule

`isBlockEmpty(block)` must ignore constructor defaults from `makeBlock`. A fresh HTTP block already carries `method: 'GET'`, `authType: 'None'` and one blank mapping row; a fresh table carries two blank columns and one blank row; a fresh test-data block carries one blank row. "Empty" means every field the PM can type into is blank and no row has content.

An empty block produces **exactly one warning** — `EMPTY_BLOCK` / `בלוק ריק — מלאו אותו או מחקו` — and no errors. It therefore never blocks generation, but it is not invisible either, which closes the gap the neutral rule would otherwise open.

### The rules

| Scope | error (חובה) | warning (מומלץ) |
|---|---|---|
| admin | `clientName`; `pmName`; at least one contact with a name **and** an email or phone; a `name` on every department row when `departmentCreated` is on | — |
| business | `goal`; at least one non-empty trigger | — |
| http | `title`; `source`; `destination`; `endpoint`; `requestPayload` + `responsePayload` when `isThirdParty(destination)`; `whitelistedIps` when `ipWhitelistRequired`; `certificateDetails` when `certificateRequired` | no complete mapping row; empty `fallback`; `authType === 'None'` |
| freeText | `text` | empty `title` |
| testData | at least one row with both a key and a value | — |
| table | `name`; a label on every column; at least one non-empty row | — |
| any block | — | `EMPTY_BLOCK` |

The third-party payload rule is the one that exists today, relocated unchanged.

## UI

### One flag gates every colour

`App.jsx` gains `const [submitted, setSubmitted] = useState(false)`, set on the first generate press and cleared by `resetDraft`. It is session state, not persisted to the draft.

Asterisks render always. **Every** red/amber/green affordance — status chips, field rings, inline messages, the muted footer button — is gated on `submitted`.

### Primitives (`src/components/ui.jsx`)

- `Field` gains `required` (renders a red `*` trailing the label text — visually to its left, since the UI is RTL) and `error` (renders a red `שדה חובה`-style line with an icon below its children).
- `Input`, `Textarea` and `Select` gain `invalid`, appending the red border and ring to `inputBase`. `PayloadEditor` already takes `invalid`; its signature does not change.

Two field shapes exist in this codebase and both need covering:

- **Form fields** — wrapped in `Field` with an `Input`/`Textarea`/`Select` inside. These use the new props.
- **Table cells** — raw `<input className="cell-input">` inside `<table>` markup (contacts and departments in `AdminSection`, `MappingTable`, `TableBlock` rows). These already have a local `invalidCell` ring constant in `AdminSection`; promote it to a shared export and apply it the same way. Their column headers carry the `*`, as the contacts "שם מלא" header already does — except in `TableBlock`, where the column headers are themselves the editable inputs, so there is no static header text to mark; instead a labelled row ("שמות העמודות" `*`, with hint "תווית לכל עמודה") sits above the table, mirroring `AdminSection`'s "אנשי קשר" label block.

### Passing errors down

`App.jsx` builds an `errors` map per block and per section from `allIssues`, empty until `submitted`, and passes it as a prop. Keys are the plain `field` for block-level issues and `` `${field}#${rowId}` `` for row-level ones (contacts, departments, table columns, mapping rows). Usage reads as:

```jsx
<Field required error={errors.get('endpoint')}>
  <Input invalid={errors.has('endpoint')} … />
</Field>
```

The consequence worth stating: **the ring and the message are derived from the validator**, so they cannot drift. Only the decorative `*` is hand-placed, and a forgotten one is cosmetic.

### Status badges

`BlockStatusChip` renders in the `DynamicBlock` header, before the delete button, only when `submitted`:

- errors > 0 → red `חסרים N שדות חובה` (singular `חסר שדה חובה אחד`)
- errors 0, warnings > 0 → amber `N המלצות` (singular `המלצה אחת`)
- otherwise → teal `✓ מלא`

`DynamicBlock`'s existing red border and ring derive from the same counts rather than from the `invalidIds` set.

For the three locked sections, stacking a second badge next to the existing `חובה` badge is too busy. `LockedSection`'s badge keeps its current meaning until `submitted`, then becomes the status badge in the same slot — red with a count, or teal `✓ מלא`. `WorkflowSection` is a `LockedSection`, so it picks this up over `wf.issues` for free, and `WorkflowValidationSummary` continues to render inside it unchanged.

### `ValidationModal`

New `src/components/ValidationModal.jsx`, following `ExportModal`'s chrome (backdrop with `animate-fade`, `animate-pop` panel, `Escape` and backdrop-click to close, header/body/footer bands).

- Title `בדיקה לפני יצירת האפיון`, subtitle with the error and warning counts.
- Issues grouped by scope: `סעיף 1 · ניהולי`, `סעיף 2 · צורך עסקי`, `סעיף 3 · תהליכים`, then one subheading per technical block (its title, falling back to `BLOCK_META[type].title`). Errors before warnings within each group.
- Clicking a row closes the modal and scrolls to `#section-admin` / `#section-business` / `#section-workflows` / `` `#block-${blockId}` ``. Workflow rows additionally call `wf.setActiveWorkflowId` and `wf.selectNode` first, exactly as `generate()` does today.
- Footer: `צור בכל זאת` (teal, disabled while any error exists) and `חזרה לתיקון` (ghost).

**Deliberate simplification:** rows scroll to the block or section, not to the individual field. The row already names the field and the ring marks it on arrival. Per-field anchor ids are a cheap follow-up if this proves annoying in use.

### `generate()`

```js
const generate = () => {
  setSubmitted(true);
  if (allIssues.length > 0) return setCheckOpen(true);
  setSpec(compileSpec({ admin, business, workflows: wf.workflows, blocks }));
};
```

`צור בכל זאת` closes the modal and calls `compileSpec` directly.

Removed in the process: the `invalidIds` state, the `adminInvalid` state, the `setInvalidIds` bookkeeping inside `updateBlock`, the `setAdminInvalid(false)` reset inside `changeAdmin`, and all three toast-and-scroll branches. The toast machinery itself stays — `MarkdownToWordModal` still uses it for its success message.

The footer button renders muted teal, still enabled, whenever `submitted && errorCount > 0`.

## Files

**New**

- `src/validation/issue.js`
- `src/validation/rules.js`
- `src/validation/index.js`
- `src/components/ValidationModal.jsx`
- `src/components/BlockStatusChip.jsx`

**Modified**

- `src/components/ui.jsx` — `required` + `error` on `Field`, `invalid` on `Input`/`Textarea`/`Select`, shared `invalidCell` export
- `src/components/DynamicBlock.jsx` — status chip, derived invalid state
- `src/components/LockedSection.jsx` — badge doubles as status after submit
- `src/components/AdminSection.jsx` — asterisks, `errors` prop replacing its `invalid` prop
- `src/components/BusinessSection.jsx` — asterisks, new `errors` prop
- `src/components/HttpBlock.jsx` — asterisks, `errors` prop replacing its `invalid` prop (which it forwards to `PayloadEditor`)
- `src/components/FreeTextBlock.jsx`, `TestDataBlock.jsx`, `TableBlock.jsx`, `src/components/http/*.jsx` — asterisks and `errors` wiring
- `src/workflow/validation.js` — stamp `scope: 'workflow'`
- `src/App.jsx` — memoised issues, `submitted` and `checkOpen` state, rewritten `generate()`, removed `invalidIds`/`adminInvalid`

## Verification

There is no test runner in this project, per `CLAUDE.md`. Verification is `npm run lint`, `npm run build`, and a browser pass covering:

1. A newly added block shows no chip and no rings until the first generate press; its asterisks are visible immediately.
2. Pressing generate on a draft with problems in the admin section, a block, and a workflow lists all three in one modal.
3. `צור בכל זאת` is disabled while any error exists and enabled when only warnings remain.
4. A third-party HTTP block still refuses to export without both payloads (the existing behaviour).
5. A completely empty block yields one warning, not a wall of errors, and does not block export.
6. Modal rows scroll to the correct block or section; workflow rows also switch to the right workflow and select the node.
7. Fixing a field clears its ring and updates its chip without another button press.
8. `resetDraft` clears the submitted state, so the form goes silent again.
9. Everything above holds in dark mode and reads correctly RTL.
