## Why

The PM-facing form controls in `src/components/ui.jsx` use custom Tailwind-styled inputs with labels above the field. Material UI `TextField` (outlined variant) gives a cleaner, more minimal look — label inside the border, built-in helper/error text — while keeping the same form behaviour and validation flow. Centralising the swap in `ui.jsx` upgrades every section that already imports `Field`, `Input`, `Textarea`, `Select`, and `Checkbox` without touching export or validation logic.

## What Changes

- Add `@mui/material`, `@emotion/react`, `@emotion/styled`, and `@mui/stylis-plugin-rtl` as dependencies.
- Introduce a shared MUI theme (`createTheme`) aligned with existing teal/stone palette and dark mode (`.dark` on `<html>`).
- Wrap the app (or form subtree) with MUI `ThemeProvider`, `CssBaseline`, and RTL `CacheProvider`.
- Re-implement `Input`, `Textarea`, `Select`, `Field`, and `Checkbox` in `src/components/ui.jsx` using MUI primitives while preserving the existing component props and call-site API.
- Map validation UX to MUI: `invalid` → `error`, `error` string → `helperText`, `required` → required asterisk, optional hints → helper text when no error.
- Leave unchanged: table `cell-input` fields, code editors (`PayloadEditor`, `CurlImport`, `MarkdownToWordModal` textarea), and non-field helpers (`GhostButton`, `GhostAddRow`, `DeleteButton`, `invalidCell`).

## Capabilities

### New Capabilities

- `shared-form-fields`: PM-facing shared form field appearance and interaction — outlined MUI fields, RTL, dark mode, required markers, and post-submit validation display — consumed via `src/components/ui.jsx` exports across admin, business, workflow, and technical blocks.

### Modified Capabilities

<!-- No existing main specs yet; this change introduces the first capability delta. -->

## Impact

- **User**: Hebrew PM sees cleaner outlined fields across the wizard; validation still appears only after first "צור אפיון" press, then live. Export path unchanged (JSON + `ai-review.md` → external LLM).
- **Code**: `src/components/ui.jsx`, new `src/theme/muiTheme.js` (or similar), `src/App.jsx` provider wiring. ~15 consumer files benefit without API changes.
- **Dependencies**: New MUI stack (antd remains for `WizardStepper` only).
- **Non-goals**: Restyling workflow canvas, modals chrome, table inline cells, or code payload editors; changing validation rules, persistence, or compiled JSON shape.
