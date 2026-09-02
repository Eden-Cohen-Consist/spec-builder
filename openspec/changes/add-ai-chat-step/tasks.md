## 0. Required skills (read before coding)

- [ ] 0.1 Read `.agents/skills/claude-api/typescript/claude-api/README.md`, `streaming.md`, and `tool-use.md` (and shared tool docs under `.agents/skills/claude-api/shared/` if needed); confirm stream + tool_use patterns before writing the Claude service
- [ ] 0.2 Read `.agents/skills/primitives/SKILL.md` and the relevant `references/` (`thread.md`, `composer.md`, `message.md` at minimum); confirm provider/runtime + primitive composition before building Step 4 UI

## 1. Backend scaffold

- [ ] 1.1 Create `server/` with `package.json`, `tsconfig.json`, and dev/build scripts; verify `npm run build` compiles an empty app and `npm run dev` starts
- [ ] 1.2 Add dependencies (`express`, `@anthropic-ai/sdk`, `zod`, `express-rate-limit`, `dotenv`, `tsx`/`ts-node`, `typescript`, `@types/*`) and verify install succeeds
- [ ] 1.3 Add `config/env.ts` loading `ANTHROPIC_API_KEY`, model id, `MAX_TOKENS`, rate-limit window/max; verify it throws on missing key at startup
- [ ] 1.4 Wire `app.ts` + `server.ts` (json body, error middleware, mount routes) and verify a `GET /api/health` returns 200

## 2. Claude service (stream + tool FINAL)

- [ ] 2.1 Define zod schemas for the chat request and for the `submit_final_spec` (or chosen name) tool input; verify unit checks accept valid and reject invalid shapes
- [ ] 2.2 Implement `services/claude.service.ts` per the Claude TypeScript skill (streaming + tools), registering the final-spec tool, applying `max_tokens`, yielding text deltas + completed tool_use events; verify with a mocked SDK stream
- [ ] 2.3 On completed final-spec `tool_use`, validate the tool input with zod and expose a typed FINAL result; verify invalid tool input fails validation
- [ ] 2.4 Return token usage (input/output) when the stream finishes; verify the numbers are surfaced

## 3. Usage logging

- [ ] 3.1 Implement `services/usage.service.ts` with `logExchange(sessionId, usage)` writing/updating `server/data/usage.json` via serialized writes; verify two rapid calls both persist without corruption
- [ ] 3.2 Repair/tolerate a corrupt or missing usage file on read without crashing; verify a malformed file still allows a new write

## 4. Streaming chat endpoint

- [ ] 4.1 Implement `controllers/chat.controller.ts` + `routes/chat.routes.ts` for streaming `POST /api/chat` (sessionId, seed on first message, history/turn); verify text deltas reach the client and a final-spec tool call is signaled as FINAL
- [ ] 4.2 Apply `middleware/rateLimit.ts` to `/api/chat`; verify exceeding the limit returns the configured error status
- [ ] 4.3 On a successful exchange (stream end), call `usage.service.logExchange`; verify the session record updates (tokens, message count, timestamp)
- [ ] 4.4 Ensure invalid tool payloads and provider failures return an error signal and never lock FINAL; verify via forced bad mocks

## 5. Frontend Step 4 shell

- [ ] 5.1 Add Step 4 to the wizard (stepper +1, step body switch) so only the chat shows on step 4; verify navigation shows step 4 and hides other sections
- [ ] 5.2 Update Next/Back: `הבא` on steps 1–3, `הקודם` on steps 2–4; step 3 `הבא` runs the full-form check (errors open checkpoint modal + block, warnings advance); verify clean step 3 advances to step 4 and errors block
- [ ] 5.3 Configure Vite dev proxy so `/api` forwards to the Express server; verify a dev request from the SPA reaches the backend

## 6. assistant-ui chat

- [ ] 6.1 Install `@assistant-ui/react` (and required peers) following `.agents/skills/primitives`; verify a minimal Thread renders under `AssistantRuntimeProvider`
- [ ] 6.2 Wire a runtime/transport to the streaming `/api/chat` endpoint with `sessionId` (primitives skill patterns); verify composer send reaches the backend and streamed text appears in the thread — no homemade bubbles
- [ ] 6.3 Theme Thread/Composer/Message for RTL Hebrew and existing app accent/light-dark; verify it looks native to the product
- [ ] 6.4 On entering step 4, generate a `sessionId` and seed the first turn with compiled JSON + system-prompt slot (reuse export builder; prompt copy may be placeholder until owner supplies final text); verify seed is sent once
- [ ] 6.5 On FINAL tool signal, show the final specification and disable the composer + send; verify input locks only after validated FINAL
- [ ] 6.6 Show an error state for failed streams, invalid tool payloads, and rate-limit errors; verify the UI reflects each without crashing

## 7. Verification

- [ ] 7.1 Run `npm run lint` and `npm run build` (frontend) and the server build with no errors
- [ ] 7.2 Manual browser pass: complete steps 1–3, enter step 4, stream CHAT turns, receive FINAL via tool call, confirm input locks and `usage.json` updated
- [ ] 7.3 Run `openspec validate add-ai-chat-step --strict` and confirm it passes
