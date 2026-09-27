import { marked } from "marked";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

// Change these values to restyle every exported document.
const STYLE = {
  font: "Calibri",
  codeFont: "Consolas",
  text: "243039",
  accent: "1F4E79",
  muted: "CFD8E3",
  tableHeader: "DCE6F1",
  codeBackground: "F3F5F7",
  bodySize: 24,
  tableSize: 22,
  codeSize: 20,
  headingSizes: [42, 32, 26, 24, 24, 24],
  pageMargin: 1080,
  bodyAfter: 160,
};

const rtl = {
  bidirectional: true,
  alignment: AlignmentType.START,
  spacing: { after: STYLE.bodyAfter, line: 300 },
};

const textRun = (text, options = {}) => new TextRun({
  text,
  font: STYLE.font,
  size: STYLE.bodySize,
  color: STYLE.text,
  rightToLeft: true,
  ...options,
});

const directionalRuns = (text, options) => {
  const runs = [];
  let chunk = "";
  let rtl = null;
  for (const char of text) {
    const direction = /[\u0590-\u05ff]/u.test(char) ? true : /[A-Za-z0-9]/u.test(char) ? false : null;
    if (direction !== null && rtl !== null && direction !== rtl) {
      runs.push(textRun(chunk, { ...options, rightToLeft: rtl }));
      chunk = "";
    }
    chunk += char;
    if (direction !== null) rtl = direction;
  }
  if (chunk) runs.push(textRun(chunk, { ...options, rightToLeft: rtl ?? true }));
  return runs;
};

const inlineRuns = (tokens = [], inherited = {}) => tokens.flatMap((token) => {
  if (token.type === "strong") return inlineRuns(token.tokens, { ...inherited, bold: true });
  if (token.type === "em") return inlineRuns(token.tokens, { ...inherited, italics: true });
  if (token.type === "del") return inlineRuns(token.tokens, { ...inherited, strike: true });
  if (token.type === "link") {
    const label = inlineRuns(token.tokens, { ...inherited, color: STYLE.accent, underline: {} });
    return token.href && token.href !== token.text
      ? [...label, textRun(` (${token.href})`, { color: STYLE.accent, rightToLeft: false })]
      : label;
  }
  if (token.type === "codespan") {
    return [textRun(`\u200e${token.text}\u200e`, {
      ...inherited,
      font: STYLE.codeFont,
      size: STYLE.codeSize,
      rightToLeft: false,
      shading: { fill: STYLE.codeBackground },
    })];
  }
  if (token.type === "br") return [textRun("\n", inherited)];
  if (token.type === "image") return directionalRuns(token.text || token.href, inherited);
  if (token.tokens?.length) return inlineRuns(token.tokens, inherited);
  if (token.text) return directionalRuns(token.text, inherited);
  return [];
});

const paragraph = (runs, options = {}) => new Paragraph({
  ...rtl,
  children: runs.length ? runs : [textRun("")],
  ...options,
});

const codeParagraph = (line) => paragraph(
  [textRun(line || " ", { font: STYLE.codeFont, size: STYLE.codeSize, rightToLeft: false })],
  {
    bidirectional: false,
    alignment: AlignmentType.LEFT,
    spacing: { after: 0, line: 240 },
    shading: { fill: STYLE.codeBackground },
    indent: { left: 180, right: 180 },
  },
);

const tableCell = (cell, header) => new TableCell({
  shading: header ? { fill: STYLE.tableHeader } : undefined,
  children: [paragraph(inlineRuns(cell.tokens, { size: STYLE.tableSize, ...(header ? { bold: true } : {}) }), {
    spacing: { after: 60, before: 60, line: 270 },
  })],
});

const table = (token) => {
  const border = { style: BorderStyle.SINGLE, size: 4, color: STYLE.muted };
  const rows = [token.header, ...token.rows];
  return new Table({
    rows: rows.map((cells, index) => new TableRow({
      children: cells.map((cell) => tableCell(cell, index === 0)),
    })),
    width: { size: 100, type: WidthType.PERCENTAGE },
    visuallyRightToLeft: true,
    borders: {
      top: border, bottom: border, left: border, right: border,
      insideHorizontal: border, insideVertical: border,
    },
    cellMargin: { top: 100, bottom: 100, left: 120, right: 120 },
  });
};

const blocks = (tokens, numbering, children) => {
  for (const token of tokens) {
    if (token.type === "space") continue;
    if (token.type === "heading") {
      const depth = Math.min(token.depth, 6);
      const heading = HeadingLevel[`HEADING_${depth}`];
      children.push(paragraph(inlineRuns(token.tokens, {
        bold: true,
        color: STYLE.accent,
        size: STYLE.headingSizes[depth - 1],
      }), {
        heading,
        spacing: { before: depth === 1 ? 0 : 260, after: 140 },
      }));
    } else if (token.type === "paragraph" || token.type === "text") {
      children.push(paragraph(inlineRuns(token.tokens?.length ? token.tokens : [token])));
    } else if (token.type === "code") {
      for (const line of token.text.replace(/\n$/, "").split("\n")) {
        children.push(codeParagraph(line));
      }
      children.push(paragraph([], { spacing: { after: 120 } }));
    } else if (token.type === "table") {
      children.push(table(token));
      children.push(paragraph([], { spacing: { after: 120 } }));
    } else if (token.type === "list") {
      const reference = `list-${numbering.length + 1}`;
      numbering.push({
        reference,
        levels: [{
          level: 0,
          format: token.ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET,
          text: token.ordered ? "%1." : "•",
          start: Number(token.start) || 1,
          alignment: AlignmentType.RIGHT,
          style: {
            paragraph: { indent: { right: 720, hanging: 360 } },
            run: { rightToLeft: true, font: STYLE.font, size: STYLE.bodySize },
          },
        }],
      });
      for (const item of token.items) {
        const content = item.tokens.filter((part) => part.type !== "list");
        const runs = inlineRuns(content);
        children.push(paragraph(runs, {
          spacing: { after: 80, line: 340 },
          numbering: { reference, level: 0 },
        }));
        blocks(item.tokens.filter((part) => part.type === "list"), numbering, children);
      }
    } else if (token.type === "blockquote") {
      blocks(token.tokens, numbering, children);
    } else if (token.type === "hr") {
      children.push(paragraph([], {
        border: { bottom: { style: BorderStyle.SINGLE, size: 5, color: STYLE.muted } },
      }));
    } else if (token.text) {
      children.push(paragraph([textRun(token.text)]));
    }
  }
};

export async function markdownToDocx(markdown) {
  const children = [];
  const numbering = [];
  blocks(marked.lexer(markdown, { gfm: true }), numbering, children);
  const document = new Document({
    numbering: { config: numbering },
    sections: [{
      properties: { page: { margin: {
        top: STYLE.pageMargin,
        bottom: STYLE.pageMargin,
        left: STYLE.pageMargin,
        right: STYLE.pageMargin,
      } } },
      children,
    }],
  });
  return Packer.toBlob(document);
}
