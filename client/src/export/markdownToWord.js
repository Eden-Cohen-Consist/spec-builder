import { marked } from 'marked'

// A chat UI renders the spec inside a ```markdown fence, and "copy" grabs the fence too.
// Pasted verbatim that makes the whole document one code block instead of a spec, so the
// wrapper is peeled off before parsing. Only an empty or markdown info string is unwrapped —
// a document that really is a single ```json block must stay a code block.
const FULL_DOCUMENT_FENCE = /^(`{3,}|~{3,})[ \t]*([^\n]*)\n([\s\S]*?)\n?\1[ \t]*$/
const MARKDOWN_FENCE_LANGS = new Set(['', 'markdown', 'md'])

export const stripMarkdownFence = (markdown) => {
  const match = FULL_DOCUMENT_FENCE.exec(markdown.trim())
  if (!match) return markdown
  const [, fence, info, content] = match
  if (!MARKDOWN_FENCE_LANGS.has(info.trim().toLowerCase())) return markdown
  // A fence closes at the first line of matching length, so an inner fence that long means
  // this really is a code block rather than a wrapper — leave it alone.
  const closesEarly = new RegExp(`^ {0,3}\\${fence[0]}{${fence.length},}[ \\t]*$`, 'm')
  return closesEarly.test(content) ? markdown : content
}

// Word rebuilds pasted HTML as its own document: it drops stylesheets, maps every block
// element to a paragraph, and resolves direction/alignment per paragraph rather than
// inheriting them from an ancestor. So a single RTL wrapper is not enough — every block
// needs its own dir attribute and inline style.
const WORD_FONT = "font-family:Arial,'Segoe UI',sans-serif;font-size:11pt;"
const WORD_MONO = "font-family:Consolas,'Courier New',monospace;font-size:9.5pt;"
const WORD_RTL = 'direction:rtl;text-align:right;'

const WORD_BLOCK_STYLES = {
  H1: `${WORD_FONT}${WORD_RTL}font-size:19pt;font-weight:bold;margin:0 0 12pt;`,
  H2: `${WORD_FONT}${WORD_RTL}font-size:15pt;font-weight:bold;margin:18pt 0 8pt;`,
  H3: `${WORD_FONT}${WORD_RTL}font-size:13pt;font-weight:bold;margin:14pt 0 6pt;`,
  H4: `${WORD_FONT}${WORD_RTL}font-size:11.5pt;font-weight:bold;margin:12pt 0 6pt;`,
  H5: `${WORD_FONT}${WORD_RTL}font-weight:bold;margin:12pt 0 6pt;`,
  H6: `${WORD_FONT}${WORD_RTL}font-weight:bold;margin:12pt 0 6pt;`,
  P: `${WORD_FONT}${WORD_RTL}margin:0 0 10pt;line-height:1.5;`,
  UL: `${WORD_FONT}${WORD_RTL}margin:0 0 10pt;padding:0 24pt 0 0;`,
  OL: `${WORD_FONT}${WORD_RTL}margin:0 0 10pt;padding:0 24pt 0 0;`,
  LI: `${WORD_FONT}${WORD_RTL}margin:0 0 4pt;line-height:1.5;`,
  BLOCKQUOTE: `${WORD_FONT}${WORD_RTL}margin:0 0 10pt;padding:0 12pt 0 0;border-right:3px solid #d9d9d9;color:#555555;`,
  TABLE: 'direction:rtl;border-collapse:collapse;width:100%;margin:0 0 12pt;mso-table-lspace:0pt;mso-table-rspace:0pt;',
  TH: `${WORD_FONT}${WORD_RTL}border:1px solid #999999;background:#f2f2f2;padding:5px 9px;font-weight:bold;vertical-align:top;`,
  TD: `${WORD_FONT}${WORD_RTL}border:1px solid #999999;padding:5px 9px;vertical-align:top;`,
  HR: 'border:0;border-top:1px solid #d9d9d9;margin:14pt 0;',
}

const CODE_BLOCK_STYLE = `${WORD_MONO}direction:ltr;text-align:left;background:#f6f6f6;border:1px solid #d9d9d9;padding:8px 10px;margin:0 0 12pt;`

// A <pre> loses its whitespace once Word reflows it into a paragraph, so the code block is
// rebuilt with hard line breaks and non-breaking indentation instead.
const rewriteCodeBlocks = (doc) => {
  doc.querySelectorAll('pre').forEach((pre) => {
    const source = (pre.querySelector('code') ?? pre).textContent.replace(/\n+$/, '')
    const box = doc.createElement('div')
    box.setAttribute('dir', 'ltr')
    box.setAttribute('style', CODE_BLOCK_STYLE)
    source.split('\n').forEach((line, index) => {
      if (index > 0) box.appendChild(doc.createElement('br'))
      box.appendChild(doc.createTextNode(line.replace(/^ +/, (spaces) => '\u00a0'.repeat(spaces.length))))
    })
    pre.replaceWith(box)
  })
}

const styleInlineCode = (doc) => {
  doc.querySelectorAll('code').forEach((code) => {
    code.setAttribute('dir', 'ltr')
    code.setAttribute('style', `${WORD_MONO}background:#f2f2f2;`)
    // LRM guards stop trailing punctuation of a Latin snippet from being re-ordered to the
    // wrong end of the run when Word lays out the surrounding Hebrew text
    code.before(doc.createTextNode('\u200e'))
    code.after(doc.createTextNode('\u200e'))
  })
}

export const markdownToWordHtml = (markdown) => {
  const doc = new DOMParser().parseFromString(marked.parse(markdown, { gfm: true }), 'text/html')
  rewriteCodeBlocks(doc)
  styleInlineCode(doc)
  doc.body.querySelectorAll('*').forEach((el) => {
    const style = WORD_BLOCK_STYLES[el.tagName]
    if (!style) return
    el.setAttribute('style', style)
    if (el.tagName !== 'HR') el.setAttribute('dir', 'rtl')
  })
  return `<div dir="rtl" style="${WORD_FONT}${WORD_RTL}">${doc.body.innerHTML}</div>`
}
