## Context

See `proposal.md` for why. Today `App.jsx` renders Admin → Business → Workflow → blocks on one page. A global `submitted` flag stays false until **צור פרומפט לאפיון**; then `validateSpec` + `wf.issues` drive the checkpoint modal, chips, and field rings. `goToIssue` only scrolls (and switches workflow tab). Draft is `{ admin, business, workflows, blocks, flow? }`.

This change adds a wizard shell around that same tree. Validators, `compileSpec`, and `ai-review.md` stay put.

## Goals / Non-Goals

**Goals:**
- One visible step at a time, with a teal RTL stepper.
- Filter the existing `Issue[]` by scope to gate **הבא**; keep generate as a full-form check on step 3.
- Replace the single `submitted` flag with per-step “attempted” so earlier steps can show errors before generate.
- Persist wizard cursor in the draft without bumping export `schemaVersion`.

**Non-Goals:**
- New rules, new issue codes, or a second validation module.
- Keeping the workflow canvas mounted while on other steps (unmount when leaving step 2; `useWorkflows` in `App` already owns the graph data).
- Changing LockedSection numbering or HTTP/canvas internals.

## Decisions

### 1. Wizard state in `App.jsx`, not a store

`wizardStep` (`1|2|3`) and `wizardMaxReached` (`1|2|3`, always ≥ step). Next success does `step + 1` and `maxReached = max(maxReached, step + 1)`. Stepper click allowed iff `target <= wizardMaxReached`.

**Alternative:** URL hash (`#step=2`). Rejected — the app has no router and drafts already live in localStorage.

### 2. Per-step attempted flags, not a new validator

Map scopes → steps:

| Step | Scopes |
|---|---|
| 1 | `admin`, `business` |
| 2 | `workflow` |
| 3 | `block` |

`shown` (chips/rings) for a step becomes true after that step’s **הבא** fails or, on step 3, after generate — same “silent until first attempt” idea, split per step. Asterisks stay always-on.

**הבא** blocks only on `severity === 'error'` for that step’s scopes. Warnings pass.

**Alternative:** open `ValidationModal` on Next. Rejected — the modal is the generate checkpoint; inline field errors on the step the PM is already looking at are enough.

### 3. Already-reached steps stay clickable even if an earlier step is now invalid

Skip-ahead (never-reached) is blocked. Going back and breaking step 1 does **not** lock step 3. Generate still runs the full list, so export cannot sneak past those errors.

**Alternative:** re-validate all previous steps on every stepper click. Rejected — fights “go back and peek”, and generate is already the hard gate.

### 4. Unmount the canvas off step 2

Render `WorkflowSection` only when `wizardStep === 2`. Graph state stays in `useWorkflows` (App). Remounting remeasures handles; hiding with `display:none` / `visibility` is how React Flow goes blank (same class of bug as a hidden browser pane). Keep merge-not-replace, `useUpdateNodeInternals`, and the portaled palette as they are.

### 5. Bottom bar swaps by step

Steps 1–2: **הקודם** (hidden on 1) + **הבא**. Step 3: **הקודם** + existing generate button. No generate on 1–2.

`goToIssue`: set `wizardStep` from `item.scope` (`admin`/`business` → 1, `workflow` → 2, `block` → 3), then the existing scroll/`selectNode` logic. If that step was not reached yet (should not happen on generate-from-3), also bump `wizardMaxReached`.

### 6. Draft field `wizard` — sanitize, don’t drop

Persist `{ step, maxReached }` next to `admin`/`business`/…. On load: clamp to 1–3, coerce missing/NaN to 1, force `maxReached >= step`. Keep unknown sibling keys. Reset removes the whole draft key (today’s behaviour) and local state returns to step 1.

Do **not** put this on the compiled spec. `schemaVersion` stays 4.

### 7. Stepper visuals

Prefer a maintained stepper/wizard library (RTL + dark) over custom-drawn dots. Ask before adding the package. Wire it to existing wizard state (`wizardStep` / `wizardMaxReached`). הקודם/הבא can stay ordinary buttons.

Word-to-Markdown CTA stays on step 1 under the page title (current placement).

## Risks / Trade-offs

- **[Risk]** Canvas remount on each visit to step 2 → brief blank then layout. **Mitigation:** expected; data is not in RF state. Verify in a *visible* browser pane.
- **[Risk]** PM reaches step 3, breaks step 1, clicks generate, gets dumped back to step 1 via the modal. **Mitigation:** intended; copy in the modal already lists the issue.
- **[Risk]** `wizard` in localStorage is ignored by older deploys. **Mitigation:** extra key is cheap; old code keeps the rest of the draft.
- **[Trade-off]** Unmounting step 1/3 DOM loses in-progress focus, not data (React state in App). Acceptable for a wizard.

## Migration Plan

- Load: missing `wizard` → `{ step: 1, maxReached: 1 }`. No bulk migration.
- Rollback: remove the wizard UI; leftover `wizard` key in drafts is ignored. Keep `flow?` as today.

## Open Questions

None. Skip-ahead, generate-on-last, and per-step error gates were decided with the PM.
