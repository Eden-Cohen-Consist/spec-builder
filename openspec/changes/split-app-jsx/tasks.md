## 1. Persistence layer

- [x] 1.1 Add `src/persistence/keys.js` with `DRAFT_KEY` and `THEME_KEY` verbatim and verify both constants match previous values.
- [x] 1.2 Add `src/persistence/defaults.js` with `defaultAdmin` and `defaultBusiness` verbatim and verify imports from `lib.js` row factories.
- [x] 1.3 Add `src/persistence/migrations.js` with `migrateAdmin`, `migrateBusiness`, `foldSecurityIntoHttp`, `migrateBlocks` verbatim and verify `migrateBlocks` still imports `makeBlock` from `lib.js`.
- [x] 1.4 Add `src/persistence/draft.js` — move `loadDraft`, module-level draft parse, `legacyFlow`, `initialWizard`, and initial-state helpers; export what `App.jsx` needs and verify `legacyFlow` round-trip logic is unchanged.

## 2. Wizard helpers and UI extractions

- [x] 2.1 Add `src/wizard/stepHelpers.js` with `STEP_SCOPES`, `stepFromScope`, `issuesForStep`, `stepHasError` verbatim and verify pure functions have no React imports.
- [x] 2.2 Add `src/components/app/BlockBody.jsx` — move `renderBlockBody` switch; accept `block`, `errors`, `onUpdate` props and verify all four block types still render.
- [x] 2.3 Add `src/components/app/AppHeader.jsx` — move sticky header JSX; wire props for save state, theme, reset and verify Hebrew labels + icons unchanged.
- [x] 2.4 Add `src/components/app/AppFooter.jsx` — move bottom nav JSX; wire step, prev/next/generate handlers and verify **הבא** hidden on step 3, generate only on step 3.

## 3. Slim App.jsx

- [x] 3.1 Update `App.jsx` to import from new modules, remove moved code, keep all `useState`/`useEffect`/`useMemo` and handler logic in place and verify file is substantially shorter with no deleted behavior.
- [x] 3.2 Confirm autosave `useEffect` still writes `wizard`, `workflows`, `blocks`, and conditional `flow` key using `DRAFT_KEY` from `keys.js` and verify 600ms debounce unchanged.

## 4. Verify

- [ ] 4.1 Run `npm run lint` and `npm run build` and verify both exit 0.
- [ ] 4.2 Browser walkthrough (visible pane): blank draft → step 1 Next blocked on empty admin → fill → step 2 canvas draws edges → step 3 blocks → generate opens export or validation modal → reset clears draft → reload preserves step 3 position.
- [ ] 4.3 Browser: toggle dark mode, confirm autosave indicator (**שומר…** / **נשמר אוטומטית**) still works; checkpoint **goToIssue** still jumps to correct step.
