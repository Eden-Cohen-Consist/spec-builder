## Why

`src/App.jsx` (~580 lines) owns draft migrations, wizard step logic, block rendering, layout chrome, and all top-level React state in one file. That slows navigation and makes persistence changes easy to break. The Hebrew PM workflow (wizard steps → generate JSON + `ai-review.md` → external LLM) must not change — only where the code lives.

## What Changes

- Move draft localStorage keys and load helpers into `src/persistence/`.
- Move admin/business/block migration functions (currently inline in App) into `src/persistence/migrations.js`, matching the pattern of `src/workflow/migrate.js`.
- Move wizard step-scope helpers (`STEP_SCOPES`, `stepFromScope`, `issuesForStep`, `stepHasError`) into `src/wizard/stepHelpers.js`.
- Extract `renderBlockBody` switch into `src/components/app/BlockBody.jsx`.
- Extract sticky header and bottom footer JSX into `src/components/app/AppHeader.jsx` and `src/components/app/AppFooter.jsx`.
- Leave all `useState` / `useEffect` / `useMemo` orchestration in `App.jsx` — no custom hook layer in this change.
- Code moves verbatim — no logic, UI copy, or persistence shape changes.

## Capabilities

### New Capabilities

_(none — pure refactor)_

### Modified Capabilities

_(none — wizard steps, validation gates, autosave, and generate flow stay the same)_

## Non-goals

- Reorganizing the rest of `src/components/` (sections, modals, blocks folder grouping).
- Extracting a `useWizard` or `useDraft` hook (future optional follow-up).
- Touching `WorkflowSection`, React Flow canvas, or `useWorkflows.js`.
- Changing localStorage keys, debounce timing, or migration behavior.
- Splitting `AdminSection.jsx` or other section components.

## Impact

- **User**: Hebrew PM sees no difference across all three wizard steps, autosave, reset, theme toggle, generate, and issue navigation.
- **Code**: `App.jsx` drops to ~250–300 lines; six new files under `src/persistence/`, `src/wizard/`, `src/components/app/`.
- **Risk area**: Module-level draft bootstrap (`loadDraft()` at import time) must move without changing initialization order.
- **Verify**: `npm run lint`, `npm run build`, full browser walkthrough steps 1→3 + generate + reset + reload draft.
