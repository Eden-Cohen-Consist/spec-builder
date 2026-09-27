## Why

The Hebrew-speaking, non-developer PM completes a four-step path: draft details, workflows, technical blocks, then an in-app Claude chat seeded from the compiled JSON and `ai-review.md`. Today the PM cannot tell when Claude begins generating the final specification, and the result is displayed as chat content without downloadable files.

## What Changes

- Signal the start of Claude's structured `submit_final_spec` tool call so Step 4 can show a distinct Hebrew generation state while the final Markdown is still arriving.
- Keep the completed specification out of ordinary chat bubbles. After validating the tool input, show a compact completion card with **Download Word** and **Download Markdown** actions in Hebrew.
- Generate a real, styled, RTL `.docx` in the browser from the final Markdown using the `docx` npm library and the already installed Markdown parser. Keep fonts, headings, spacing, lists, tables, and code styles in one clear export module.
- Let the PM download the original Markdown as `.md`; a Word export failure must not remove the Markdown download.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ai-spec-chat`: Add an early final-generation state and replace the displayed final Markdown body with downloadable Markdown and Word files.

## Impact

- Extend the existing Claude stream service, SSE controller, chat API parser, chat adapter, and Step 4 completion UI.
- Add one browser-side Markdown-to-DOCX export module and the `docx` client dependency. No separate server program is needed.
- Align the production final-spec prompt with the structured tool payload. Do not replace the current local test-prompt override while it is in use.
- Keep the compiled JSON contract, steps 1–3, and chat session lifetime unchanged.

## Non-goals

- Persisting final files or chat sessions after leaving Step 4 or reloading.
- A PM-facing document style editor or multiple templates.
- Reworking the existing Markdown-to-HTML clipboard converter.
