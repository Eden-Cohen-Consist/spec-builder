## Context

See proposal.md for motivation and `specs/ai-spec-chat/spec.md` for PM-visible behavior. Step 4 already sends a compiled spec and conversation to `/api/chat`. The server forwards Claude text deltas, but recognizes `submit_final_spec` only after `finalMessage()`. The client currently displays the final Markdown in `FinalSpecCard`. `marked` is installed; the existing Word helper produces clipboard HTML, not a `.docx` file. The current `test.md` prompt selection is an unrelated, uncommitted local override and must remain intact.

## Goals / Non-Goals

**Goals:**

- Report final-tool start before its Markdown argument finishes streaming.
- Keep final Markdown in dedicated client state, outside chat message content.
- Produce a real, styled `.docx` and a `.md` from that same validated Markdown in the browser.
- Keep the export code small and style settings easy for a developer to change.

**Non-Goals:**

- New server-side export endpoints, document storage, or a PM-facing style editor.
- Changes to the compiled JSON contract or steps 1–3.
- Refactoring the separate clipboard HTML converter.

## Decisions

### 1. Use the existing Claude stream for an early generation signal

In `claudeService`, detect `content_block_start` whose block type is `tool_use` and name is `submit_final_spec`. Emit a small `final_start` stream event immediately; the controller forwards it over the existing SSE response. The final Markdown remains in the tool input and is sent only after `finalMessage()` completes and Zod validates it. Keep the current checks for unknown or multiple tool calls, refusal, token limit, abort, and invalid input. An error after `final_start` clears the loading state and does not create a FINAL.

Alternatives considered: waiting for `finalMessage()` gives no early signal; parsing ordinary text cannot reliably identify a final specification. Tool input deltas need not be sent to the browser because the PM does not need partial final Markdown.

### 2. Give Step 4 three explicit states

The chat adapter and UI distinguish clarification, generating final, and final ready. Clarification text keeps streaming into assistant-ui bubbles. On `final_start`, show a Hebrew generation status, disable sending, and clear any provisional assistant text from that turn. On validated `final`, store the Markdown outside assistant-ui message content and replace the status with a dedicated completion card. On error, clear the status, show Hebrew feedback, and allow another turn. Keep the current in-memory session lifetime.

The final tool can follow a text block in the same Claude response. The UI must remove that provisional bubble on `final_start`; the tool argument itself must never enter chat text. The production server prompt should instruct Claude to place raw Markdown in the final tool field and not emit final-document prose first. Preserve the current local `test.md` selection.

### 3. Generate DOCX locally with `docx` and the installed Markdown parser

Add `docx` to the client package. One module under `client/src/export/` converts the final Markdown to Word objects using the already installed `marked` lexer. Put document style definitions alongside that conversion: common Hebrew font, heading levels, body spacing, list indents, table borders/shading, code font, page margins, and RTL paragraph direction. Keep technical identifiers and code readable left-to-right. Use `Packer.toBlob()` on Word click, then trigger a browser download. Lazy-load the export module on click so Step 4 does not pay its bundle cost before export.

Use the existing `stripMarkdownFence` helper for the final tool string before either download, so a document-wide Markdown fence cannot corrupt the output. The Markdown action downloads those clean UTF-8 bytes as `.md` using browser Blob APIs. Both actions use the same client-held final specification and do not call Claude again. If DOCX generation fails, show an error beside the actions and retain the Markdown action.

Alternatives considered: Pandoc adds a separate program to each server deployment; HTML-to-Word conversion would make formatting depend on Word's HTML interpretation. Direct Word objects require a small Markdown mapping, but give predictable file structure and style control within the current JavaScript app.

## Risks / Trade-offs

- A tool call can begin after ordinary text in the same response: clear the current turn's provisional text when `final_start` arrives. Prompt instructions reduce the chance of final-document prose appearing before that event, but cannot make an earlier text event predictable.
- Mixed Hebrew/English, numbered lists, tables, and code are easy to misformat: use explicit RTL paragraph properties, LTR code runs, and a representative real Word/browser check.
- Long documents can take time to pack in the browser: generate only after Word click, show button-level progress, and keep Markdown download usable.
- Markdown can contain constructs outside the app's document prompt: support the prompt's headings, paragraphs, emphasis, links, flat lists, tables, and fenced code; render unsupported text as readable body text rather than silently dropping it.

## Migration Plan

Add the client dependency and stream event without changing stored drafts or compiled JSON. Keep the active local test prompt override untouched. Update the production server prompt's FINAL instruction to require raw Markdown in `submit_final_spec` when that prompt is next activated. Roll back by removing the new event handling and browser export actions; existing chat requests remain the same.
