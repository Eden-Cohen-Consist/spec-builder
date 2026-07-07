import { MoveLeft, Globe, Plus, Trash2, ChevronDown } from 'lucide-react'
import { Field, Input, Select, Checkbox, GhostButton, DeleteButton } from './ui.jsx'
import { FIELD_TYPES, HTTP_METHODS } from '../constants.js'
import { isThirdParty, makeMappingRow, makeHeaderRow } from '../lib.js'

function PayloadEditor({ label, value, onChange, invalid }) {
  return (
    <Field label={<span dir="ltr">{label}</span>} hint={invalid ? 'שדה חובה' : undefined}>
      <textarea
        dir="ltr"
        spellCheck={false}
        rows={7}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'{\n  "ticketId": 12345,\n  "customer": { "phone": "0501234567" }\n}'}
        className={`code-scroll w-full resize-y rounded-lg bg-[#161412] p-3.5 text-left font-mono text-[12.5px] leading-relaxed text-stone-200 caret-teal-400 outline-none ring-1 transition-shadow duration-150 placeholder:text-stone-600 ${
          invalid ? 'ring-2 ring-red-500' : 'ring-stone-700/80 focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500'
        }`}
      />
    </Field>
  )
}

function HeadersEditor({ headers, onChange }) {
  const setRow = (id, patch) =>
    onChange(headers.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  const removeRow = (id) => onChange(headers.filter((row) => row.id !== id))
  const addRow = () => onChange([...headers, makeHeaderRow()])

  return (
    <div className="mt-5">
      <h4 className="mb-2 text-[13.5px] font-bold text-stone-700 dark:text-stone-300">
        Headers <span className="font-normal text-stone-400 dark:text-stone-500">(אופציונלי)</span>
      </h4>
      {headers.length > 0 && (
        <div className="animate-block-in overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <th className="w-[38%] px-3 py-2.5 text-start font-semibold">Key</th>
                <th className="px-3 py-2.5 text-start font-semibold">Value</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {headers.map((row) => (
                <tr key={row.id} className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30">
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
                      onChange={(e) => setRow(row.id, { value: e.target.value })}
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
      <GhostButton icon={Plus} onClick={addRow} className={headers.length > 0 ? 'mt-2.5' : ''}>
        הוסף Header
      </GhostButton>
    </div>
  )
}

function MappingTable({ mapping, onChange }) {
  const setRow = (id, patch) =>
    onChange(mapping.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  const removeRow = (id) => onChange(mapping.filter((row) => row.id !== id))
  const addRow = () => onChange([...mapping, makeMappingRow()])

  return (
    <div className="mt-5">
      <h4 className="mb-2 text-[13.5px] font-bold text-stone-700 dark:text-stone-300">מיפוי שדות (Data Mapping)</h4>
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full min-w-[560px] text-[13.5px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
              <th className="w-[22%] px-3 py-2.5 text-start font-semibold">שדה מקור</th>
              <th className="w-[22%] px-3 py-2.5 text-start font-semibold">שדה יעד</th>
              <th className="w-[15%] px-3 py-2.5 text-start font-semibold">סוג</th>
              <th className="w-[8%] px-2 py-2.5 text-center font-semibold">חובה</th>
              <th className="px-3 py-2.5 text-start font-semibold">הערות</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {mapping.map((row) => (
              <tr key={row.id} className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30">
                <td>
                  <input
                    dir="ltr"
                    value={row.sourceField}
                    onChange={(e) => setRow(row.id, { sourceField: e.target.value })}
                    placeholder="customer_phone"
                    className="cell-input text-left font-mono !text-[12.5px]"
                  />
                </td>
                <td>
                  <input
                    dir="ltr"
                    value={row.targetField}
                    onChange={(e) => setRow(row.id, { targetField: e.target.value })}
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
          </tbody>
        </table>
      </div>
      <GhostButton icon={Plus} onClick={addRow} className="mt-2.5">
        הוסף שורה
      </GhostButton>
    </div>
  )
}

export default function HttpBlock({ block, invalid, onUpdate }) {
  const thirdParty = isThirdParty(block.destination)

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <Field label="מערכת מקור">
          <Input
            dir="auto"
            value={block.source}
            onChange={(e) => onUpdate({ source: e.target.value })}
            placeholder="Glassix"
          />
        </Field>
        <MoveLeft aria-hidden="true" className="mb-2.5 size-5 text-stone-300 dark:text-stone-600" />
        <Field
          label={
            <span className="flex items-center gap-2">
              מערכת יעד
              {thirdParty && (
                <span className="animate-pop inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-px text-[11px] font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-400">
                  <Globe className="size-3" />
                  צד שלישי
                </span>
              )}
            </span>
          }
        >
          <Input
            dir="auto"
            value={block.destination}
            onChange={(e) => onUpdate({ destination: e.target.value })}
            placeholder="Salesforce / Priority / Consist..."
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-[128px_1fr] items-end gap-3">
        <Field label="Method">
          <Select
            value={block.method}
            onChange={(e) => onUpdate({ method: e.target.value })}
            className="font-mono !text-[13.5px]"
          >
            {HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={<span dir="ltr">Endpoint</span>} hint="כתובת ה-API המלאה">
          <Input
            dir="ltr"
            value={block.endpoint}
            onChange={(e) => onUpdate({ endpoint: e.target.value })}
            placeholder="https://api.example.com/v1/tickets"
            className="text-left font-mono !text-[13.5px]"
          />
        </Field>
      </div>

      <HeadersEditor headers={block.headers} onChange={(headers) => onUpdate({ headers })} />

      {thirdParty && (
        <div className="animate-block-in mt-5 space-y-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
            <Globe className="size-3.5 text-amber-600 dark:text-amber-400" />
            אינטגרציה מול מערכת חיצונית — חובה לצרף את מבני ה-JSON המלאים
          </p>
          <PayloadEditor
            label="Request JSON Payload"
            value={block.requestPayload}
            onChange={(requestPayload) => onUpdate({ requestPayload })}
            invalid={invalid && !block.requestPayload.trim()}
          />
          <PayloadEditor
            label="Response JSON Payload"
            value={block.responsePayload}
            onChange={(responsePayload) => onUpdate({ responsePayload })}
            invalid={invalid && !block.responsePayload.trim()}
          />
        </div>
      )}

      <MappingTable mapping={block.mapping} onChange={(mapping) => onUpdate({ mapping })} />
    </div>
  )
}
