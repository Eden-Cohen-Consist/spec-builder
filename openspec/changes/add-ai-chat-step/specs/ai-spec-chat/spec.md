## Purpose

Lets the PM produce the final integration specification by chatting with Claude inside the app (Step 4), instead of copy-pasting a generated prompt into an external LLM. Covers the assistant-ui chat experience, streaming replies, tool-call FINAL, the server-side Claude proxy, and usage/limit controls.

## ADDED Requirements

### Requirement: Step 4 hosts an AI chat conversation
The system SHALL provide a Step 4 chat screen where the PM exchanges messages with the AI assistant to refine and receive the specification. The screen SHALL show the conversation history (PM messages and AI messages), a message composer, and a send action. The UI SHALL be RTL Hebrew and SHALL match the existing app’s visual language (layout feel, teal accent, light/dark theme).

The conversation SHALL be seeded from the existing compiled JSON and system prompt produced by steps 1–3; the PM SHALL NOT need to copy any text manually. Exact system-prompt wording MAY be supplied later; the seeding wiring SHALL still exist.

#### Scenario: Entering Step 4 seeds the conversation
- **WHEN** the PM reaches Step 4 with a completed steps 1–3 draft
- **THEN** the system starts a session using the compiled JSON + system prompt as context
- **AND** the composer is enabled for the PM to send the first message

#### Scenario: Sending a message shows both sides
- **WHEN** the PM sends a message
- **THEN** the PM message appears in the history
- **AND** the assistant reply appears in the history when received

### Requirement: Chat UI uses assistant-ui primitives and a runtime
The chat surface SHALL be built with `@assistant-ui/react` primitives (Thread, Viewport, Messages, Composer, and related parts as needed). The chat tree SHALL be wrapped in `AssistantRuntimeProvider` (or equivalent) with a runtime that communicates with the application backend. The system MUST NOT invent message-bubble / thread / composer chrome from scratch.

Primitives SHALL be styled to the existing app (RTL, accent, light/dark) so Step 4 feels like the same product.

#### Scenario: Messages render via assistant-ui
- **WHEN** the PM views the Step 4 conversation
- **THEN** PM and assistant messages are rendered through assistant-ui message/thread primitives
- **AND** the overall look remains consistent with the rest of the app (RTL, accent, theme)

#### Scenario: Runtime is required for a working chat
- **WHEN** the PM sends a message from the composer
- **THEN** the assistant-ui runtime delivers the turn to the application backend
- **AND** the reply is reflected in the thread through that runtime

### Requirement: Clarification turns stream as plain assistant text
For clarification or question turns, the assistant SHALL reply with normal text (not a status JSON envelope shown to the PM). The system SHALL stream that text into the assistant message bubble as tokens arrive so the PM sees live typing.

The PM SHALL NEVER see raw API JSON, tool payloads, or schema wrappers in the bubble.

#### Scenario: Clarification reply streams into the bubble
- **WHEN** the assistant asks a clarifying question
- **THEN** the question text appears progressively in the assistant bubble
- **AND** the composer stays enabled after the turn completes

### Requirement: FINAL is a Claude tool call, not free-form parsing
The backend SHALL register a Claude tool (e.g. `submit_final_spec`) whose input carries the complete specification. When the model is done, it SHALL invoke that tool. The backend SHALL detect FINAL via the provider’s structured `tool_use` payload (SDK/event types), NOT by regex or by parsing free-form chat text.

When that tool call is received and validated, the system SHALL treat the session as FINAL: display the specification and disable the composer and send action.

#### Scenario: Tool call completes the specification
- **WHEN** Claude returns a structured `tool_use` for the registered final-spec tool with a valid specification payload
- **THEN** the system shows the final specification
- **AND** the composer and send action are disabled

#### Scenario: Clarification does not lock the input
- **WHEN** Claude returns only streamed assistant text and no final-spec tool call
- **THEN** the composer stays enabled

#### Scenario: Invalid or unexpected tool payload is rejected
- **WHEN** a tool call arrives that fails schema validation
- **THEN** the system shows an error state
- **AND** does not lock the session as a successful FINAL

### Requirement: The Claude API key never reaches the browser
All calls to the AI provider SHALL be made from the backend. The provider API key SHALL be configured only on the server and SHALL NOT be exposed in frontend code, network responses, or client bundles. The frontend SHALL communicate only with the application's own `/api` endpoints.

#### Scenario: Frontend talks only to the app backend
- **WHEN** the PM sends a chat message
- **THEN** the browser sends the request to the application's `/api/chat` endpoint (or the streaming variant of that chat API)
- **AND** no provider API key is present in the request or in client code

### Requirement: Per-session usage is logged
The system SHALL record per-session usage for each AI exchange, including input and output token counts, message count, and timestamps, in a machine-readable JSON store that can be read to review stats. The logging mechanism SHALL be replaceable later (e.g. a database) without changing the chat behavior.

#### Scenario: An exchange is recorded
- **WHEN** the backend completes an AI exchange for a session
- **THEN** the usage record for that session is updated with token counts, an incremented message count, and a timestamp

### Requirement: Requests are bounded by token and rate limits
The backend SHALL enforce a maximum token limit per AI response and SHALL apply basic rate limiting to the chat endpoint. When a limit is exceeded, the backend SHALL return an error the frontend can present, and SHALL NOT call the AI provider beyond the configured bounds.

#### Scenario: Rate limit exceeded
- **WHEN** requests to the chat endpoint exceed the configured rate limit
- **THEN** the backend rejects the excess request with an error status
- **AND** the frontend shows that the limit was reached

#### Scenario: Response token cap applied
- **WHEN** the backend requests a completion from the AI provider
- **THEN** it constrains the response to the configured maximum token limit
