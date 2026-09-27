## 1. Claude final signal

- [x] 1.1 Align the production server `ai-review.md` FINAL instruction with raw Markdown in `submit_final_spec`; leave the active `test.md` override untouched. Verify the production prompt asks for tool input rather than a chat document or outer fence.
- [x] 1.2 Add a typed `final_start` event at the registered tool's `content_block_start` and forward it through the existing SSE controller. Verify a focused simulated Claude stream emits `final_start` before `final`, emits no tool input as text, rejects invalid or interrupted finals, and `npm run build:server` passes.

## 2. Step 4 generation UI

- [ ] 2.1 Parse `final_start` in the client chat API and track generation state in `useChatAdapter`; clear provisional text from that turn when the tool starts. Verify a simulated SSE exchange still streams clarification text and clears generation state on error; run `npm run lint` and `npm run build`, then check the changed chat flow in a real browser.
- [ ] 2.2 Replace the final Markdown body with a Hebrew generation status and a two-action completion card. Keep the composer disabled during generation and after valid FINAL; restore it on failure. Verify loading, successful completion, invalid tool payload, RTL, and light/dark appearance by interacting with Step 4 in a real browser; run `npm run lint` and `npm run build`.

## 3. Browser file downloads

- [ ] 3.1 Install the approved `docx` dependency in the client and verify client installation and `npm run build` succeed.
- [ ] 3.2 Add one Markdown-to-DOCX export module using installed `marked` and `docx`, with centralized font, heading, spacing, list, table, code, and RTL styles. Verify one representative Hebrew/mixed-English Markdown sample produces a valid `.docx` with the expected document structures; run `npm run lint` and `npm run build`.
- [ ] 3.3 Wire completion-card actions to download clean `.md` and `.docx` files from the validated final Markdown; lazy-load Word generation and keep Markdown available if Word generation fails. Verify both downloads and Hebrew error feedback by interacting with the card in a real browser; run `npm run lint` and `npm run build`.

## 4. End-to-end verification

- [ ] 4.1 Run `npm run build:server`, client lint/build, and a focused browser pass from a short tool-call response through generation status to both downloads. Open the DOCX in Word or LibreOffice and verify Hebrew RTL, headings, lists, tables, code, and mixed English are readable; confirm the current local test-prompt override and existing draft/JSON shape were not changed.
