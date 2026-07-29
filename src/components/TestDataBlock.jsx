import { Plus, Trash2, CircleAlert } from 'lucide-react'
import { GhostButton, DeleteButton } from './ui.jsx'
import { makeTestRow } from '../lib.js'

export default function TestDataBlock({ block, errors, onUpdate }) {
  const setRow = (id, patch) =>
    onUpdate({ rows: block.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) })
  const removeRow = (id) => onUpdate({ rows: block.rows.filter((row) => row.id !== id) })
  const addRow = () => onUpdate({ rows: [...block.rows, makeTestRow()] })

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full min-w-[560px] text-[13.5px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
              <th className="w-[30%] px-3 py-2.5 text-start font-semibold">
                שדה <span className="text-red-500">*</span>
              </th>
              <th className="w-[32%] px-3 py-2.5 text-start font-semibold">
                ערך לבדיקה <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-2.5 text-start font-semibold">הערות</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {block.rows.map((row) => (
              <tr key={row.id} className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30">
                <td>
                  <input
                    value={row.key}
                    onChange={(e) => setRow(row.id, { key: e.target.value })}
                    placeholder="מספר טלפון"
                    className="cell-input font-medium"
                  />
                </td>
                <td>
                  <input
                    dir="auto"
                    value={row.value}
                    onChange={(e) => setRow(row.id, { value: e.target.value })}
                    placeholder="0501234567"
                    className="cell-input font-mono !text-[12.5px]"
                  />
                </td>
                <td>
                  <input
                    value={row.notes ?? ''}
                    onChange={(e) => setRow(row.id, { notes: e.target.value })}
                    placeholder="הערות לבדיקה..."
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
          </tbody>
        </table>
      </div>
      {errors.get('rows') && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
          <CircleAlert className="size-3.5 shrink-0" />
          {errors.get('rows')}
        </p>
      )}
      <GhostButton icon={Plus} onClick={addRow} className="mt-2.5">
        הוסף שורה
      </GhostButton>
    </div>
  )
}
