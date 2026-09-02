import { Trash2, ChevronDown } from "lucide-react";
import { Checkbox, DeleteButton, GhostAddRow } from "../ui.jsx";
import { FIELD_TYPES } from "../../constants.js";
import { makeMappingRow } from "../../lib.js";

export default function MappingTable({
  mapping,
  source,
  destination,
  enabled,
  onChange,
  onEnabledChange,
}) {
  const setRow = (id, patch) =>
    onChange(
      mapping.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  const removeRow = (id) => onChange(mapping.filter((row) => row.id !== id));
  const addRow = () => onChange([...mapping, makeMappingRow()]);

  return (
    <div className="mt-5 rounded-xl border border-stone-200 p-3.5 dark:border-stone-800">
      <Checkbox
        checked={enabled}
        onChange={onEnabledChange}
        label="הוסף מיפוי שדות (Data Mapping)"
      />
      {enabled && (
        <div className="animate-pop mt-3 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="w-full min-w-[560px] text-[13.5px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <th className="w-[22%] px-3 py-2.5 text-start font-semibold">
                  {source?.trim() || "שדה מקור"}
                </th>
                <th className="w-[22%] px-3 py-2.5 text-start font-semibold">
                  {destination?.trim() || "שדה יעד"}
                </th>
                <th className="w-[15%] px-3 py-2.5 text-start font-semibold">
                  סוג
                </th>
                <th className="w-[8%] px-2 py-2.5 text-center font-semibold">
                  חובה
                </th>
                <th className="px-3 py-2.5 text-start font-semibold">הערות</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {mapping.map((row) => (
                <tr
                  key={row.id}
                  className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30"
                >
                  <td>
                    <input
                      dir="ltr"
                      value={row.sourceField}
                      onChange={(e) =>
                        setRow(row.id, { sourceField: e.target.value })
                      }
                      placeholder="customer_phone"
                      className="cell-input text-left font-mono !text-[12.5px]"
                    />
                  </td>
                  <td>
                    <input
                      dir="ltr"
                      value={row.targetField}
                      onChange={(e) =>
                        setRow(row.id, { targetField: e.target.value })
                      }
                      placeholder="phoneNumber"
                      className="cell-input text-left font-mono !text-[12.5px]"
                    />
                  </td>
                  <td>
                    <span className="relative block">
                      <select
                        value={row.type}
                        onChange={(e) => setRow(row.id, { type: e.target.value })}
                        className="w-full cursor-pointer appearance-none bg-transparent py-2.5 pe-7 ps-3 text-[13px] text-stone-700 outline-none transition-colors focus:bg-teal-600/5 dark:text-stone-300 dark:focus:bg-teal-500/10"
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="inline-flex align-middle">
                      <Checkbox
                        checked={row.required}
                        onChange={(required) => setRow(row.id, { required })}
                        label=""
                      />
                    </span>
                  </td>
                  <td>
                    <input
                      value={row.notes}
                      onChange={(e) => setRow(row.id, { notes: e.target.value })}
                      placeholder="הערות..."
                      className="cell-input"
                    />
                  </td>
                  <td className="text-center">
                    <DeleteButton
                      aria-label="מחיקת שורה"
                      onClick={() => removeRow(row.id)}
                      className="opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </DeleteButton>
                  </td>
                </tr>
              ))}
              <GhostAddRow colSpan={6} onAdd={addRow} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
