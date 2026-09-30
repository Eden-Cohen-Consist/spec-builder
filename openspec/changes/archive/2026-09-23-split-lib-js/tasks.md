## 1. Create modules

- [x] 1.1 Add `src/model/factories.js` — move factory exports verbatim from `lib.js` and verify file exports `makeId`, `sanitizeWizard`, `isThirdParty`, all `make*Row`/`makeBlock` helpers, `hasContactContent`.
- [x] 1.2 Add `src/utils/parseCurl.js` — move `tokenizeCurl`, flag sets, and `parseCurl` verbatim and verify `parseCurl` is the only public export besides default internal helpers staying private.
- [x] 1.3 Add `src/export/markdownToWord.js` — move fence strip + Word HTML helpers verbatim and verify `stripMarkdownFence` and `markdownToWordHtml` export.
- [x] 1.4 Add `src/export/compileSpec.js` — move `compileSpec` and private helpers (`tryParseJson`, `uniqueRef`, `compileNodeConfig`, `compileWorkflowNodes`) verbatim and verify `compileSpec` imports `hasContactContent`/`isThirdParty` from `../model/factories.js`.
- [x] 1.5 Add `src/export/aiExport.js` — move `buildAiExportText` verbatim (keep `ai-review.md?raw` import) and verify it exports `buildAiExportText`.

## 2. Barrel and cleanup

- [x] 2.1 Replace `src/lib.js` body with re-exports of all public symbols from the five new modules and verify every symbol that was exported before is still exported from `lib.js`.
- [x] 2.2 Grep the repo for `from '...lib.js'` — confirm no consumer file needs an import-path edit and verify `npm run build` succeeds.

## 3. Verify

- [ ] 3.1 Run `npm run lint` and `npm run build` and verify both exit 0.
- [ ] 3.2 Browser: fill form → **צור פרומפט לאפיון** → export modal opens with same JSON shape (`schemaVersion: 4`, no `wizard` key).
- [ ] 3.3 Browser: HTTP block → cURL import still populates fields; Word modal (**המרת אפיון AI ל-Word**) still copies HTML.
