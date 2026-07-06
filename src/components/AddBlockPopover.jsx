import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { BLOCK_META } from "../constants.js";

export default function AddBlockPopover({ onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-5 text-[15px] font-semibold transition-all duration-200 ${
          open
            ? "border-teal-600/50 bg-teal-50/40 text-teal-700"
            : "border-stone-200 text-stone-400 hover:border-teal-600/40 hover:bg-teal-50/30 hover:text-teal-700"
        }`}
      >
        <Plus
          className={`size-[18px] transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
        הוסף בלוק טכני
      </button>

      {open && (
        <div className="animate-pop absolute inset-x-0 bottom-full z-50 mb-2 origin-bottom rounded-2xl border-1 border-teal-600 bg-stone-100 p-1.5 shadow-xl shadow-stone-900/10">
          {Object.entries(BLOCK_META).map(([type, meta]) => {
            const Icon = meta.icon;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(type);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-start transition-colors duration-100 hover:bg-stone-50"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: meta.tint, color: meta.accent }}
                >
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-[14.5px] font-bold text-ink">
                    {meta.title}
                  </span>
                  <span className="block text-[12.5px] text-stone-500">
                    {meta.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
