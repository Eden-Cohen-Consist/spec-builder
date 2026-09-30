## Context

See `proposal.md`. `App.jsx` currently mixes module-level draft bootstrap, inline migrations, wizard helpers, and large JSX regions. `workflow/migrate.js` already shows the preferred pattern for load-time sanitization.

## Goals / Non-Goals

**Goals**

- Extract pure JS (no React) into `persistence/` and `wizard/`.
- Extract presentational JSX chunks into `components/app/`.
- Keep `App.jsx` as the single owner of React state and effects.
- Move code verbatim.

**Non-goals**

- `useWizard` / `useDraft` hooks.
- Moving `components/` sections or modals into subfolders.
- Changing when validation runs or what issues show.

## Decisions

### 1. Target file map

| New file | Moves from `App.jsx` |
|----------|----------------------|
| `src/persistence/keys.js` | `DRAFT_KEY`, `THEME_KEY` |
| `src/persistence/defaults.js` | `defaultAdmin`, `defaultBusiness` |
| `src/persistence/migrations.js` | `migrateAdmin`, `migrateBusiness`, `foldSecurityIntoHttp`, `migrateBlocks` |
| `src/persistence/draft.js` | `loadDraft`, module-level `draft` parse, exports `legacyFlow`, `initialWizard`, `getInitialAdmin`, `getInitialBusiness`, `getInitialBlocks` factory fns |
| `src/wizard/stepHelpers.js` | `STEP_SCOPES`, `stepFromScope`, `issuesForStep`, `stepHasError` |
| `src/components/app/BlockBody.jsx` | `renderBlockBody` switch — receives `block`, `errors`, `onUpdate` props |
| `src/components/app/AppHeader.jsx` | Sticky header (logo, save indicator, theme, reset) — props: `saveState`, `dark`, `onToggleTheme`, `onReset` |
| `src/components/app/AppFooter.jsx` | Bottom nav bar (הקודם / הבא / צור פרומפט) — props for step, handlers, generate styling |

`draft.js` imports migrations, defaults, `sanitizeWizard` from lib, `migrateWorkflows` from workflow. `migrations.js` imports `makeBlock`, row factories from lib.

### 2. Module-level draft bootstrap stays in `draft.js`

**Why**: `loadDraft()` runs at import time today (`const draft = loadDraft()`). Moving to `draft.js` preserves order; App imports `{ legacyFlow, initialWizard, ... }` instead of defining inline.

**Alternative rejected**: Move load into `useState` initializer only — would change when `legacyFlow` is captured relative to hot reload (subtle behavior risk).

### 3. No custom hooks this pass

**Why**: User asked for simple file moves. Header/footer as components + pure helpers = enough shrink without new React abstractions.

### 4. `BlockBody` stays a function component (not render prop)

Receives `block`, `errors`, `onUpdate(patch)`. App passes `onUpdate={(patch) => updateBlock(block.id, patch)}` per block in the map — same as today.

## Risks / Trade-offs

- **[Risk] `draft.js` init order** → Mitigation: keep `loadDraft` + `legacyFlow` extraction identical; test reload on step 3 and legacy `flow` round-trip.
- **[Risk] Header/footer prop drilling** → Mitigation: only ~4 props each; acceptable for this scope.
- **[Risk] Autosave effect breaks** → Mitigation: leave `useEffect` debounce in App unchanged; only keys move to `keys.js`.
- **[Trade-off] App still ~250 lines** → Acceptable; further hook extraction is a separate change.

## Migration Plan

1. Create `persistence/` + `wizard/` + `components/app/` files.
2. Slim `App.jsx` to imports + state + effects + step conditional render.
3. `npm run lint && npm run build`.
4. Browser walkthrough: steps 1→3, Next gates, generate, reset, reload, dark mode toggle.
5. Rollback: single revert — no schema change.

## Open Questions

_None._
