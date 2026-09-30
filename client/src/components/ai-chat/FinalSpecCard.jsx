import { useState } from "react";
import { Check, Download, FileText, LoaderCircle } from "lucide-react";
import { stripMarkdownFence } from "../../export/markdownToWord.js";

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function FinalSpecCard({ finalSpec }) {
  const [wordBusy, setWordBusy] = useState(false);
  const [wordError, setWordError] = useState("");
  const markdown = stripMarkdownFence(finalSpec).trim();

  const downloadMarkdown = () => {
    download(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), "specification.md");
  };

  const downloadWord = async () => {
    setWordBusy(true);
    setWordError("");
    try {
      const { markdownToDocx } = await import("../../export/markdownToDocx.js");
      download(await markdownToDocx(markdown), "specification.docx");
    } catch {
      setWordError(error.message);
      // setWordError("לא הצלחנו להכין קובץ Word. אפשר עדיין להוריד Markdown.");
    } finally {
      setWordBusy(false);
    }
  };

  return (
    <section className="animate-rise mx-auto my-8 w-full max-w-md rounded-2xl border border-emerald-200 bg-emerald-50/65 px-6 py-5 text-center dark:border-emerald-500/25 dark:bg-emerald-950/20">
      <div className="flex items-center justify-center gap-2 text-[14px] font-bold text-emerald-800 dark:text-emerald-300">
        <Check className="size-4" />
        האפיון הסופי מוכן
      </div>
      <p className="mt-1 text-[13px] text-stone-600 dark:text-stone-300">
        בחרו את הקובץ שתרצו להוריד.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={downloadWord} disabled={wordBusy} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-[13px] font-bold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">
          {wordBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
          {wordBusy ? "מכין קובץ Word…" : "הורדת Word"}
        </button>
        <button type="button" onClick={downloadMarkdown} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 px-4 py-2 text-[13px] font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-900/30">
          <FileText className="size-4" />
          הורדת Markdown
        </button>
      </div>
      {wordError && <p role="alert" className="mt-3 text-[13px] text-red-700 dark:text-red-300">{wordError}</p>}
    </section>
  );
}
