## 1. Draft wizard cursor

- [x] 1.1 Add a small sanitize helper (e.g. `src/lib.js`) that reads `{ step, maxReached }` from a draft `wizard` object: clamp both to 1–3, default missing/NaN to 1, force `maxReached >= step`. Verify by reading the function: invalid input `{ step: 9, maxReached: "x" }` becomes `{ step: 1, maxReached: 1 }`, `{ step: 2, maxReached: 1 }` becomes `{ step: 2, maxReached: 2 }`.
- [x] 1.2 Load and persist `wizard` in `App.jsx` with the existing 600ms draft save. Missing key → step 1 / maxReached 1. Keep unknown sibling keys (`flow` included). Reset still `removeItem`s the draft key and returns local wizard state to 1. Verify: fill admin, go to the debugger and confirm `JSON.parse(localStorage.getItem("glassix-spec-builder:draft:v1")).wizard` exists after save; reset clears it and the UI is step 1.

## 2. Stepper and nav chrome

- [x] 2.1 Add `src/components/WizardStepper.jsx`: three Hebrew labels, RTL, teal nodes + connecting line, current step has an outer ring, unreached steps are muted and not clickable, reached steps call `onSelect`. Logical CSS (`ps`/`pe`) and dark counterparts. Verify in the browser at `/`: stepper sits under the sticky header, ring is on step 1, clicking step 3 does nothing.
- [x] 2.2 Add a bottom bar: **הקודם** (hidden on step 1) + **הבא** on steps 1–2; **הקודם** + existing **צור פרומפט לאפיון** on step 3. Reuse `GhostButton` / the current generate button styles. Verify: generate is absent on steps 1–2 and present on step 3 (temporarily allow advancing without validation if 2.2 is done before 3.x).

## 3. One step on screen

- [x] 3.1 In `App.jsx`, render only step-1 sections (Admin + Business + the Word CTA under the title) when `wizardStep === 1`. Verify: step 1 shows those two locked sections and no canvas / no blocks.
- [x] 3.2 Render `WorkflowSection` only when `wizardStep === 2` (unmount off-step; do not `display:none`). Graph data stays in `useWorkflows`. Verify in a **visible** browser pane: step 2 shows the canvas with edges meeting handles; nodes are not `visibility:hidden`.
- [x] 3.3 Render the technical-blocks list + `AddBlockPopover` only when `wizardStep === 3`. Verify: add-block and existing blocks appear only on step 3.

## 4. Per-step validation gates

- [x] 4.1 Replace the single `submitted` flag with per-step attempted flags. Chips/rings/inline errors for a step appear only after that step was attempted (Next failed, or generate on step 3). Asterisks stay always-on. Filter `allIssues` by scope: step 1 = `admin`+`business`, step 2 = `workflow`, step 3 = `block`. Verify: on a blank draft, step 1 fields have asterisks but no red rings until Next.
- [x] 4.2 **הבא** on step 1: if that step has any `error`, stay, mark step 1 attempted, show field errors; warnings do not block. On success, `wizardStep = 2` and `wizardMaxReached = max(maxReached, 2)`. Verify: empty client name → stay on step 1 with the existing error; fill required admin+business → land on step 2.
- [x] 4.3 **הבא** on step 2: same gate using workflow errors only. **הקודם** never validates. Verify: unnamed workflow with no trigger stays on step 2 after Next; Back returns to step 1; stepper still cannot open step 3 until Next from 2 succeeds.
- [x] 4.4 After reaching step 3, stepper clicks to 1 or 2 work even if those steps later have errors. Next from a now-invalid earlier step still blocks. Verify: reach 3, go back, clear client name, click step 3 → still opens step 3; from step 1 press Next → blocked.

## 5. Generate and issue jump

- [x] 5.1 Keep `generate` / `generateAnyway` / `ValidationModal` / `ExportModal` behaviour, but only fire generate from step 3. Full `allIssues` still drives the checkpoint. Verify: step 3 with leftover admin errors opens the existing modal; **generate anyway** still compiles; a clean form opens export. Confirm compiled JSON has no `wizard` field and `schemaVersion` is still 4.
- [x] 5.2 `goToIssue`: map `admin`/`business` → step 1, `workflow` → step 2, `block` → step 3, bump `wizardMaxReached` if needed, then existing scroll / `selectNode`. Verify: from the checkpoint, a workflow issue closes the modal, shows step 2, and selects/scrolls the node; a block issue shows step 3 at that block.

## 6. Lint, build, walkthrough

- [x] 6.1 Run `npm run lint` and `npm run build` and fix any new issues this change introduced (leave the pre-existing unused `Check` import in `WorkflowValidationSummary.jsx` if still unused). Verify both commands exit 0.
- [x] 6.2 Browser walkthrough (visible pane): new draft → step 1 Next blocked → fill admin+business → step 2 canvas draws → Next blocked on workflow errors → fill name/trigger → step 3 → generate hidden on 1–2, shown on 3 → reload stays on step 3 → reset returns to step 1. Dark mode stepper still readable.
