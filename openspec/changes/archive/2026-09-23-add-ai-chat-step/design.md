## Context

See proposal.md — Why. Today the app is a browser-only Vite + React (plain JS) SPA. Steps 1–3 compile UI state into JSON and wrap it with the AI review prompt to produce handoff text. There is no backend and no secret storage, so calling Claude from the browser is not possible. This change adds a small backend and a Step 4 chat using assistant-ui + a Claude proxy that streams text and finishes via a tool call.

Exact system-prompt copy will be supplied later by the product owner; this design wires the seed path (compiled JSON + prompt slot) without freezing final prompt wording.

## Required skills (apply-time)

Before implementing the matching areas, the applying agent MUST read and follow these local skills (do not invent APIs from memory):

- **assistant-ui chat UI:** `.agents/skills/primitives` (`SKILL.md` + relevant `references/` — thread, composer, message, action-bar as needed). Use current primitive patterns (`AssistantRuntimeProvider`, children render functions, etc.).
- **Claude TypeScript API:** `.agents/skills/claude-api/typescript/claude-api` — at minimum `README.md`, `streaming.md`, and `tool-use.md` (plus shared tool concepts under `.agents/skills/claude-api/shared/` if needed).

## Goals / Non-Goals

**Goals:**
- Keep steps 1–3 and the existing compile pipeline untouched; reuse compiled export text to seed the chat.
- Add a small, well-organized TypeScript Express backend that is easy to extend (routes / controllers / services / middleware / types).
- Stream clarification text into the bubble; detect FINAL via a registered Claude tool (`tool_use`), never by regex or by showing a status JSON envelope to the PM.
- Build Step 4 with `@assistant-ui/react` primitives + `AssistantRuntimeProvider` and a runtime pointed at our `/api/chat`.
- Log per-session usage to a swappable JSON store; apply a token cap and basic rate limit.

**Non-Goals:**
- Prompt caching, user auth/accounts, and DB-backed usage (deferred).
- Persisting chat history across reloads (v1 session lives in memory on the client; server is stateless per request except the usage log).
- Changing the compiled JSON shape (schemaVersion stays 4).
- Homemade message-bubble / thread chrome.
- Final system-prompt prose (placeholder / existing prompt file until the owner replaces it).

## Decisions

**1. Separate `server/` TypeScript package, not a rewrite of the frontend.**
Frontend stays plain JS; backend is its own `package.json` + `tsconfig.json` under `server/`. Rationale: TS gives honest Claude stream/tool types; isolation avoids dragging a build step into the JS SPA.

Layout:
```
server/
  src/
    routes/        chat.routes.ts        # /api/chat (stream)
    controllers/   chat.controller.ts
    services/      claude.service.ts, usage.service.ts
    middleware/    rateLimit.ts, error.ts
    schemas/       chat.schema.ts, finalSpec.tool.ts  # zod: request + tool input
    config/        env.ts
    types/         index.ts
    app.ts
    server.ts
```

**2. Dev integration via Vite proxy.**
`/api/*` from the SPA forwards to Express. Same-origin chat API; no CORS juggling.

**3. Claude contract = streamed text + tool for FINAL (not `{status, content}` every turn).**
Register a tool such as `submit_final_spec` with a zod-validated input schema (at minimum the full specification string/markdown). On each turn:

- Stream Anthropic events to the client.
- Text deltas → forward as assistant message text for the bubble (PM never sees JSON wrappers).
- `tool_use` for `submit_final_spec` → validate input → emit a FINAL signal to the client → lock composer.

Rationale: matches industry practice (human-visible stream vs machine FINAL signal). Rejected alternatives:
- Every reply as structured `{status, content}` JSON (forces peeling JSON out of the stream for the bubble).
- Detecting FINAL with regex on free text (brittle).

Tool JSON arrives **inside the stream** as structured SDK/events, not as a pre-stream envelope and not via regex.

**4. assistant-ui on the frontend.**
Use `@assistant-ui/react` Thread/Composer/Message primitives under `AssistantRuntimeProvider`. Implement (or adapt) a runtime/transport that calls our Express streaming chat endpoint. Theme with Tailwind/existing tokens (RTL, teal, light/dark). Thin wrappers only. UI composition MUST follow `.agents/skills/primitives`. Server stream/tool wiring MUST follow `.agents/skills/claude-api/typescript/claude-api`.

**5. Session model = client-generated `sessionId`.**
Created on entering Step 4; sent with each turn; keys the usage log. Seed (compiled JSON + system prompt) on first message.

**6. Usage log = JSON file behind `usage.service`.**
Serialized writes; swappable later for a DB.

**7. Limits.**
- `max_tokens` from env on every Claude call.
- `express-rate-limit` on `/api/chat`.

## Risks / Trade-offs

- **Model skips the tool and pastes the spec as text** → system prompt (later) + tool description must insist FINAL only via the tool; optionally treat oversized “looks like full spec” text as soft warning, but lock only on validated tool call.
- **Tool input streams in pieces** → assemble until `tool_use` completes; lock only when schema-valid.
- **assistant-ui + plain JS Vite** → may need a small spike for runtime wiring; prefer official custom/local runtime patterns over fighting the kit.
- **JSON usage file concurrency** → single service + serialized writes.
- **Two toolchains** → accepted for API type safety.

## Migration Plan

- Additive: `server/` + Step 4; steps 1–3 unchanged.
- Rollback: remove Step 4 + proxy; leave server unused.
- Config: `ANTHROPIC_API_KEY`, `MAX_TOKENS`, rate-limit vars in `server/.env`.

## Open Questions

- Exact Claude model id and default `max_tokens` — env-tunable.
- Exact final tool name/schema fields beyond the specification body — freeze at apply if needed.
- Final system-prompt wording — owner will supply later; wire a prompt slot now.
- Precise assistant-ui runtime helper for our Express stream shape — spike during apply.
