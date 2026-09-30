# authoring-wizard Specification

## Purpose

Gives the PM a three-step Hebrew authoring flow so administrative context, the workflow canvas, and technical blocks are filled on separate screens, with advance gated by existing validation.

## Requirements

### Requirement: Authoring is a four-step wizard
The system SHALL show exactly one authoring step at a time:

1. הקשר אדמיניסטרטיבי and צורך עסקי together
2. תרשים הזרימה only
3. בלוקים טכניים only
4. שיחה עם ה‑AI only (the AI chat conversation)

The sticky app header (title, autosave, theme, reset) SHALL remain visible on every step. The compiled export JSON SHALL be unchanged (same fields, no ids, names as the only cross-references) and SHALL be used to seed the Step 4 conversation.

#### Scenario: Opening the app
- **WHEN** the PM opens a draft with no stored wizard position
- **THEN** the system shows step 1 only (administrative context and business need)

#### Scenario: Step 2 hides other sections
- **WHEN** the PM is on step 2
- **THEN** the workflow canvas is the only authoring body shown (no admin, business, or technical blocks)

#### Scenario: Step 3 hides other sections
- **WHEN** the PM is on step 3
- **THEN** the technical blocks list and add-block control are the only authoring body shown

#### Scenario: Step 4 shows only the chat
- **WHEN** the PM is on step 4
- **THEN** the AI chat is the only authoring body shown (no admin, business, workflow, or technical blocks)

### Requirement: Stepper shows progress and never skips ahead
The system SHALL show a horizontal RTL stepper above the step body, using the app teal accent (not a third-party purple). The current step SHALL have a distinct ring around its node. Completed / reached steps SHALL be connected by a filled line.

The PM MAY click a step that has already been reached. The system MUST NOT navigate to a step that has not been reached yet.

#### Scenario: Current step is marked
- **WHEN** the PM is on step 2
- **THEN** the stepper marks step 2 as current (ring) and steps 1–2 as reached

#### Scenario: Skip-ahead is blocked
- **WHEN** the PM has never successfully left step 1
- **AND** they click step 3 on the stepper
- **THEN** the system stays on step 1

#### Scenario: Reached steps are clickable
- **WHEN** the PM has already reached step 3
- **AND** they click step 1 on the stepper
- **THEN** the system shows step 1

### Requirement: Next validates the current step
The system SHALL provide **הבא** on steps 1, 2, and 3 and **הקודם** on steps 2, 3, and 4.

**הקודם** SHALL always move to the previous step without validating.

**הבא** SHALL evaluate the current step’s existing issues:

- Step 1: administrative and business issues
- Step 2: workflow issues
- Step 3: the full-form check (admin + business + workflows + blocks), because leaving step 3 enters the AI chat, which needs a valid specification to seed the conversation

If that step has any **error**, the system MUST stay on the step, reveal that step’s field/section errors (asterisks remain as today; red/amber affordances appear after the failed attempt), and MUST NOT advance. **Warnings** MUST NOT block advance.

The system MUST NOT invent new validation rules. Empty untouched technical blocks remain a warning only, and still do not apply until step 3.

#### Scenario: Step 1 errors block Next
- **WHEN** the PM is on step 1 with a missing client name
- **AND** they press **הבא**
- **THEN** the system stays on step 1 and shows the existing client-name error on that field

#### Scenario: Step 1 warnings do not block Next
- **WHEN** the PM is on step 1 with no errors and only warnings (or no issues)
- **AND** they press **הבא**
- **THEN** the system moves to step 2

#### Scenario: Step 3 errors block entry to the chat
- **WHEN** the PM is on step 3 and the full-form check has any error
- **AND** they press **הבא**
- **THEN** the system stays on step 3, opens the checkpoint modal, and does not advance to step 4

#### Scenario: Clean step 3 advances to the chat
- **WHEN** the PM is on step 3 with no errors anywhere
- **AND** they press **הבא**
- **THEN** the system moves to step 4 and seeds the AI chat with the compiled spec

#### Scenario: Back does not re-check
- **WHEN** the PM is on step 2
- **AND** they press **הקודם**
- **THEN** the system shows step 1 regardless of workflow issues

#### Scenario: Errors on a later visit still block leaving that step via Next
- **WHEN** the PM returns to step 1, clears a required field, and presses **הבא**
- **THEN** the system stays on step 1 and shows that field error

### Requirement: The last step hosts the AI chat
The system SHALL make step 4 (the last step) the AI chat conversation. The old copy-paste generate/export handoff SHALL no longer be the primary path to produce the specification.

Entering step 4 SHALL run the existing full-form check (admin + business + workflows + blocks). Errors SHALL open the checkpoint modal and block entry; warnings SHALL allow entry. Clicking an issue in the checkpoint modal SHALL switch to that issue’s step, then scroll to the field/section as today.

#### Scenario: Generate is hidden on earlier steps
- **WHEN** the PM is on step 1, 2, or 3
- **THEN** the AI chat is not shown (the last-step handoff is the chat, not an export button)

#### Scenario: Generate on a complete last step
- **WHEN** the PM is on step 3 with no errors anywhere
- **AND** they advance to step 4
- **THEN** the system opens the AI chat seeded with the compiled spec (JSON + system prompt)

#### Scenario: Issue navigation changes step
- **WHEN** the checkpoint modal is open
- **AND** the PM clicks a workflow issue
- **THEN** the modal closes, the system shows step 2, and the matching workflow/node is selected and scrolled into view

### Requirement: Wizard position survives reload and reset
The system SHALL persist the current step and the highest reached step in the existing draft (`glassix-spec-builder:draft:v1`). A missing or invalid stored value SHALL load as step 1, highest reached 1. Unrecognized draft keys MUST still be kept. Resetting the draft SHALL return the PM to step 1 and clear the stored wizard position with the rest of the draft.

#### Scenario: Reload keeps the step
- **WHEN** the PM is on step 2 and reloads the page
- **THEN** the system restores step 2 and still treats step 2 as reached (step 3 remains unreachable until Next from step 2 succeeds)

#### Scenario: Reset returns to the start
- **WHEN** the PM resets the draft
- **THEN** the system shows step 1 with an empty default draft
