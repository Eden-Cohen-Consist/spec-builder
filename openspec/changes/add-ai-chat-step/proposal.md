## Why

Today the PM finishes steps 1–3, generates a JSON + system prompt, and must copy that text into an external LLM chat by hand to get the final spec. That handoff is manual, error-prone, and gives us no visibility into usage or cost. Bringing the conversation into the app lets the PM produce the final specification in one place, with a controlled Claude integration we can measure and grow later (auth, persistence, teams).

## What Changes

- Add **Step 4 — שיחה עם ה‑AI**: a polished chat screen (ChatGPT/Gemini style) where the PM talks with Claude to refine and receive the final specification.
- Chat UI is built with **[assistant-ui](https://www.assistant-ui.com/)** (`@assistant-ui/react` primitives: Thread, Composer, Message, etc.), wrapped in `AssistantRuntimeProvider` and a runtime that talks to our backend — not homemade bubbles and not a vague “shadcn chat” kit.
- Steps 1–3 stay unchanged. The existing compiled JSON + system prompt are still produced in the app and seed the Step 4 conversation (exact system-prompt wording will be filled in later; the pipeline/wiring is in scope now).
- Introduce a small **TypeScript Express backend** (thin MVC: routes / controllers / services / middleware / types) that proxies Claude. The API key lives only on the server. Frontend stays plain JS.
- **Claude interaction model (industry-style):**
  - Clarification turns = normal **assistant text**, **streamed** into the bubble (PM never sees raw JSON).
  - Complete specification = Claude calls a registered **tool** (e.g. `submit_final_spec`) with the full spec payload. The backend detects the structured `tool_use` block (no regex) and treats that as FINAL.
- When FINAL (tool call) is received, the chat input is **disabled**.
- **Per-session usage logging** to a local JSON file (tokens in/out, message count, timestamps) so stats are easy to read now and swappable for a DB later.
- Basic guardrails in v1: **per-response token cap** and **basic rate limiting** on the API.
- The old copy-paste export handoff is superseded by Step 4. (Markdown → Word side path is untouched.)

## Capabilities

### New Capabilities
- `ai-spec-chat`: Conversational spec generation in Step 4 — assistant-ui chat, Express Claude proxy with streaming text + tool-call FINAL, FINAL-locks-input, usage logging, and token/rate limits.

### Modified Capabilities
- `authoring-wizard`: Wizard becomes four steps; Step 4 hosts the AI chat; the final-step Generate/handoff feeds the chat instead of the copy-paste export.

## Impact

- **Frontend**: Step 4 with assistant-ui primitives + runtime wired to `/api/chat`, wizard stepper +1, thin theme/RTL wrappers; existing compile of JSON + system prompt reused to seed the chat. Visual language stays aligned with the current app (RTL Hebrew, teal accent, light/dark).
- **New backend**: `server/` TypeScript Express app — streaming `/api/chat`, Claude service (stream + tools), usage-log service, rate-limit + token-cap middleware, types.
- **Dependencies (need approval)**: backend — `express`, `typescript`, `@anthropic-ai/sdk`, a rate-limit middleware, `zod`, `dotenv`, `tsx`/`ts-node`. Frontend — `@assistant-ui/react` (and any small peers the runtime needs).
- **Config**: `ANTHROPIC_API_KEY` and limits via server env; local usage JSON file path.
- **Deferred (noted, not built now)**: prompt caching, user auth/accounts, DB-backed usage, final system-prompt copy (user will supply later).
- **Required agent skills during apply** (must read before coding the matching parts):
  - `.agents/skills/primitives` — assistant-ui Thread/Composer/Message primitives and gotchas
  - `.agents/skills/claude-api/typescript/claude-api` — TypeScript Claude SDK (especially `streaming.md`, `tool-use.md`, and `README.md`)
