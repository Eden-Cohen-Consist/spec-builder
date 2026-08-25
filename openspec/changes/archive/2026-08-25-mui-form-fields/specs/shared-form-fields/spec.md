## Purpose

Defines how the PM sees and interacts with standard form fields (text, multiline, select, checkbox) across the spec builder wizard and technical blocks, independent of any single section.

## ADDED Requirements

### Requirement: Outlined field appearance

Standard form fields used outside table cells and code editors SHALL render as outlined fields with the label inside the border (floating label pattern). The field SHALL use the app's teal focus accent and stone neutral palette in both light and dark mode.

#### Scenario: PM views a text field in light mode

- **WHEN** the PM opens any wizard step that uses a shared text field (for example "שם הלקוח")
- **THEN** the field shows an outlined border, the Hebrew label inside the border, and teal focus styling consistent with the rest of the app

#### Scenario: PM views fields in dark mode

- **WHEN** the PM toggles dark mode
- **THEN** all shared outlined fields remain readable with dark-background styling and teal focus accent

### Requirement: RTL layout for shared fields

Shared form fields SHALL lay out correctly in Hebrew RTL: labels, input text, select chevron, and helper text align for right-to-left reading. Fields that intentionally collect LTR technical values (URLs, JSON paths) MAY keep LTR input direction while the surrounding chrome stays RTL.

#### Scenario: PM edits a Hebrew text field

- **WHEN** the PM types Hebrew in a shared text field without an explicit LTR override
- **THEN** text entry and caret behave RTL and the label/helper text align to the reading direction

#### Scenario: PM edits an LTR technical field

- **WHEN** a field is marked for LTR content (for example a URL or JSON payload label rendered LTR)
- **THEN** the entered value displays left-to-right while the field chrome remains in the RTL page layout

### Requirement: Required field markers

Fields marked required SHALL show a required indicator before the PM submits the form. The indicator SHALL remain visible regardless of validation state.

#### Scenario: Required field before first generate

- **WHEN** the PM has not yet pressed "צור אפיון" and views a required field (for example "שם הלקוח")
- **THEN** a required marker is visible on the field label

### Requirement: Validation display timing

Shared fields SHALL follow the existing validation timing: inline field errors and error styling appear only after the PM's first "צור אפיון" press, then update live as the PM fixes values. Before that press, required markers show but inline errors do not.

#### Scenario: Empty required field before generate

- **WHEN** a required shared field is empty and the PM has not pressed "צור אפיון"
- **THEN** the required marker is shown and no inline error message or error styling is shown on that field

#### Scenario: Empty required field after generate

- **WHEN** the PM presses "צור אפיון" with a required shared field still empty
- **THEN** the field shows error styling and a Hebrew inline error message beneath the field

#### Scenario: Error clears on fix

- **WHEN** the PM fills a previously invalid shared field after submit
- **THEN** the inline error and error styling on that field clear without requiring another generate press

### Requirement: Helper and hint text

Optional hints (for example "לא חובה", "טריגר") SHALL appear as secondary helper text below the field when no validation error is present. When a validation error is present, the error message SHALL replace the hint in the helper area.

#### Scenario: Optional field with hint

- **WHEN** the PM views an optional field that declares a hint
- **THEN** the hint appears below the field in subdued text

#### Scenario: Field with both hint and error

- **WHEN** a field has a hint and a validation error after submit
- **THEN** the Hebrew error message is shown below the field and the hint is not shown at the same time

### Requirement: Select and multiline parity

Shared select and multiline fields SHALL match text-field behaviour for outlined appearance, RTL, required markers, validation timing, and helper/error text.

#### Scenario: PM opens a select field

- **WHEN** the PM opens a shared select (for example workflow trigger type)
- **THEN** the control uses the same outlined style and validation behaviour as text fields

#### Scenario: PM edits a multiline field

- **WHEN** the PM edits a shared multiline field (for example "המטרה העסקית")
- **THEN** the control expands vertically, keeps outlined styling, and shows validation/helper text below the field

### Requirement: Checkbox fields

Shared checkbox controls SHALL remain toggleable with an adjacent Hebrew label and SHALL follow the same teal accent in checked state in light and dark mode.

#### Scenario: PM toggles a security checkbox

- **WHEN** the PM toggles a shared checkbox in the HTTP security section
- **THEN** the checked state is clearly visible and the label remains readable in the current theme

### Requirement: Out of scope controls unchanged

Borderless table cell inputs, code-style payload editors, and modal-specific raw text areas SHALL keep their current specialised styling and SHALL NOT be converted to outlined MUI fields.

#### Scenario: PM edits a mapping table cell

- **WHEN** the PM edits a value inside a headers or mapping table row
- **THEN** the inline borderless cell input appearance is unchanged

#### Scenario: PM edits JSON payload

- **WHEN** the PM edits an HTTP payload in the dark monospace editor
- **THEN** the code editor appearance and LTR layout are unchanged

### Requirement: No export or persistence change

Replacing shared field rendering SHALL NOT change draft persistence keys, validation rules, or compiled JSON output. The PM export path (JSON + ai-review prompt → external LLM) SHALL produce the same JSON given the same field values.

#### Scenario: PM exports after filling the form

- **WHEN** the PM completes the form and exports
- **THEN** the compiled JSON matches the same field values as before the visual change (schemaVersion unchanged)
