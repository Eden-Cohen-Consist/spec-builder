# Required-Field Markers and Pre-Generate Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mark required fields with a red `*` at rest, and replace the three sequential ad-hoc checks in `generate()` with a single validation pass that reports every problem at once through a checkpoint modal.

**Architecture:** A new `src/validation/` module mirrors the existing `src/workflow/validation.js` — imperative rule functions returning a flat `Issue[]` with `error`/`warning` severity. `App.jsx` memoises those issues, concatenates the workflow issues, and derives everything downstream from that one list: a checkpoint modal, per-block status chips, and per-field red rings. A single `submitted` flag keeps the whole form visually silent until the PM presses generate for the first time.

**Tech Stack:** Plain JavaScript React (`.jsx`), Vite 8, Tailwind CSS v4, `lucide-react` icons. Source spec: `docs/superpowers/specs/2026-07-29-block-required-fields-validation-design.md`.

## Global Constraints

- **No test runner exists and none may be added** (`CLAUDE.md`). Every task is verified with `npm run lint`, `npm run build`, and a specific browser check against `npm run dev`. Do not add Vitest, Jest, or any test file.
- **No TypeScript.** Types are JSDoc `@typedef` blocks next to their factory functions, as in `src/workflow/model.js`.
- **No new dependencies.**
- **RTL Hebrew UI.** All user-facing copy is Hebrew. `dir="rtl"` is set globally; use logical properties (`start`/`end`, `ms-`/`me-`, `ps-`/`pe-`) never `left`/`right`.
- **Dark mode** via a `.dark` class on `<html>`. Every colour utility needs a `dark:` counterpart.
- **Reuse the primitives in `src/components/ui.jsx`** (`Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `GhostButton`, `DeleteButton`). Do not hand-roll form controls.
- **Do not change `compileSpec` output or `src/prompts/ai-review.md`.** This work gates *when* a spec is produced, never *what* it contains. The one exception is noted in Task 5 and is a bug fix, not a shape change.
- **Tailwind class-order hazard:** Tailwind utilities of equal specificity resolve by their order *in the generated stylesheet*, not by their order in the `class` string. Never append `border-red-300` after `border-stone-200` and expect it to win. Task 3 restructures `inputBase` to select one variant or the other instead of layering them.
- Commit after every task with the exact message given in that task's final step.

---

### Task 1: The validation module

**Files:**
- Create: `src/validation/issue.js`
- Create: `src/validation/rules.js`
- Create: `src/validation/index.js`
- Modify: `src/workflow/validation.js:112-119`

**Interfaces:**
- Consumes: `hasContactContent`, `isThirdParty` from `src/lib.js`.
- Produces:
  - `makeIssue(severity, scope, code, message, extra?) -> Issue`
  - `withUniqueIds(Issue[]) -> Issue[]`
  - `fieldKey(field, rowId?) -> string`
  - `countIssues(Issue[]) -> { errors: number, warnings: number }`
  - `isBlockEmpty(block) -> boolean`
  - `validateAdmin(admin) -> Issue[]`, `validateBusiness(business) -> Issue[]`, `validateBlock(block) -> Issue[]`
  - `validateSpec({ admin, business, blocks }) -> Issue[]`
  - `fieldErrors(Issue[]) -> Map<string, string>` — error messages only, keyed by `fieldKey`

- [ ] **Step 1: Create `src/validation/issue.js`**

```js
/**
 * One issue shape for every source in the app. This is the shape
 * src/workflow/validation.js already emits, plus `scope`, `blockId`, `field` and `rowId`,
 * so form issues and graph issues can render through one code path.
 *
 * @typedef {Object} Issue
 * @property {string} id
 * @property {'admin'|'business'|'block'|'workflow'} scope
 * @property {string} code
 * @property {string} message
 * @property {'error'|'warning'} severity
 * @property {string} [blockId]
 * @property {string} [field]   - which control the issue points at
 * @property {string} [rowId]   - the row, when the field is a collection
 * @property {string} [workflowId]
 * @property {string} [nodeId]
 * @property {string} [edgeId]
 */

export const makeIssue = (severity, scope, code, message, extra = {}) => ({
  id: `${scope}:${code}:${extra.blockId ?? ''}:${extra.field ?? ''}:${extra.rowId ?? ''}`,
  scope,
  code,
  message,
  severity,
  ...extra,
})

/** Repeated codes on one block would collide as React keys — suffix by position. */
export const withUniqueIds = (issues) =>
  issues.map((item, index) => ({ ...item, id: `${item.id}#${index}` }))

/** How a component looks its own error up: plain field, or field#rowId inside a collection. */
export const fieldKey = (field, rowId) => (rowId ? `${field}#${rowId}` : field)

export const countIssues = (issues) => ({
  errors: issues.filter((i) => i.severity === 'error').length,
  warnings: issues.filter((i) => i.severity === 'warning').length,
})
```

- [ ] **Step 2: Create `src/validation/rules.js`**

```js
import { hasContactContent, isThirdParty } from '../lib.js'
import { makeIssue } from './issue.js'

const blank = (value) => !String(value ?? '').trim()

export const validateAdmin = (admin) => {
  const issues = []
  const push = (severity, code, message, extra) =>
    issues.push(makeIssue(severity, 'admin', code, message, extra))

  if (blank(admin.clientName))
    push('error', 'ADMIN_CLIENT_NAME', 'חסר שם הלקוח', { field: 'clientName' })
  if (blank(admin.pmName))
    push('error', 'ADMIN_PM_NAME', 'חסר שם מנהל/ת הפרויקט', { field: 'pmName' })

  const complete = (c) => !blank(c.name) && (!blank(c.email) || !blank(c.phone))
  // Nothing typed at all is one issue about the table; a half-filled row is flagged in the
  // row itself, so the two never fire together and the PM is never told the same thing twice
  if (!admin.contacts.some(hasContactContent)) {
    push('error', 'ADMIN_NO_CONTACT', 'נדרש לפחות איש קשר אחד עם שם ואימייל או טלפון', {
      field: 'contacts',
    })
  } else {
    for (const contact of admin.contacts) {
      if (!hasContactContent(contact) || complete(contact)) continue
      if (blank(contact.name))
        push('error', 'CONTACT_NAME', 'לאיש הקשר חסר שם', {
          field: 'contactName',
          rowId: contact.id,
        })
      if (blank(contact.email) && blank(contact.phone))
        push('error', 'CONTACT_REACH', 'לאיש הקשר חסר אימייל או טלפון', {
          field: 'contactReach',
          rowId: contact.id,
        })
    }
  }

  if (admin.departmentCreated) {
    for (const department of admin.departments) {
      if (blank(department.name))
        push('error', 'DEPARTMENT_NAME', 'למחלקה חסר שם', {
          field: 'departmentName',
          rowId: department.id,
        })
    }
  }

  return issues
}

export const validateBusiness = (business) => {
  const issues = []
  const push = (severity, code, message, extra) =>
    issues.push(makeIssue(severity, 'business', code, message, extra))

  if (blank(business.goal))
    push('error', 'BUSINESS_GOAL', 'חסרה המטרה העסקית', { field: 'goal' })
  if (!business.triggers.some((t) => !blank(t.text)))
    push('error', 'BUSINESS_NO_TRIGGER', 'נדרש לפחות טריגר אחד', { field: 'triggers' })

  return issues
}

/**
 * A block the PM has not touched yet must stay neutral, so this deliberately ignores the
 * defaults makeBlock() hands out (`method: 'GET'`, `authType: 'None'`, one blank mapping row,
 * two blank table columns) and looks only at what a person could have typed.
 */
export const isBlockEmpty = (block) => {
  switch (block.type) {
    case 'http':
      return (
        [
          block.title,
          block.source,
          block.destination,
          block.endpoint,
          block.requestPayload,
          block.responsePayload,
          block.whitelistedIps,
          block.certificateDetails,
          block.fallback,
        ].every(blank) &&
        !block.ipWhitelistRequired &&
        !block.certificateRequired &&
        block.headers.every((h) => blank(h.key) && blank(h.value)) &&
        block.mapping.every(
          (r) => blank(r.sourceField) && blank(r.targetField) && blank(r.notes),
        )
      )
    case 'freeText':
      return blank(block.title) && blank(block.text)
    case 'testData':
      return block.rows.every((r) => blank(r.key) && blank(r.value) && blank(r.notes))
    case 'table':
      return (
        blank(block.name) &&
        blank(block.freeText) &&
        block.columns.every((c) => blank(c.label)) &&
        block.rows.every((r) => Object.values(r.cells ?? {}).every(blank))
      )
    default:
      return true
  }
}

export const validateBlock = (block) => {
  const issues = []
  const push = (severity, code, message, extra = {}) =>
    issues.push(makeIssue(severity, 'block', code, message, { blockId: block.id, ...extra }))

  // An untouched block gets exactly one warning and no errors: it never blocks the export,
  // but it is not invisible either
  if (isBlockEmpty(block)) {
    push('warning', 'EMPTY_BLOCK', 'בלוק ריק — מלאו אותו או מחקו')
    return issues
  }

  switch (block.type) {
    case 'http': {
      if (blank(block.title))
        push('error', 'HTTP_TITLE', 'חסרה כותרת הבלוק', { field: 'title' })
      if (blank(block.source))
        push('error', 'HTTP_SOURCE', 'חסרה מערכת מקור', { field: 'source' })
      if (blank(block.destination))
        push('error', 'HTTP_DESTINATION', 'חסרה מערכת יעד', { field: 'destination' })
      if (blank(block.endpoint))
        push('error', 'HTTP_ENDPOINT', 'חסר Endpoint', { field: 'endpoint' })

      if (isThirdParty(block.destination)) {
        if (blank(block.requestPayload))
          push('error', 'HTTP_REQUEST_PAYLOAD', 'חסר Request Payload — נדרש מול צד שלישי', {
            field: 'requestPayload',
          })
        if (blank(block.responsePayload))
          push('error', 'HTTP_RESPONSE_PAYLOAD', 'חסר Response Payload — נדרש מול צד שלישי', {
            field: 'responsePayload',
          })
      }

      if (block.ipWhitelistRequired && blank(block.whitelistedIps))
        push('error', 'HTTP_WHITELIST_IPS', 'סומן שנדרשת החרגת IP אך לא הוזנו כתובות', {
          field: 'whitelistedIps',
        })
      if (block.certificateRequired && blank(block.certificateDetails))
        push('error', 'HTTP_CERTIFICATE', 'סומן שנדרשת תעודה אך לא הוזנו פרטים', {
          field: 'certificateDetails',
        })

      if (!block.mapping.some((r) => !blank(r.sourceField) && !blank(r.targetField)))
        push('warning', 'HTTP_NO_MAPPING', 'כדאי למלא לפחות שורת מיפוי שדות אחת', {
          field: 'mapping',
        })
      if (blank(block.fallback))
        push('warning', 'HTTP_NO_FALLBACK', 'כדאי לתאר טיפול בשגיאות', { field: 'fallback' })
      if (block.authType === 'None')
        push('warning', 'HTTP_NO_AUTH', 'לא הוגדר אימות לקריאה', { field: 'authType' })
      break
    }

    case 'freeText':
      if (blank(block.text)) push('error', 'FREETEXT_BODY', 'חסר תיאור', { field: 'text' })
      if (blank(block.title))
        push('warning', 'FREETEXT_TITLE', 'כדאי להוסיף כותרת', { field: 'title' })
      break

    case 'testData':
      if (!block.rows.some((r) => !blank(r.key) && !blank(r.value)))
        push('error', 'TESTDATA_NO_ROW', 'נדרשת לפחות שורה אחת עם שדה וערך', { field: 'rows' })
      break

    case 'table': {
      if (blank(block.name)) push('error', 'TABLE_NAME', 'חסר שם הטבלה', { field: 'name' })
      block.columns.forEach((col, index) => {
        if (blank(col.label))
          push('error', 'TABLE_COLUMN_LABEL', `חסרה תווית לעמודה ${index + 1}`, {
            field: 'columnLabel',
            rowId: col.id,
          })
      })
      if (!block.rows.some((r) => Object.values(r.cells ?? {}).some((v) => !blank(v))))
        push('error', 'TABLE_NO_ROW', 'נדרשת לפחות שורה אחת עם תוכן', { field: 'rows' })
      break
    }
  }

  return issues
}
```

- [ ] **Step 3: Create `src/validation/index.js`**

```js
import { fieldKey, withUniqueIds } from './issue.js'
import { validateAdmin, validateBusiness, validateBlock } from './rules.js'

/**
 * Everything the form can complain about, in one list. Workflow issues are produced
 * separately by validateAllWorkflows and concatenated by App.
 * @returns {import('./issue.js').Issue[]}
 */
export const validateSpec = ({ admin, business, blocks }) =>
  withUniqueIds([
    ...validateAdmin(admin),
    ...validateBusiness(business),
    ...blocks.flatMap(validateBlock),
  ])

/**
 * Field key -> message, errors only. Warnings never paint a control red, so a block can
 * carry advice without any of its inputs looking broken.
 */
export const fieldErrors = (issues) => {
  const map = new Map()
  for (const item of issues) {
    if (item.severity !== 'error' || !item.field) continue
    const key = fieldKey(item.field, item.rowId)
    if (!map.has(key)) map.set(key, item.message)
  }
  return map
}
```

- [ ] **Step 4: Stamp `scope` onto workflow issues**

In `src/workflow/validation.js`, replace the body of `validateAllWorkflows` (currently lines 112-119):

```js
export const validateAllWorkflows = (workflows) => {
  // Suffix the index so repeated codes on one node (e.g. several DECISION issues) stay
  // unique as React keys
  const issues = workflows
    .flatMap((w) => validateWorkflow(w))
    .map((item, index) => ({ ...item, scope: 'workflow', id: `${item.id}#${index}` }))
  return { issues }
}
```

Nothing else in `src/workflow/` changes. `WorkflowValidationSummary` ignores the extra key.

- [ ] **Step 5: Verify with lint and build**

```bash
npm run lint && npm run build
```

Expected: both exit 0, no warnings referencing `src/validation/`.

- [ ] **Step 6: Verify the rules behave, in the browser console**

Start the dev server (`npm run dev`), open the app, and open the browser devtools console. Vite serves the source modules directly, so they can be imported and exercised without any test harness or throwaway code.

```js
const { validateSpec } = await import('/src/validation/index.js')
const { makeBlock, makeContactRow, makeTriggerRow } = await import('/src/lib.js')

const base = {
  admin: { clientName: '', pmName: '', contacts: [makeContactRow()], departmentCreated: false, departments: [] },
  business: { goal: '', triggers: [makeTriggerRow()] },
  blocks: [],
}
const codes = (input) => validateSpec(input).map((i) => `${i.severity} ${i.code}`)

// 1. an empty form
codes(base)
// → ["error ADMIN_CLIENT_NAME","error ADMIN_PM_NAME","error ADMIN_NO_CONTACT",
//    "error BUSINESS_GOAL","error BUSINESS_NO_TRIGGER"]

// 2. a brand-new block is neutral — one warning, zero errors
codes({ ...base, blocks: [makeBlock('http')] }).filter((c) => !c.includes('ADMIN') && !c.includes('BUSINESS'))
// → ["warning EMPTY_BLOCK"]

// 3. touching the destination wakes the block up, and a 3rd party demands both payloads
codes({ ...base, blocks: [{ ...makeBlock('http'), destination: 'Salesforce' }] })
  .filter((c) => c.includes('HTTP'))
// → ["error HTTP_TITLE","error HTTP_SOURCE","error HTTP_ENDPOINT",
//    "error HTTP_REQUEST_PAYLOAD","error HTTP_RESPONSE_PAYLOAD",
//    "warning HTTP_NO_MAPPING","warning HTTP_NO_FALLBACK","warning HTTP_NO_AUTH"]

// 4. an internal destination drops the payload requirement
codes({ ...base, blocks: [{ ...makeBlock('http'), destination: 'Glassix' }] })
  .filter((c) => c.includes('PAYLOAD'))
// → []
```

Each result must match exactly. If case 2 returns errors, `isBlockEmpty` is consulting a `makeBlock` default it should be ignoring.

- [ ] **Step 7: Commit**

```bash
git add src/validation src/workflow/validation.js
git commit -m "feat(validation): add form validation rules module"
```

---

### Task 2: The checkpoint modal and the generate gate

After this task the feature works end to end — every problem in the form is reported in one dialog — even though no asterisks, chips or field rings exist yet.

**Files:**
- Create: `src/components/ValidationModal.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/BusinessSection.jsx:18-22` (add the missing anchor id)

**Interfaces:**
- Consumes: `validateSpec`, `fieldErrors` from `src/validation/index.js`; `countIssues` from `src/validation/issue.js`.
- Produces: `App` state `submitted` (boolean) and the derived `blockIssues: Map<blockId, Issue[]>`, `adminIssues`, `businessIssues`, `errorCount` used by Tasks 3-6. `ValidationModal` props: `{ issues, blocks, onClose, onGenerateAnyway, onNavigate }`.

- [ ] **Step 1: Give section 2 an anchor id**

`BusinessSection`'s `LockedSection` has no `id`, so `#section-business` does not exist and modal navigation to it would silently do nothing. In `src/components/BusinessSection.jsx`, change the opening tag:

```jsx
    <LockedSection
      id="section-business"
      number="2"
      title="צורך עסקי וטריגר"
      subtitle="למה בונים את זה, ומה מפעיל את התהליך"
      delay={delay}
    >
```

- [ ] **Step 2: Create `src/components/ValidationModal.jsx`**

```jsx
import { useEffect } from "react";
import { ClipboardCheck, X, CircleAlert, TriangleAlert, ArrowLeft } from "lucide-react";
import { BLOCK_META } from "../constants.js";
import { countIssues } from "../validation/issue.js";

const SECTION_GROUPS = [
  { key: "admin", label: "סעיף 1 · הקשר אדמיניסטרטיבי" },
  { key: "business", label: "סעיף 2 · צורך עסקי וטריגר" },
  { key: "workflow", label: "סעיף 3 · תהליכים עסקיים" },
];

// Errors before warnings inside every group, so the blocking problems are always read first
const bySeverity = (a, b) =>
  a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1;

const blockLabel = (block) =>
  block.title?.trim() || block.name?.trim() || BLOCK_META[block.type].title;

/**
 * The checkpoint between pressing "צור פרומפט" and the export. Only ever rendered when
 * there is something to report — a clean form goes straight to ExportModal.
 */
export default function ValidationModal({
  issues,
  blocks,
  onClose,
  onGenerateAnyway,
  onNavigate,
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const { errors, warnings } = countIssues(issues);

  const groups = [
    ...SECTION_GROUPS.map(({ key, label }) => ({
      key,
      label,
      items: issues.filter((i) => i.scope === key).sort(bySeverity),
    })),
    ...blocks.map((block) => ({
      key: block.id,
      label: blockLabel(block),
      items: issues.filter((i) => i.blockId === block.id).sort(bySeverity),
    })),
  ].filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="animate-fade absolute inset-0 bg-stone-950/40 backdrop-blur-[3px] dark:bg-stone-950/60"
        onClick={onClose}
      />
      <div className="animate-pop relative flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-900/25 dark:bg-stone-900 dark:ring-1 dark:ring-stone-700/60">
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-6 py-4 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-teal-700/8 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              <ClipboardCheck className="size-[18px]" />
            </span>
            <div>
              <h2 className="font-display text-[19px] font-bold leading-tight text-ink">
                בדיקה לפני יצירת האפיון
              </h2>
              <p className="mt-0.5 text-[12.5px] text-stone-500 dark:text-stone-400">
                {errors > 0 && `${errors} שגיאות`}
                {errors > 0 && warnings > 0 && " · "}
                {warnings > 0 && `${warnings} המלצות`}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="סגירה"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-500 dark:hover:bg-stone-800"
          >
            <X className="size-4.5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {groups.map((group) => (
            <div key={group.key} className="mb-3 last:mb-0">
              <div className="px-2.5 pb-1 text-[11px] font-extrabold tracking-wide text-stone-400 dark:text-stone-500">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item)}
                      className="group/row flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-start text-[13px] transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/60"
                    >
                      {item.severity === "error" ? (
                        <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-red-500 dark:text-red-400" />
                      ) : (
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      )}
                      <span className="text-stone-600 dark:text-stone-300">
                        {item.message}
                      </span>
                      <ArrowLeft className="ms-auto mt-0.5 size-3.5 shrink-0 text-teal-700 opacity-0 transition-opacity group-hover/row:opacity-100 dark:text-teal-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-4 dark:border-stone-800 dark:bg-stone-950/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-ink dark:text-stone-400 dark:hover:bg-stone-800"
          >
            חזרה לתיקון
          </button>
          <button
            type="button"
            disabled={errors > 0}
            onClick={onGenerateAnyway}
            className="rounded-xl bg-teal-700 px-4 py-2.5 text-[14px] font-bold text-white transition-all hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-700/30 disabled:hover:bg-teal-700/30"
          >
            צור בכל זאת
          </button>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire the issues into `App.jsx`**

Add to the imports at the top of `src/App.jsx`:

```js
import { useState, useEffect, useMemo } from "react";
```

and alongside the other component imports:

```js
import ValidationModal from "./components/ValidationModal.jsx";
import { validateSpec, fieldErrors } from "./validation/index.js";
import { countIssues } from "./validation/issue.js";
```

Delete the `invalidIds` and `adminInvalid` state declarations (currently `src/App.jsx:163-164`) and add in their place:

```js
  // Flipped by the first generate press. Every red/amber/green affordance is gated on it,
  // so the form stays silent while the PM is still filling it in.
  const [submitted, setSubmitted] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
```

Then, immediately after the `dark` state declaration, add the derived values:

```js
  const formIssues = useMemo(
    () => validateSpec({ admin, business, blocks }),
    [admin, business, blocks],
  );
  const allIssues = useMemo(
    () => [...formIssues, ...wf.issues],
    [formIssues, wf.issues],
  );
  const errorCount = useMemo(
    () => countIssues(allIssues).errors,
    [allIssues],
  );

  // Empty until `submitted`, which is what keeps the UI silent — every consumer below
  // reads these and therefore needs no flag of its own
  const shown = useMemo(() => {
    const result = { admin: [], business: [], blocks: new Map() };
    if (!submitted) return result;
    for (const item of formIssues) {
      if (item.scope === "admin") result.admin.push(item);
      else if (item.scope === "business") result.business.push(item);
      else if (item.blockId) {
        if (!result.blocks.has(item.blockId)) result.blocks.set(item.blockId, []);
        result.blocks.get(item.blockId).push(item);
      }
    }
    return result;
  }, [formIssues, submitted]);
```

- [ ] **Step 4: Rewrite `generate()` and `resetDraft()`, and drop the stale bookkeeping**

Replace `generate` (currently `src/App.jsx:240-290`) in its entirety with:

```js
  const generate = () => {
    setSubmitted(true);
    if (allIssues.length > 0) {
      setCheckOpen(true);
      return;
    }
    setSpec(compileSpec({ admin, business, workflows: wf.workflows, blocks }));
  };

  const generateAnyway = () => {
    setCheckOpen(false);
    setSpec(compileSpec({ admin, business, workflows: wf.workflows, blocks }));
  };

  const goToIssue = (item) => {
    setCheckOpen(false);
    if (item.scope === "workflow") {
      wf.setActiveWorkflowId(item.workflowId);
      if (item.nodeId) wf.selectNode(item.nodeId);
    }
    const anchor =
      item.scope === "admin"
        ? "section-admin"
        : item.scope === "business"
          ? "section-business"
          : item.scope === "workflow"
            ? "section-workflows"
            : `block-${item.blockId}`;
    // Wait a frame so the section has re-rendered (and the workflow tab switched) before scrolling
    requestAnimationFrame(() =>
      document
        .getElementById(anchor)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };
```

In `resetDraft`, replace the two lines `setInvalidIds(new Set());` and `setAdminInvalid(false);` with:

```js
    setSubmitted(false);
    setCheckOpen(false);
```

Delete the `changeAdmin` function entirely and pass `setAdmin` directly to `AdminSection` in Step 5.

Simplify `updateBlock` to drop the highlight bookkeeping:

```js
  const updateBlock = (id, patch) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
```

- [ ] **Step 5: Pass the derived issues down and render the modal**

Update the three section elements in the JSX:

```jsx
          <AdminSection
            value={admin}
            onChange={setAdmin}
            issues={shown.admin}
            delay={60}
          />
          <BusinessSection
            value={business}
            onChange={setBusiness}
            issues={shown.business}
            delay={120}
          />
          <WorkflowSection
            api={wf}
            blocks={blocks}
            dark={dark}
            submitted={submitted}
            delay={180}
          />
```

`AdminSection` and `BusinessSection` ignore the new `issues` prop until Task 4, and `WorkflowSection` ignores `submitted` until Task 3. Passing them now keeps `App.jsx` untouched by those tasks.

Note one intentional interim gap: `AdminSection` still reads an `invalid` prop that is no longer passed, so its contact-cell rings go dark between this task and Task 4. The modal reports those same problems in full throughout, and Task 4 restores the rings from the issue list. Do not patch it here — the prop is being deleted, not repaired.

Update the block list to pass each block's issues:

```jsx
          {blocks.map((block) => (
            <DynamicBlock
              key={block.id}
              block={block}
              issues={shown.blocks.get(block.id) ?? []}
              onDelete={() => deleteBlock(block.id)}
            >
              {renderBlockBody(block)}
            </DynamicBlock>
          ))}
```

Replace the `invalid` prop passed to `HttpBlock` inside `renderBlockBody` so the payload rings do not regress while Task 5 is still pending:

```jsx
      case "http":
        return (
          <HttpBlock
            block={block}
            invalid={(shown.blocks.get(block.id) ?? []).some(
              (i) => i.severity === "error",
            )}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        );
```

Change the footer button's `className` so it mutes once errors exist, while staying enabled — it is the only way to reopen the modal:

```jsx
          <button
            type="button"
            onClick={generate}
            className={`group pointer-events-auto inline-flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-[16px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
              submitted && errorCount > 0
                ? "bg-teal-700/45 shadow-md shadow-teal-700/10 hover:bg-teal-700/60"
                : "bg-teal-700 shadow-lg shadow-teal-700/25 hover:bg-teal-800 hover:shadow-xl hover:shadow-teal-700/30"
            }`}
          >
            <Sparkles className="size-[18px] transition-transform duration-200 group-hover:rotate-12" />
            צור פרומפט לאפיון
          </button>
```

Finally add the modal next to the existing `{spec && <ExportModal … />}` line:

```jsx
      {checkOpen && (
        <ValidationModal
          issues={allIssues}
          blocks={blocks}
          onClose={() => setCheckOpen(false)}
          onGenerateAnyway={generateAnyway}
          onNavigate={goToIssue}
        />
      )}
```

- [ ] **Step 6: Remove the now-unused imports**

`AlertTriangle` and `CheckCircle2` are still used by the toast, and `isThirdParty` / `hasContactContent` are no longer referenced by `App.jsx` — the rules module owns them now. Update the import from `./lib.js` to drop `hasContactContent` and `isThirdParty`, keeping `makeBlock`, `makeContactRow`, `makeDepartmentRow`, `makeTriggerRow` and `compileSpec`. `npm run lint` in the next step will catch it if anything else became unused.

- [ ] **Step 7: Verify with lint and build**

```bash
npm run lint && npm run build
```

Expected: both exit 0. Any "unused variable" error names a leftover from Step 4 or Step 6 — delete it.

- [ ] **Step 8: Verify the gate in the browser**

With `npm run dev` running:

1. Load the app with an empty draft and press **צור פרומפט לאפיון**. Expected: the checkpoint modal opens listing at least `חסר שם הלקוח`, `חסר שם מנהל/ת הפרויקט`, `נדרש לפחות איש קשר אחד…`, `חסרה המטרה העסקית`, `נדרש לפחות טריגר אחד`, grouped under סעיף 1 and סעיף 2. `צור בכל זאת` is greyed out.
2. Click the `חסרה המטרה העסקית` row. Expected: the modal closes and the page scrolls to section 2. (Before Step 1 this row would have done nothing.)
3. Fill in every required field, add no blocks, and press generate again. Expected: `ExportModal` opens directly with no checkpoint.
4. Add an HTTP block and press generate. Expected: the checkpoint opens with one warning, `בלוק ריק — מלאו אותו או מחקו`, and `צור בכל זאת` is now **enabled**. Click it — `ExportModal` opens.
5. Press `Escape` and click the backdrop. Expected: both close the modal.
6. The footer button renders muted teal whenever the modal has reported an error, and full teal once they are fixed.

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/components/ValidationModal.jsx src/components/BusinessSection.jsx
git commit -m "feat(validation): gate generate behind a checkpoint modal"
```

---

### Task 3: Status badges on blocks and sections

**Files:**
- Create: `src/components/BlockStatusChip.jsx`
- Modify: `src/components/DynamicBlock.jsx`
- Modify: `src/components/LockedSection.jsx`
- Modify: `src/components/workflow/WorkflowSection.jsx:35-41`

**Interfaces:**
- Consumes: the `issues` prop `App.jsx` now passes to `DynamicBlock`, and `submitted` passed to `WorkflowSection` (both added in Task 2); `countIssues` from `src/validation/issue.js`.
- Produces: `BlockStatusChip({ issues })`. `LockedSection` gains optional props `issues` (default `[]`) and `submitted` (default `false`).

- [ ] **Step 1: Create `src/components/BlockStatusChip.jsx`**

```jsx
import { CircleAlert, TriangleAlert, Check } from "lucide-react";
import { countIssues } from "../validation/issue.js";

const shell =
  "animate-pop inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-bold";

/** The ambient signal that a block still needs work. Callers render it only after submit. */
export default function BlockStatusChip({ issues }) {
  const { errors, warnings } = countIssues(issues);

  if (errors > 0)
    return (
      <span
        className={`${shell} border-red-200 bg-red-50 text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-400`}
      >
        <CircleAlert className="size-3" />
        {errors === 1 ? "חסר שדה חובה אחד" : `חסרים ${errors} שדות חובה`}
      </span>
    );

  if (warnings > 0)
    return (
      <span
        className={`${shell} border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400`}
      >
        <TriangleAlert className="size-3" />
        {warnings === 1 ? "המלצה אחת" : `${warnings} המלצות`}
      </span>
    );

  return (
    <span
      className={`${shell} border-teal-600/25 bg-teal-50 text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-400`}
    >
      <Check className="size-3" strokeWidth={3} />
      מלא
    </span>
  );
}
```

- [ ] **Step 2: Render the chip in `DynamicBlock`**

Replace `src/components/DynamicBlock.jsx` in full:

```jsx
import { Trash2 } from "lucide-react";
import { BLOCK_META } from "../constants.js";
import BlockStatusChip from "./BlockStatusChip.jsx";

export default function DynamicBlock({
  block,
  issues = [],
  submitted = false,
  onDelete,
  children,
}) {
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;
  // App passes an empty list until the first generate press, so this is false while the PM works
  const invalid = issues.some((i) => i.severity === "error");

  return (
    <section
      id={`block-${block.id}`}
      className={`group/block animate-block-in relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 dark:bg-stone-900 dark:shadow-none ${
        invalid
          ? "border-red-300 shadow-[0_1px_3px_rgba(220,38,38,0.08)] ring-[3px] ring-red-500/10 dark:border-red-900"
          : "border-stone-200 shadow-[0_1px_3px_rgba(28,25,23,0.04),0_10px_28px_-16px_rgba(28,25,23,0.1)] hover:shadow-[0_1px_3px_rgba(28,25,23,0.05),0_14px_36px_-16px_rgba(28,25,23,0.14)] dark:border-stone-800"
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-[3px]"
        style={{ background: invalid ? "#dc2626" : meta.accent }}
      />
      <header className="flex items-center justify-between gap-3 px-6 pb-4 pt-5">
        <div className="flex items-center gap-3.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-(--accent) dark:text-(--accent-dark)"
            style={{ background: meta.tint, "--accent": meta.accent, "--accent-dark": meta.accentDark }}
          >
            <Icon className="size-[18px]" />
          </span>
          <div>
            <h3 className="text-[16px] font-bold leading-tight text-ink">
              {block.type === "http" && block.title?.trim() ? block.title : meta.title}
            </h3>
            <p className="mt-0.5 text-[12.5px] text-stone-500 dark:text-stone-400">{meta.subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {submitted ? <BlockStatusChip issues={issues} /> : null}
          <button
            type="button"
            aria-label="מחיקת בלוק"
            onClick={onDelete}
            className="rounded-lg p-2 text-stone-300 opacity-0 transition-all duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover/block:opacity-100 dark:text-stone-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </header>
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}
```

The chip is gated on `submitted` rather than on `issues.length`, because a clean block and a pre-submit block both have an empty issue list — without the explicit flag the `✓ מלא` chip could never appear.

- [ ] **Step 3: Pass `submitted` to `DynamicBlock` from `App.jsx`**

```jsx
            <DynamicBlock
              key={block.id}
              block={block}
              issues={shown.blocks.get(block.id) ?? []}
              submitted={submitted}
              onDelete={() => deleteBlock(block.id)}
            >
```

- [ ] **Step 4: Turn the `LockedSection` badge into a status badge after submit**

Replace `src/components/LockedSection.jsx` in full:

```jsx
import { Lock, CircleAlert, Check } from "lucide-react";
import { countIssues } from "../validation/issue.js";

const badgeShell =
  "mt-1 inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold";

/**
 * Before the first generate press the badge states that the section is mandatory; after it,
 * the same slot carries the section's status, so the header never grows a second badge.
 */
function SectionBadge({ issues, submitted }) {
  if (!submitted)
    return (
      <span
        className={`${badgeShell} border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400`}
      >
        חובה
        <Lock className="size-3" />
      </span>
    );

  const { errors } = countIssues(issues);
  if (errors > 0)
    return (
      <span
        className={`${badgeShell} animate-pop border-red-200 bg-red-50 text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-400`}
      >
        {errors === 1 ? "חסר שדה אחד" : `${errors} חסרים`}
        <CircleAlert className="size-3" />
      </span>
    );

  return (
    <span
      className={`${badgeShell} animate-pop border-teal-600/25 bg-teal-50 text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-400`}
    >
      מלא
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}

export default function LockedSection({
  id,
  number,
  title,
  subtitle,
  issues = [],
  submitted = false,
  delay = 0,
  children,
}) {
  return (
    <section
      id={id}
      className="animate-rise rounded-2xl border border-stone-200 bg-white shadow-[0_1px_3px_rgba(28,25,23,0.04),0_10px_28px_-16px_rgba(28,25,23,0.1)] transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(28,25,23,0.05),0_14px_36px_-16px_rgba(28,25,23,0.14)] dark:border-stone-800 dark:bg-stone-900 dark:shadow-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-5 dark:border-stone-800">
        <div className="flex items-center gap-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-700/8 font-display text-lg font-bold text-teal-800 dark:bg-teal-400/10 dark:text-teal-300">
            {number}
          </span>
          <div>
            <h2 className="font-display text-[19px] font-bold leading-tight text-ink">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[13px] text-stone-500 dark:text-stone-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <SectionBadge issues={issues} submitted={submitted} />
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
```

- [ ] **Step 5: Forward the workflow issues through `WorkflowSection`**

In `src/components/workflow/WorkflowSection.jsx`, change the signature and the `LockedSection` opening tag:

```jsx
export default function WorkflowSection({ api, blocks, dark, submitted, delay }) {
```

```jsx
      <LockedSection
        id="section-workflows"
        number="3"
        title="תהליכים עסקיים"
        subtitle="הגדרת התהליכים, הקשרים ביניהם והלוגיקה הפנימית של כל תהליך."
        issues={api.issues}
        submitted={submitted}
        delay={delay}
      >
```

- [ ] **Step 6: Forward `submitted` and issues from `App.jsx` to sections 1 and 2**

```jsx
          <AdminSection
            value={admin}
            onChange={setAdmin}
            issues={shown.admin}
            submitted={submitted}
            delay={60}
          />
          <BusinessSection
            value={business}
            onChange={setBusiness}
            issues={shown.business}
            submitted={submitted}
            delay={120}
          />
```

Then in `src/components/AdminSection.jsx` and `src/components/BusinessSection.jsx`, accept and forward them. `AdminSection`'s signature becomes:

```jsx
export default function AdminSection({ value, onChange, issues = [], submitted = false, delay }) {
```

and its `LockedSection` opening tag gains `issues={issues}` and `submitted={submitted}`. Do exactly the same for `BusinessSection`:

```jsx
export default function BusinessSection({ value, onChange, issues = [], submitted = false, delay }) {
```

with `issues={issues}` and `submitted={submitted}` added to its `LockedSection`. `AdminSection` still references its old `invalid` prop internally — leave that alone; Task 4 replaces it.

- [ ] **Step 7: Verify with lint and build**

```bash
npm run lint && npm run build
```

Expected: both exit 0.

- [ ] **Step 8: Verify the badges in the browser**

1. Load a fresh draft. Expected: all three sections show the amber `חובה` badge, and no block shows any chip.
2. Add an HTTP block, an empty table block, and fill in nothing. Press generate.
3. Expected: sections 1 and 2 show red count badges; the two blocks each show an amber `המלצה אחת` chip (`בלוק ריק`), not red, because empty blocks only warn.
4. Type a destination into the HTTP block. Expected: its chip flips to red `חסרים 4 שדות חובה` live, with no second button press.
5. Fill section 2 completely. Expected: its badge flips to teal `מלא`.
6. Press the reset button and confirm. Expected: all badges return to amber `חובה` and all chips disappear.

- [ ] **Step 9: Commit**

```bash
git add src/components/BlockStatusChip.jsx src/components/DynamicBlock.jsx src/components/LockedSection.jsx src/components/workflow/WorkflowSection.jsx src/components/AdminSection.jsx src/components/BusinessSection.jsx src/App.jsx
git commit -m "feat(validation): add status badges to blocks and sections"
```

---

### Task 4: Required markers and field rings in sections 1 and 2

**Files:**
- Modify: `src/components/ui.jsx`
- Modify: `src/components/AdminSection.jsx`
- Modify: `src/components/BusinessSection.jsx`

**Interfaces:**
- Consumes: `fieldErrors` from `src/validation/index.js`.
- Produces: `Field({ label, hint, required, error, className, children })`; `Input`/`Textarea`/`Select` each accept `invalid`; `invalidCell` is exported from `ui.jsx` for table cells. `AdminSection` and `BusinessSection` derive their own `errors` map from the `issues` prop added in Task 3.

- [ ] **Step 1: Restructure the input styling in `src/components/ui.jsx`**

Replace the top of the file — the `inputBase` constant and the `Field`, `Input`, `Textarea`, `Select` exports — with the following. The `inputBase` split matters: Tailwind resolves same-specificity utilities by stylesheet order, not class-string order, so appending `border-red-300` after `border-stone-200` would not reliably win. Selecting one variant avoids the conflict entirely.

```jsx
import { Check, ChevronDown, CircleAlert } from 'lucide-react'

// Layout and typography only — the border/ring colours live in the two variants below,
// because appending a red border after a stone one does not reliably override it in Tailwind
const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2 text-[15px] text-ink shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-all duration-150 placeholder:text-stone-400 focus:outline-none dark:bg-stone-800/60 dark:shadow-none dark:placeholder:text-stone-500'

const inputIdle =
  'border-stone-200 hover:border-stone-300 focus:border-teal-600 focus:ring-[3px] focus:ring-teal-600/10 dark:border-stone-700 dark:hover:border-stone-600 dark:focus:border-teal-500 dark:focus:ring-teal-500/15'

const inputInvalid =
  'border-red-300 ring-[3px] ring-red-500/10 hover:border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-900 dark:hover:border-red-800 dark:focus:border-red-700'

const inputClasses = (invalid, className) =>
  `${inputBase} ${invalid ? inputInvalid : inputIdle} ${className}`

/** Ring for the bare <input className="cell-input"> elements used inside tables. */
export const invalidCell =
  'rounded-lg ring-2 ring-inset ring-red-400/70 dark:ring-red-500/50'

export function Field({ label, hint, required = false, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
        <span>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
        {hint && <span className="font-normal text-stone-400 dark:text-stone-500">{hint}</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
          <CircleAlert className="size-3.5 shrink-0" />
          {error}
        </span>
      )}
    </label>
  )
}

export function Input({ className = '', invalid = false, ...props }) {
  return <input type="text" {...props} className={inputClasses(invalid, className)} />
}

export function Textarea({ className = '', rows = 3, invalid = false, ...props }) {
  return (
    <textarea rows={rows} {...props} className={`${inputClasses(invalid, className)} resize-y`} />
  )
}

export function Select({ className = '', wrapperClassName = '', invalid = false, children, ...props }) {
  return (
    <span className={`relative block ${wrapperClassName}`}>
      <select {...props} className={`${inputClasses(invalid, className)} cursor-pointer appearance-none pe-9`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
    </span>
  )
}
```

`Checkbox`, `GhostButton` and `DeleteButton` are unchanged — leave them exactly as they are.

- [ ] **Step 2: Wire `AdminSection`**

In `src/components/AdminSection.jsx`, delete the local `invalidCell` constant at the top (it is exported from `ui.jsx` now) and update the imports:

```jsx
import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import LockedSection from "./LockedSection.jsx";
import { Field, Input, Checkbox, GhostButton, DeleteButton, invalidCell } from "./ui.jsx";
import { makeContactRow, makeDepartmentRow, hasContactContent } from "../lib.js";
import { fieldErrors } from "../validation/index.js";
```

Change the signature and add the derived map (replacing the old `invalid` prop):

```jsx
export default function AdminSection({ value, onChange, issues = [], submitted = false, delay }) {
  const errors = useMemo(() => fieldErrors(issues), [issues]);
```

Mark the two top fields:

```jsx
        <Field label="שם הלקוח" required error={errors.get("clientName")}>
          <Input
            value={value.clientName}
            invalid={errors.has("clientName")}
            onChange={(e) => set({ clientName: e.target.value })}
            placeholder="למשל: סופר פארם"
          />
        </Field>
        <Field label="שם מנהל/ת הפרויקט" required error={errors.get("pmName")}>
          <Input
            value={value.pmName}
            invalid={errors.has("pmName")}
            onChange={(e) => set({ pmName: e.target.value })}
            placeholder="מי מוביל את האפיון?"
          />
        </Field>
```

Mark the contacts table label:

```jsx
        <div className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
          <span>
            אנשי קשר
            <span className="text-red-500"> *</span>
          </span>
          <span className="font-normal text-stone-400 dark:text-stone-500">
            שם — חובה · אימייל או טלפון — לפחות אחד
          </span>
        </div>
```

Replace the per-row flags inside `value.contacts.map` — the old ones derived from the removed `invalid` prop:

```jsx
              {value.contacts.map((contact) => {
                const nameMissing = errors.has(`contactName#${contact.id}`);
                const reachMissing = errors.has(`contactReach#${contact.id}`);
                return (
```

`hasContactContent` is no longer needed for the `dirty` check inside the map — the rules module decides that now — but keep the import only if it is still referenced elsewhere in the file. It is not, so remove `hasContactContent` from the `../lib.js` import line.

Add the table-level message directly after the closing `</div>` of the contacts table wrapper and before the `GhostButton`:

```jsx
        {errors.get("contacts") && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
            <CircleAlert className="size-3.5 shrink-0" />
            {errors.get("contacts")}
          </p>
        )}
```

and add `CircleAlert` to the `lucide-react` import: `import { Plus, Trash2, CircleAlert } from "lucide-react";`

Mark the departments name column header and ring its cells:

```jsx
                    <th className="w-[30%] px-3 py-2.5 text-start font-semibold">
                      שם המחלקה <span className="text-red-500">*</span>
                    </th>
```

```jsx
                        <input
                          value={department.name}
                          onChange={(e) =>
                            setDepartment(department.id, { name: e.target.value })
                          }
                          placeholder="שירות לקוחות"
                          className={`cell-input font-medium ${
                            errors.has(`departmentName#${department.id}`) ? invalidCell : ""
                          }`}
                        />
```

Finally add `issues={issues}` and `submitted={submitted}` to the `LockedSection` opening tag if Task 3 Step 6 has not already done so.

- [ ] **Step 3: Wire `BusinessSection`**

In `src/components/BusinessSection.jsx`, update the imports and signature:

```jsx
import { useMemo } from "react";
import { Plus, Trash2, CircleAlert } from "lucide-react";
import LockedSection from "./LockedSection.jsx";
import { Field, Input, Textarea, GhostButton, DeleteButton } from "./ui.jsx";
import { makeTriggerRow } from "../lib.js";
import { fieldErrors } from "../validation/index.js";

export default function BusinessSection({ value, onChange, issues = [], submitted = false, delay }) {
  const errors = useMemo(() => fieldErrors(issues), [issues]);
```

Mark the goal field:

```jsx
        <Field label="המטרה העסקית" required error={errors.get("goal")}>
          <Textarea
            rows={4}
            value={value.goal}
            invalid={errors.has("goal")}
            onChange={(e) => set({ goal: e.target.value })}
            placeholder="מה הצורך העסקי? איזו בעיה הפתרון פותר, ומה נחשב הצלחה?"
          />
        </Field>
```

Mark the triggers label:

```jsx
          <span className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
            <span>
              {value.triggers.length > 1 ? "הטריגרים המדויקים" : "הטריגר המדויק"}
              <span className="text-red-500"> *</span>
            </span>
            <span className="font-normal text-stone-400 dark:text-stone-500">
              למשל: "לקוח פנה בווטסאפ"
            </span>
          </span>
```

Ring the first trigger input and add the list-level message. Replace the `<Input …>` inside the triggers map with:

```jsx
                <Input
                  value={trigger.text}
                  invalid={errors.has("triggers") && index === 0}
                  onChange={(e) => setTrigger(trigger.id, e.target.value)}
                  placeholder={
                    index === 0 ? "מה בדיוק מפעיל את התהליך?" : "טריגר נוסף..."
                  }
                />
```

and insert directly after the closing `</div>` of the triggers list:

```jsx
          {errors.get("triggers") && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
              <CircleAlert className="size-3.5 shrink-0" />
              {errors.get("triggers")}
            </p>
          )}
```

- [ ] **Step 4: Verify with lint and build**

```bash
npm run lint && npm run build
```

Expected: both exit 0. A "no-unused-vars" error on `hasContactContent` means Step 2's import cleanup was missed.

- [ ] **Step 5: Verify in the browser**

1. Load a fresh draft. Expected: red `*` next to שם הלקוח, שם מנהל/ת הפרויקט, אנשי קשר, שם המחלקה (when the checkbox is on), המטרה העסקית and הטריגר המדויק — with **no** red rings or messages anywhere.
2. Press generate. Expected: every empty required control gains a red ring, with `חסר שם הלקוח` and the equivalents underneath.
3. Type into שם הלקוח. Expected: its ring and message vanish immediately, and the section badge count drops by one.
4. Fill one contact's name only, leaving email and phone blank. Expected: the email and phone cells gain an inset red ring; the name cell does not.
5. Confirm the ring colours read correctly in dark mode.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui.jsx src/components/AdminSection.jsx src/components/BusinessSection.jsx
git commit -m "feat(validation): mark required fields in the locked sections"
```

---

### Task 5: Required markers in the HTTP block

**Files:**
- Modify: `src/components/HttpBlock.jsx`
- Modify: `src/components/http/PayloadEditor.jsx`
- Modify: `src/components/http/SecurityFields.jsx`
- Modify: `src/App.jsx` (`renderBlockBody`)

**Interfaces:**
- Consumes: `fieldErrors`; the block issue lists in `App.jsx`'s `shown.blocks`.
- Produces: `HttpBlock({ block, errors, onUpdate })` where `errors` is a `Map<string,string>`, replacing its `invalid` boolean. `PayloadEditor({ label, value, onChange, error })` replacing its `invalid` boolean. `SecurityFields({ block, errors, onUpdate })`.

> **Scope note:** this task adds an `authType` `<Select>` to `SecurityFields`. `AUTH_TYPES` is exported from `src/constants.js` but currently imported by nothing, so `block.authType` is stuck at `'None'` for every block created after the security-block migration — meaning `compileSpec` has been exporting `security.authType: "None"` regardless of reality, and the spec's `HTTP_NO_AUTH` warning would otherwise point at a control the PM cannot reach. Adding the select fixes both. It changes no JSON *shape*, only lets a real value reach a field that already exists in the export.

- [ ] **Step 1: Switch `PayloadEditor` to the `error` prop**

Replace `src/components/http/PayloadEditor.jsx` in full:

```jsx
import { Field } from "../ui.jsx";

export default function PayloadEditor({ label, value, onChange, error }) {
  const invalid = Boolean(error);
  return (
    <Field label={<span dir="ltr">{label}</span>} required error={error}>
      <textarea
        dir="ltr"
        spellCheck={false}
        rows={7}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          '{\n  "ticketId": 12345,\n  "customer": { "phone": "0501234567" }\n}'
        }
        className={`code-scroll w-full resize-y rounded-lg bg-[#161412] p-3.5 text-left font-mono text-[12.5px] leading-relaxed text-stone-200 caret-teal-400 outline-none ring-1 transition-shadow duration-150 placeholder:text-stone-600 ${
          invalid
            ? "ring-2 ring-red-500"
            : "ring-stone-700/80 focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500"
        }`}
      />
    </Field>
  );
}
```

- [ ] **Step 2: Wire `HttpBlock`**

In `src/components/HttpBlock.jsx`, change the signature to take `errors` instead of `invalid`:

```jsx
export default function HttpBlock({ block, errors, onUpdate }) {
```

Mark the four top-level required fields. Title:

```jsx
      <Field
        label="כותרת הבלוק"
        hint="תופיע בבחירת הבלוק מתוך שלב קריאת API"
        required
        error={errors.get("title")}
      >
        <Input
          value={block.title ?? ""}
          invalid={errors.has("title")}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="למשל: פתיחת לקוח ב-Priority"
        />
      </Field>
```

Endpoint:

```jsx
        <Field
          label={<span dir="ltr">Endpoint</span>}
          hint="כתובת ה-API המלאה"
          required
          error={errors.get("endpoint")}
        >
          <Input
            dir="ltr"
            value={block.endpoint}
            invalid={errors.has("endpoint")}
            onChange={(e) => onUpdate({ endpoint: e.target.value })}
            placeholder="https://api.example.com/v1/tickets"
            className="text-left font-mono !text-[13.5px]"
          />
        </Field>
```

Source system:

```jsx
        <Field label="מערכת מקור" required error={errors.get("source")}>
          <Input
            dir="auto"
            value={block.source}
            invalid={errors.has("source")}
            onChange={(e) => onUpdate({ source: e.target.value })}
            placeholder="Glassix"
          />
        </Field>
```

Destination system — it already passes a composed `label`, so add `required` and `error` alongside:

```jsx
        <Field
          required
          error={errors.get("destination")}
          label={
            <span className="flex items-center gap-2">
              מערכת יעד
              {thirdParty && (
                <span className="animate-pop inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-px text-[11px] font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400">
                  <Globe className="size-3" />
                  צד שלישי
                </span>
              )}
            </span>
          }
        >
          <Input
            dir="auto"
            value={block.destination}
            invalid={errors.has("destination")}
            onChange={(e) => onUpdate({ destination: e.target.value })}
            placeholder="Salesforce / Priority / Consist..."
          />
        </Field>
```

Update the two `PayloadEditor` calls to pass `error` instead of `invalid`:

```jsx
          <PayloadEditor
            label="Request Payload"
            value={block.requestPayload}
            onChange={(requestPayload) => onUpdate({ requestPayload })}
            error={errors.get("requestPayload")}
          />
          <PayloadEditor
            label="Response"
            value={block.responsePayload}
            onChange={(responsePayload) => onUpdate({ responsePayload })}
            error={errors.get("responsePayload")}
          />
```

And forward the map to `SecurityFields`:

```jsx
      <SecurityFields block={block} errors={errors} onUpdate={onUpdate} />
```

- [ ] **Step 3: Wire `SecurityFields` and add the missing auth control**

In `src/components/http/SecurityFields.jsx`, update the imports and signature:

```jsx
import { ShieldCheck } from "lucide-react";
import { Field, Textarea, Select } from "../ui.jsx";
import { Checkbox } from "../ui.jsx";
import { AUTH_TYPES } from "../../constants.js";

export default function SecurityFields({ block, errors, onUpdate }) {
```

(Collapse the two `ui.jsx` imports into one line: `import { Field, Textarea, Select, Checkbox } from "../ui.jsx";`)

Add the auth selector as the first child of the `<div className="space-y-4">`, before the existing grid:

```jsx
        <Field label="סוג אימות" hint="איך הקריאה מזוהה מול מערכת היעד">
          <Select
            value={block.authType}
            onChange={(e) => onUpdate({ authType: e.target.value })}
            wrapperClassName="sm:w-1/2"
          >
            {AUTH_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
```

Mark the two conditional fields:

```jsx
              <Field
                label="כתובות IP להחרגה"
                hint="כתובת אחת בכל שורה"
                required
                error={errors.get("whitelistedIps")}
                className="animate-pop mt-3"
              >
                <Textarea
                  dir="ltr"
                  rows={3}
                  value={block.whitelistedIps}
                  invalid={errors.has("whitelistedIps")}
                  onChange={(e) => onUpdate({ whitelistedIps: e.target.value })}
                  placeholder={"203.0.113.10\n198.51.100.0/24"}
                  className="text-left font-mono !text-[12.5px]"
                />
              </Field>
```

```jsx
              <Field
                label="פרטי התעודה"
                hint="סוג, פורמט והנחיות מסירה"
                required
                error={errors.get("certificateDetails")}
                className="animate-pop mt-3"
              >
                <Textarea
                  rows={3}
                  value={block.certificateDetails}
                  invalid={errors.has("certificateDetails")}
                  onChange={(e) => onUpdate({ certificateDetails: e.target.value })}
                  placeholder="למשל: תעודת mTLS בפורמט PEM"
                />
              </Field>
```

- [ ] **Step 4: Pass the error map from `App.jsx`**

In `renderBlockBody`, add the shared map derivation at the top of the function and update the `http` case:

```jsx
  const renderBlockBody = (block) => {
    const errors = fieldErrors(shown.blocks.get(block.id) ?? []);
    switch (block.type) {
      case "http":
        return (
          <HttpBlock
            block={block}
            errors={errors}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        );
```

Leave the other three cases as they are; Task 6 updates them.

- [ ] **Step 5: Verify with lint and build**

```bash
npm run lint && npm run build
```

Expected: both exit 0.

- [ ] **Step 6: Verify in the browser**

1. Add an HTTP block. Expected: red `*` on כותרת הבלוק, Endpoint, מערכת מקור and מערכת יעד immediately, with no rings.
2. Type `Salesforce` into מערכת יעד. Expected: the צד שלישי badge appears and both payload editors show a red `*`.
3. Press generate, then close the modal. Expected: the four empty fields plus both payload editors carry red rings and messages; the block chip reads `חסרים 5 שדות חובה` (title, source, endpoint, and both payloads).
4. Tick "נדרשת החרגת כתובות IP" and leave the textarea empty. Expected: the count rises by one and the textarea rings red.
5. Change סוג אימות away from `None`. Expected: the block's warning count drops by one.
6. Set מערכת יעד to `Glassix`. Expected: the payload editors disappear and their errors leave the chip count.

- [ ] **Step 7: Commit**

```bash
git add src/components/HttpBlock.jsx src/components/http/PayloadEditor.jsx src/components/http/SecurityFields.jsx src/App.jsx
git commit -m "feat(validation): mark required fields in the http block"
```

---

### Task 6: Required markers in the remaining blocks

**Files:**
- Modify: `src/components/FreeTextBlock.jsx`
- Modify: `src/components/TestDataBlock.jsx`
- Modify: `src/components/TableBlock.jsx`
- Modify: `src/App.jsx` (`renderBlockBody`)

**Interfaces:**
- Consumes: the `errors` map built in `renderBlockBody` in Task 5.
- Produces: `FreeTextBlock({ block, errors, onUpdate })`, `TestDataBlock({ block, errors, onUpdate })`, `TableBlock({ block, errors, onUpdate })`.

- [ ] **Step 1: Wire `FreeTextBlock`**

Replace `src/components/FreeTextBlock.jsx` in full:

```jsx
import { Field, Input, Textarea } from './ui.jsx'

export default function FreeTextBlock({ block, errors, onUpdate }) {
  return (
    <div className="space-y-4">
      <Field label="כותרת">
        <Input
          dir="auto"
          value={block.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="על מה הבלוק הזה?"
        />
      </Field>
      <Field label="תיאור" required error={errors.get('text')}>
        <Textarea
          dir="auto"
          rows={5}
          value={block.text}
          invalid={errors.has('text')}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="טקסט חופשי — הקשר, הערות, דרישות מיוחדות או כל דבר שחשוב שהמפתח יידע"
        />
      </Field>
    </div>
  )
}
```

The title carries no `*` — a missing title is a `warning`, and warnings never mark a control.

- [ ] **Step 2: Wire `TestDataBlock`**

In `src/components/TestDataBlock.jsx`, change the signature:

```jsx
export default function TestDataBlock({ block, errors, onUpdate }) {
```

Mark the two required column headers:

```jsx
              <th className="w-[30%] px-3 py-2.5 text-start font-semibold">
                שדה <span className="text-red-500">*</span>
              </th>
              <th className="w-[32%] px-3 py-2.5 text-start font-semibold">
                ערך לבדיקה <span className="text-red-500">*</span>
              </th>
```

Add the table-level message between the closing `</div>` of the table wrapper and the `GhostButton`, and add `CircleAlert` to the `lucide-react` import (`import { Plus, Trash2, CircleAlert } from 'lucide-react'`):

```jsx
      {errors.get('rows') && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
          <CircleAlert className="size-3.5 shrink-0" />
          {errors.get('rows')}
        </p>
      )}
```

- [ ] **Step 3: Wire `TableBlock`**

In `src/components/TableBlock.jsx`, update the imports and signature:

```jsx
import { Plus, Trash2, X, CircleAlert } from 'lucide-react'
import { Field, Input, Textarea, GhostButton, DeleteButton, invalidCell } from './ui.jsx'
import { makeTableColumn, makeTableRow } from '../lib.js'

export default function TableBlock({ block, errors, onUpdate }) {
```

Mark the name field:

```jsx
      <Field
        label="שם הטבלה"
        hint="על מה הטבלה?"
        required
        error={errors.get('name')}
        className="mb-4 sm:w-1/2"
      >
        <Input
          value={block.name}
          invalid={errors.has('name')}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="למשל: סטטוסים אפשריים"
        />
      </Field>
```

Ring the unlabelled column headers:

```jsx
                    <input
                      value={col.label}
                      onChange={(e) => setColumn(col.id, e.target.value)}
                      placeholder={`עמודה ${i + 1}`}
                      className={`cell-input !py-2.5 !text-[12.5px] font-bold ${
                        errors.has(`columnLabel#${col.id}`) ? invalidCell : ''
                      }`}
                    />
```

Add the rows message just before the `<div className="mt-2.5 flex gap-2.5">` that holds the two `GhostButton`s:

```jsx
      {errors.get('rows') && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
          <CircleAlert className="size-3.5 shrink-0" />
          {errors.get('rows')}
        </p>
      )}
```

- [ ] **Step 4: Pass `errors` to all three from `App.jsx`**

Update the remaining three cases in `renderBlockBody`:

```jsx
      case "freeText":
        return (
          <FreeTextBlock
            block={block}
            errors={errors}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        );
      case "testData":
        return (
          <TestDataBlock
            block={block}
            errors={errors}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        );
      case "table":
        return (
          <TableBlock
            block={block}
            errors={errors}
            onUpdate={(patch) => updateBlock(block.id, patch)}
          />
        );
```

- [ ] **Step 5: Verify with lint and build**

```bash
npm run lint && npm run build
```

Expected: both exit 0.

- [ ] **Step 6: Verify in the browser**

1. Add a free-text block and type only a title. Press generate. Expected: תיאור rings red with `חסר תיאור`; the chip reads `חסר שדה חובה אחד`.
2. Add a test-data block and type only a key. Press generate. Expected: the `שדה` and `ערך לבדיקה` headers carry a red `*` and `נדרשת לפחות שורה אחת עם שדה וערך` appears below the table.
3. Add a table block, type a name, leave both column labels blank, and put text in one cell. Press generate. Expected: both column header inputs carry an inset red ring and the chip reads `חסרים 2 שדות חובה`.
4. Label both columns. Expected: the rings clear and the chip flips to teal `מלא`.

- [ ] **Step 7: Commit**

```bash
git add src/components/FreeTextBlock.jsx src/components/TestDataBlock.jsx src/components/TableBlock.jsx src/App.jsx
git commit -m "feat(validation): mark required fields in the remaining blocks"
```

---

### Task 7: Full verification pass

**Files:** none modified unless a defect is found.

**Interfaces:** none.

- [ ] **Step 1: Lint and build clean**

```bash
npm run lint && npm run build
```

Expected: both exit 0 with no warnings.

- [ ] **Step 2: Walk the nine spec scenarios**

Run `npm run dev` and confirm each in order. These are the acceptance criteria from the design document.

1. A newly added block shows no chip and no rings until the first generate press; its asterisks are visible immediately.
2. A draft with problems in the admin section, a block, and a workflow lists all three in one modal, grouped under their own headings.
3. `צור בכל זאת` is disabled while any error exists and enabled when only warnings remain.
4. A third-party HTTP block still refuses to export without both payloads.
5. A completely empty block yields one warning, not a wall of errors, and does not block export.
6. Modal rows scroll to the correct block or section; a workflow row also switches to the right workflow tab and selects the node.
7. Fixing a field clears its ring and updates its chip without another button press.
8. `resetDraft` clears the submitted state, so the form goes silent again.
9. Everything above holds in dark mode and reads correctly RTL.

- [ ] **Step 3: Confirm no export regression**

Fill in a complete draft with one HTTP block, generate, and read the JSON in `ExportModal`. Expected: the `meta`, `administrative`, `businessNeed`, `workflows` and `technicalBlocks` keys are unchanged in shape from before this work. The only value that can differ is `technicalBlocks[].security.authType`, which can now hold a real selection instead of always `"None"` (see the Task 5 scope note).

- [ ] **Step 4: Confirm the draft still round-trips**

Reload the page. Expected: everything typed is restored from `localStorage`, the form is silent again (`submitted` is session state and is deliberately not persisted), and the asterisks are still visible.

- [ ] **Step 5: Commit any fixes**

If steps 1-4 surfaced no defects, there is nothing to commit and the feature is complete. Otherwise fix, re-run steps 1-2, and commit:

```bash
git add -A
git commit -m "fix(validation): address issues found in verification pass"
```
