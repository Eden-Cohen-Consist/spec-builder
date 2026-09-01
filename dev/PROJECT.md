# בונה אפיונים (Glassix Spec Builder)

Hebrew/RTL web app for a product manager (not a developer) to build a **technical integration spec** for Glassix-related work.

There is no server and no database. Everything lives in the browser. Drafts auto-save locally. The end goal is not a finished document inside the app — it is a structured package the PM copies into an external AI chat, which then writes the real Markdown spec.

---

## How the UI is built

The app is a **3-step wizard** (three screens), not one long page. A stepper at the top shows where you are. Only the current step is on screen; next/back live in the footer. You can jump back to a step you’ve already reached. Blocking errors on a step stop “next” until fixed (or acknowledged via validation).

Around that: header (theme, reset draft), and on the last step — **Generate** to export.

### Step 1 — הקשר וצורך (context & need)

Two locked sections on one screen:

| Section | Roughly what’s in it |
|---------|----------------------|
| **Admin** | Client name, PM name, contact people (name / email / phone / role), optional Glassix departments |
| **Business** | The business goal — why this exists and what success means |

Also from here: shortcut to **convert an AI Markdown spec → Word** (side path, not part of filling the form).

### Step 2 — תרשים זרימה (workflows)

Visual process canvas. Multiple workflows via tabs. Each workflow has a name, a trigger (manual / form / webhook / event / schedule), and a graph of nodes:

- **Start / End** — entry and exit  
- **Action** — something that happens  
- **Decision** — branches with labeled routes  
- **HTTP request** — an API call (can link to an HTTP block from step 3)

PM drags/connects nodes; the app checks the graph (missing start/end, dead ends, decisions without enough routes, HTTP steps without a linked block, etc.).

### Step 3 — בלוקים טכניים (technical blocks)

Free list of addable/removable blocks that spell out integrations and supporting detail. Types:

- **HTTP / integration** — API between systems (Glassix / Consist = internal; others = 3rd-party), headers, payloads, mapping, security; can import from cURL  
- **Free text** — open title + description  
- **Test data** — example values  
- **Table** — free columns and rows  

Workflow HTTP nodes from step 2 can point at these HTTP blocks.

---

## End of the flow

1. On step 3 (or after checks), **Generate** runs validation across all steps.  
2. Issues open a validation modal; clean form goes straight to export. PM can still export “anyway.”  
3. Export builds JSON + an AI review prompt → copy into ChatGPT / Claude / etc.  
4. Optionally paste the AI’s Markdown back and convert to Word.

UI is fully **RTL Hebrew**, with light and dark theme. Drafts auto-save in the browser.

---

## What “done” looks like

| Ability | Result |
|---------|--------|
| **Generate / export** | Structured JSON + AI prompt → paste into an external LLM |
| **Markdown → Word** | Turn the AI-written spec into a Word-friendly document |
| **Draft persistence** | Come back later; draft is still in the browser |
| **Validation** | Catch empty sections, broken workflows, unlinked HTTP steps, etc. before export |

The app does **not** write the final spec itself and does **not** call an AI API. It prepares the handoff package for an external chat.
