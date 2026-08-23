## Why

`src/lib.js` (~500 lines) mixes four unrelated jobs: row/block factories, cURL parsing, Markdown→Word conversion, and JSON export compilation. That makes it hard to find code and risky to edit one concern without touching others. The PM-facing app and export path (JSON + `ai-review.md` → external LLM) must stay identical — this is a file-layout-only cleanup.

## What Changes

- Move factory helpers (`makeId`, `makeBlock`, row makers, `isThirdParty`, `hasContactContent`, `sanitizeWizard`) into `src/model/factories.js`.
- Move `parseCurl` and its tokenizer into `src/utils/parseCurl.js`.
- Move `stripMarkdownFence` and `markdownToWordHtml` into `src/export/markdownToWord.js`.
- Move `compileSpec` and its private helpers into `src/export/compileSpec.js`.
- Move `buildAiExportText` into `src/export/aiExport.js`.
- Turn `src/lib.js` into a thin barrel that re-exports the same public symbols so existing `from './lib.js'` / `from '../lib.js'` imports keep working without edits.
- Code moves verbatim — no logic, signature, or export-name changes.

## Capabilities

### New Capabilities

_(none — pure refactor)_

### Modified Capabilities

_(none — PM UI, compiled JSON shape, and `schemaVersion` 4 stay unchanged)_

## Non-goals

- Changing any export JSON field, `schemaVersion`, or `ai-review.md`.
- Updating consumer import paths (barrel keeps them stable).
- Splitting `src/constants.js`, `src/validation/`, or `src/workflow/`.
- Adding tests, TypeScript, or new dependencies.
- Renaming or restructuring functions beyond moving them to new files.

## Impact

- **User**: Hebrew PM sees no difference; same wizard, same generate → copy prompt flow.
- **Code**: `src/lib.js` shrinks to re-exports; five new modules under `src/model/`, `src/utils/`, `src/export/`.
- **Imports**: ~15 files import from `lib.js` today — unchanged if barrel is correct.
- **Verify**: `npm run lint`, `npm run build`, browser pass on generate + Word modal + cURL import.
