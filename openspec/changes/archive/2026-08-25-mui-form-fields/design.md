## Context

Shared form primitives live in `src/components/ui.jsx` and are imported across admin, business, workflow, and technical block sections. Today they are Tailwind-styled native elements with an external label (`Field` wrapper). See `proposal.md` for motivation.

A second input tier uses `.cell-input` in tables (AdminSection contacts/departments, MappingTable, HeadersEditor, TableBlock, TestDataBlock) and bespoke code editors (PayloadEditor, CurlImport, MarkdownToWordModal). Those are intentionally different UX.

The app already uses antd `ConfigProvider` with RTL + themed tokens in `WizardStepper.jsx` — proof that a component-library theme layer coexists with Tailwind page chrome.

## Goals / Non-Goals

**Goals:**

- Swap `Input`, `Textarea`, `Select`, `Field`, and `Checkbox` internals to MUI while keeping the same export names and props so call sites stay unchanged.
- Outlined `TextField` variant with floating label, `helperText`, `error`, and `required` wired to existing validation props.
- MUI theme aligned to stone/teal palette; sync with `html.dark`; RTL via MUI direction + stylis RTL plugin.
- Preserve validation timing (`submitted` gate) — no changes to `src/validation/`.

**Non-Goals:**

- Converting `.cell-input` table fields or code editors to MUI.
- Replacing antd `Steps` in `WizardStepper`.
- Touching React Flow canvas styling, export JSON, or persistence.
- Migrating buttons (`GhostButton`, `DeleteButton`, `GhostAddRow`).

## Decisions

### 1. Central swap in `ui.jsx` (not per-section rewrites)

**Choice:** Re-implement the five field exports in one file.

**Rationale:** ~15 consumers import from `ui.jsx`; one change upgrades the whole wizard.

**Alternative rejected:** Replace imports file-by-file with raw MUI — high churn, easy to miss a file.

### 2. Keep `Field` + child split OR merge into composite

**Choice:** Keep `Field` as wrapper that renders MUI `FormControl` / passes label+error to child, OR refactor `Field` to accept `component` prop — simplest path: make `Input`/`Textarea`/`Select` self-contained when used with `Field` by having `Field` clone props onto MUI `TextField` via context or by merging into a single `TextField` when both label and input props are present.

**Practical approach:** Refactor so `Field` renders nothing but layout chrome (`afterLabel` slot) and passes `label`, `hint`, `required`, `error` down; `Input`/`Textarea`/`Select` render `TextField` with those props when wrapped. For call sites using `<Field><Input /></Field>`, implement `Field` to inject props into the single child via `React.cloneElement`, mapping:

| Current prop | MUI mapping |
|---|---|
| `label` | `label` |
| `hint` | `helperText` (when no error) |
| `required` | `required` |
| `error` (string) | `error={true}` + `helperText={error}` |
| `invalid` on child | `error={true}` |
| `afterLabel` | `InputLabel` adornment or slot next to label |

**Alternative:** Export new combined `FormField` — rejected because it forces call-site edits.

### 3. MUI dependencies

**Choice:** Add `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/stylis-plugin-rtl`.

**Rationale:** User explicitly wants MUI TextField; config rules say use a maintained library rather than hand-rolling floating labels.

**Note:** `antd` stays for wizard stepper only; no need to remove it in this change.

### 4. Theme module

**Choice:** New `src/theme/muiTheme.js` exporting `createAppTheme(dark)` and `src/theme/rtlCache.js` for Emotion cache with RTL plugin.

**Tokens (align with existing):**

| Token | Light | Dark |
|---|---|---|
| primary | `#0d9488` | `#14b8a6` |
| text primary | `#1c1917` | `#e9e6e2` |
| error | red-600 family | red-400 family |
| background paper | transparent / inherit | same — fields sit on section cards |

**Provider placement:** Wrap app content in `App.jsx` (inside existing `dir="rtl"` root), driven by same dark state as `html.dark` toggle. Pass `mode: dark ? 'dark' : 'light'` to `createTheme`.

### 5. Select implementation

**Choice:** `TextField select` with `MenuItem` children, preserving native `<option>` children from call sites by mapping children to `MenuItem` inside `Select` wrapper.

**Alternative:** Standalone MUI `Select` + `FormControl` — equivalent; `TextField select` keeps one component pattern.

### 6. Checkbox

**Choice:** MUI `Checkbox` + `FormControlLabel`, styled with `color="primary"` (teal).

**Trade-off:** Slightly different hit target vs custom button checkbox — acceptable for library consistency.

### 7. Hint placement

**Choice:** Move inline label hints (e.g. "לא חובה") to `helperText` below field per spec.

**Rationale:** Matches MUI outlined pattern user asked for; cleaner label row.

**Migration:** `Field` `hint` prop maps to helper text, not inline label suffix.

### 8. Exclude `.cell-input` and code editors

**Choice:** No changes to `index.css` `.cell-input`, `PayloadEditor`, `CurlImport`, or modal textareas.

**Rationale:** Outlined fields in dense tables look heavy; code areas need monospace dark chrome.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| MUI + Tailwind CSS specificity clashes | Scope MUI to form controls only; avoid global MUI overrides; use theme overrides not Tailwind on MUI innards |
| Double theme providers (antd + MUI) | Separate subtrees; document in code comment |
| `Field` + `Input` cloneElement fragility | Keep one-child constraint; lint/convention unchanged from today |
| Bundle size increase | Acceptable for PM tool; tree-shake MUI imports |
| RTL edge cases on `Select` menu | Browser-test workflow trigger select + HTTP block select in RTL |
| Dark mode drift between Tailwind sections and MUI fields | Drive MUI palette from same hex values as `@theme` / WizardStepper antd tokens |

## Migration Plan

1. Install MUI packages; add theme + RTL cache modules.
2. Wire providers in `App.jsx` tied to existing dark toggle.
3. Rewrite field exports in `ui.jsx`; run lint + build.
4. Browser pass: admin required fields, business textarea validation, workflow header select, HTTP block, security checkboxes, one table section (confirm cell-input unchanged).
5. Rollback: revert `ui.jsx` + remove providers — no data migration needed.

## Open Questions

None blocking — hint-to-helperText move is accepted in spec.
