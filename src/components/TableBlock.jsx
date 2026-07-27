import { Plus, Trash2, X } from 'lucide-react'
import { Field, Input, Textarea, GhostButton, DeleteButton } from './ui.jsx'
import { makeTableColumn, makeTableRow } from '../lib.js'

export default function TableBlock({ block, onUpdate }) {
  const setColumn = (id, label) =>
    onUpdate({ columns: block.columns.map((col) => (col.id === id ? { ...col, label } : col)) })
  const addColumn = () => onUpdate({ columns: [...block.columns, makeTableColumn()] })
  const removeColumn = (id) =>
    onUpdate({
      columns: block.columns.filter((col) => col.id !== id),
      rows: block.rows.map((row) => {
        const { [id]: _removed, ...cells } = row.cells
        return { ...row, cells }
      }),
    })

  const setCell = (rowId, colId, cellValue) =>
    onUpdate({
      rows: block.rows.map((row) =>
        row.id === rowId ? { ...row, cells: { ...row.cells, [colId]: cellValue } } : row,
      ),
    })
  const addRow = () => onUpdate({ rows: [...block.rows, makeTableRow()] })
  const removeRow = (id) => onUpdate({ rows: block.rows.filter((row) => row.id !== id) })

  return (
    <div>
      <Field label="שם הטבלה" hint="על מה הטבלה?" className="mb-4 sm:w-1/2">
        <Input
          value={block.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="למשל: סטטוסים אפשריים"
        />
      </Field>

      <Field label="טקסט חופשי" hint="אופציונלי — הסבר או הנחיות לטבלה" className="mb-4">
        <Textarea
          rows={3}
          value={block.freeText ?? ''}
          onChange={(e) => onUpdate({ freeText: e.target.value })}
          placeholder="מידע נוסף שהטבלה לבדה לא מתארת..."
        />
      </Field>

      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full min-w-[420px] text-[13.5px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-800/50">
              {block.columns.map((col, i) => (
                <th key={col.id} className="group/col p-0 text-start">
                  <span className="flex items-center">
                    <input
                      value={col.label}
                      onChange={(e) => setColumn(col.id, e.target.value)}
                      placeholder={`עמודה ${i + 1}`}
                      className="cell-input !py-2.5 !text-[12.5px] font-bold"
                    />
                    {block.columns.length > 1 && (
                      <DeleteButton
                        aria-label="מחיקת עמודה"
                        onClick={() => removeColumn(col.id)}
                        className="me-1 !p-1 opacity-0 focus-visible:opacity-100 group-hover/col:opacity-100"
                      >
                        <X className="size-3.5" />
                      </DeleteButton>
                    )}
                  </span>
                </th>
              ))}
              <th className="w-10 text-center">
                <button
                  type="button"
                  aria-label="הוספת עמודה"
                  title="הוספת עמודה"
                  onClick={addColumn}
                  className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-teal-600/10 hover:text-teal-700 dark:text-stone-500 dark:hover:text-teal-400"
                >
                  <Plus className="size-3.5" strokeWidth={3} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {block.rows.map((row) => (
              <tr key={row.id} className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30">
                {block.columns.map((col) => (
                  <td key={col.id}>
                    <input
                      dir="auto"
                      value={row.cells[col.id] ?? ''}
                      onChange={(e) => setCell(row.id, col.id, e.target.value)}
                      placeholder="..."
                      className="cell-input"
                    />
                  </td>
                ))}
                <td className="text-center">
                  {block.rows.length > 1 && (
                    <DeleteButton
                      aria-label="מחיקת שורה"
                      onClick={() => removeRow(row.id)}
                      className="opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </DeleteButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 flex gap-2.5">
        <GhostButton icon={Plus} onClick={addRow}>
          הוסף שורה
        </GhostButton>
        <GhostButton icon={Plus} onClick={addColumn}>
          הוסף עמודה
        </GhostButton>
      </div>
    </div>
  )
}
