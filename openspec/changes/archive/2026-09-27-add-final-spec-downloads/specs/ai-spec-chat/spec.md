## MODIFIED Requirements

### Requirement: FINAL is a Claude tool call, not free-form parsing
The backend SHALL register a Claude tool (e.g. `submit_final_spec`) whose input carries the complete specification as Markdown. When the model is done, it SHALL invoke that tool. The backend SHALL detect FINAL via the provider's structured `tool_use` payload (SDK/event types), NOT by regex or by parsing free-form chat text.

When the registered tool call begins, Step 4 SHALL show a distinct Hebrew status such as "מכין את האפיון…" while its input is still being generated. During this state, the composer and send action SHALL be unavailable. The tool input and final specification SHALL NOT appear as an ordinary assistant chat bubble. If text from the same turn appeared before the tool call, the UI SHALL remove that provisional bubble when the tool call begins.

When the tool call completes and its payload is validated, the system SHALL treat the session as FINAL: show a completion card with download actions and disable the composer and send action. Clarification turns SHALL continue to stream as normal assistant text and leave the composer enabled after completion.

#### Scenario: Final generation starts before the payload is complete
- **WHEN** Claude starts a structured `tool_use` block for the registered final-spec tool
- **THEN** Step 4 shows the Hebrew final-generation status before the full Markdown payload has arrived
- **AND** the PM does not see the tool input in a chat bubble

#### Scenario: Tool call completes the specification
- **WHEN** Claude returns a structured `tool_use` for the registered final-spec tool with a valid specification payload
- **THEN** the system shows the final completion card instead of the Markdown body in a regular assistant message
- **AND** the composer and send action remain disabled

#### Scenario: Clarification does not lock the input
- **WHEN** Claude returns only streamed assistant text and no final-spec tool call
- **THEN** the text appears progressively in an assistant bubble
- **AND** the composer stays enabled after the turn completes

#### Scenario: Invalid or unexpected tool payload is rejected
- **WHEN** a final-spec tool call fails validation, another tool is used, or the stream ends before a valid final payload is complete
- **THEN** the system shows an error state in Hebrew
- **AND** does not show download actions or lock the session as a successful FINAL

## ADDED Requirements

### Requirement: PM can download the final specification
After a valid FINAL, the Step 4 completion card SHALL offer two Hebrew actions: "הורדת Word" and "הורדת Markdown". The Markdown action SHALL download the final specification as a `.md` file. The Word action SHALL download a real `.docx` file made from the same final specification, preserving headings, emphasis, lists, tables, and code content while using readable Hebrew fonts and right-to-left document layout. Neither action SHALL require another Claude response.

#### Scenario: Download Markdown
- **WHEN** the PM selects "הורדת Markdown" after a valid FINAL
- **THEN** the browser downloads a `.md` file containing the final specification Markdown without an outer document fence

#### Scenario: Download styled Word document
- **WHEN** the PM selects "הורדת Word" after a valid FINAL
- **THEN** the browser downloads a valid `.docx` file with styled headings, body text, lists, tables, and code
- **AND** Hebrew paragraphs and mixed Hebrew/English content have readable right-to-left layout

#### Scenario: Word export fails
- **WHEN** Word file generation fails after a valid FINAL
- **THEN** the PM sees a Hebrew error message
- **AND** the Markdown download remains available without repeating the Claude conversation
