## Why

The PM (a Hebrew-speaking non-developer) currently fills the whole spec on one long page: administrative context, business goal, workflow canvas, and technical blocks stacked together. That is noisy, easy to miss, and fights the natural order of the work. The manager asked to split the authoring UI into three screens so each concern is filled on its own, without changing what the app compiles or how the PM still exports JSON + `ai-review.md` to an external LLM.

## What Changes

- Replace the single scrolling page with a three-step wizard:
  1. הקשר אדמיניסטרטיבי + צורך עסקי
  2. תרשים הזרימה only
  3. בלוקים טכניים
- Add a top stepper (teal, RTL) showing progress. The current step has a ring around its dot.
- **הבא** validates the current step with the existing issue list. Errors block advance and paint that step’s fields. Warnings show but do not block.
- **הקודם** always works. The stepper never skips ahead: only the current step and already-reached steps are clickable.
- **צור פרומפט לאפיון** appears only on step 3. Generate still uses the full issue list (errors block; `generateAnyway` still exports over leftover issues). Clicking an issue jumps to that step and scrolls to the field.
- Draft save, reset, theme, Word conversion, and export JSON stay as they are. Wizard position is UI state (persisted in the draft so a reload does not dump the PM back to step 1).

## Non-goals

- No new validation rules, severities, or a second validator. Reuse `src/validation/` and `src/workflow/validation.js`.
- No change to `compileSpec`, `schemaVersion`, or `src/prompts/ai-review.md`.
- Needed libraries/tools: ask first, then use them. Do not ship a worse homemade substitute.
- No new block types (including the iframe demo).
- No change to workflow node types, canvas graph behaviour, or HTTP block internals beyond being shown only on their step.

## Capabilities

### New Capabilities

- `authoring-wizard`: three-step authoring shell, stepper navigation, per-step advance gates, generate only on the last step.

### Modified Capabilities

- None. There are no main specs yet.

## Impact

- `src/App.jsx` (layout, generate footer, `submitted` gating, `goToIssue`)
- New stepper + step-nav UI under `src/components/`
- Draft key `glassix-spec-builder:draft:v1` gains an optional wizard-position field (sanitize on load; missing = step 1)
- `ValidationModal` navigation must switch wizard step
- Workflow canvas still mounts only when step 2 is shown; hidden-pane measurement rules still apply
- A stepper library is preferred over a custom-drawn stepper if restyling this UI.
