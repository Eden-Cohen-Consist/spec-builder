## Context

See `proposal.md`. Today `src/lib.js` exports ~20 symbols consumed across App, block components, validation, workflow, and export modals. Split must preserve every export name and behavior.

## Goals / Non-Goals

**Goals**

- One concern per file; each new module under ~200 lines.
- Zero import-path churn for existing consumers via `src/lib.js` barrel.
- Move code verbatim — copy/paste then wire imports, no refactors inside functions.

**Non-goals**

- Direct-import migration (`from '../export/compileSpec.js'`) — optional later.
- Merging or splitting functions beyond the file boundaries below.

## Decisions

### 1. Target file map

| New file | Moves from `lib.js` |
|----------|---------------------|
| `src/model/factories.js` | `makeId`, `sanitizeWizard`, `isThirdParty`, `makeContactRow`, `makeDepartmentRow`, `hasContactContent`, `makeMappingRow`, `makeHeaderRow`, `makeTestRow`, `makeTableColumn`, `makeTableRow`, `makeBlock` |
| `src/utils/parseCurl.js` | `tokenizeCurl`, `CURL_DATA_FLAGS`, `CURL_SKIP_FLAGS`, `parseCurl` |
| `src/export/markdownToWord.js` | `FULL_DOCUMENT_FENCE`, `MARKDOWN_FENCE_LANGS`, `WORD_*` constants, `rewriteCodeBlocks`, `styleInlineCode`, `stripMarkdownFence`, `markdownToWordHtml` |
| `src/export/compileSpec.js` | `tryParseJson`, `uniqueRef`, `compileNodeConfig`, `compileWorkflowNodes`, `compileSpec` |
| `src/export/aiExport.js` | `buildAiExportText` (keeps `?raw` import of `ai-review.md`) |
| `src/lib.js` | Re-export everything above |

`compileSpec.js` imports `hasContactContent`, `isThirdParty` from `../model/factories.js`. `aiExport.js` imports nothing from compileSpec except receives compiled spec as argument.

### 2. Keep `src/lib.js` as barrel (not delete)

**Why**: 15+ importers use `../lib.js`. Barrel = one PR, zero consumer diffs, easy rollback.

**Alternative rejected**: Update every import to deep paths — more diff, same runtime.

### 3. Folder names: `model/`, `utils/`, `export/`

Aligns with existing `workflow/`, `validation/` top-level domains. `export/` groups compile + Word + AI prompt wrapping — all "output" concerns.

## Risks / Trade-offs

- **[Risk] Missed re-export in barrel** → Mitigation: grep `^export` in old `lib.js`, match barrel list; `npm run build` catches missing symbols.
- **[Risk] Circular import** → Mitigation: `factories` imports only `constants.js` for `INTERNAL_SYSTEMS` via `isThirdParty`; export modules import factories, never reverse.
- **[Trade-off] Barrel hides true location** → Acceptable for this change; deep imports can follow later.

## Migration Plan

1. Create new files with moved code.
2. Replace `lib.js` body with re-exports.
3. `npm run lint && npm run build`.
4. Browser: generate spec, open Word modal, paste cURL in HTTP block.
5. Rollback: revert single commit — no data migration.

## Open Questions

_None._
