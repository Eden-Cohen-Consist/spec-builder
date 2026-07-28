import { Plus, Trash2 } from "lucide-react";
import { GhostButton, DeleteButton } from "../ui.jsx";
import { makeHeaderRow } from "../../lib.js";

export default function HeadersEditor({ headers, onChange }) {
  const setRow = (id, patch) =>
    onChange(
      headers.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  const removeRow = (id) => onChange(headers.filter((row) => row.id !== id));
  const addRow = () => onChange([...headers, makeHeaderRow()]);

  return (
    <div className="mt-5">
      <h4 className="mb-2 text-[13.5px] font-bold text-stone-700 dark:text-stone-300">
        Headers{" "}
        <span className="font-normal text-stone-400 dark:text-stone-500">
          (אופציונלי)
        </span>
      </h4>
      {headers.length > 0 && (
        <div className="animate-block-in overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <th className="w-[38%] px-3 py-2.5 text-start font-semibold">
                  Key
                </th>
                <th className="px-3 py-2.5 text-start font-semibold">Value</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {headers.map((row) => (
                <tr
                  key={row.id}
                  className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30"
                >
                  <td>
                    <input
                      dir="ltr"
                      value={row.key}
                      onChange={(e) => setRow(row.id, { key: e.target.value })}
                      placeholder="Authorization"
                      className="cell-input text-left font-mono !text-[12.5px]"
                    />
                  </td>
                  <td>
                    <input
                      dir="ltr"
                      value={row.value}
                      onChange={(e) =>
                        setRow(row.id, { value: e.target.value })
                      }
                      placeholder="Bearer {{token}}"
                      className="cell-input text-left font-mono !text-[12.5px]"
                    />
                  </td>
                  <td className="text-center">
                    <DeleteButton
                      aria-label="מחיקת Header"
                      onClick={() => removeRow(row.id)}
                      className="opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </DeleteButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <GhostButton
        icon={Plus}
        onClick={addRow}
        className={headers.length > 0 ? "mt-2.5" : ""}
      >
        הוסף Header
      </GhostButton>
    </div>
  );
}
