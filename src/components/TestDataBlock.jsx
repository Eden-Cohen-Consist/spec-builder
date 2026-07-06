import { Plus, Trash2 } from 'lucide-react'
import { GhostButton, DeleteButton } from './ui.jsx'
import { makeTestRow } from '../lib.js'

export default function TestDataBlock({ block, onUpdate }) {
  const setRow = (id, patch) =>
    onUpdate({ rows: block.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) })
  const removeRow = (id) => onUpdate({ rows: block.rows.filter((row) => row.id !== id) })
  const addRow = () => onUpdate({ rows: [...block.rows, makeTestRow()] })

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-stone-200">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500">
              <th className="w-[38%] px-3 py-2.5 text-start font-semibold">שדה</th>
              <th className="px-3 py-2.5 text-start font-semibold">ערך לבדיקה</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {block.rows.map((row) => (
              <tr key={row.id} className="group/row transition-colors hover:bg-stone-50/60">
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
      <GhostButton icon={Plus} onClick={addRow} className="mt-2.5">
        הוסף שורה
      </GhostButton>
    </div>
  )
}
