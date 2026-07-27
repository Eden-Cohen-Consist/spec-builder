import { Field, Select, Textarea } from '../../ui.jsx'

const blockLabel = (block) => {
  const route = [block.source, block.destination].filter((part) => part?.trim()).join(' ← ')
  const call = [block.method, block.endpoint].filter((part) => part?.trim()).join(' ')
  return call || route || 'בלוק אינטגרציה ללא פרטים'
}

/**
 * Links to an existing HTTP block instead of duplicating its fields — the full request
 * stays defined once, in the "בלוקים טכניים" section.
 */
export default function HttpRequestNodePanel({ node, blocks, onConfig }) {
  const config = node.config ?? {}
  const httpBlocks = blocks.filter((block) => block.type === 'http')
  const missing = config.blockId && !httpBlocks.some((block) => block.id === config.blockId)

  return (
    <div className="space-y-4">
      <Field label="בלוק האינטגרציה" hint="מסעיף הבלוקים הטכניים">
        {httpBlocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-200 px-3 py-2.5 text-[13px] text-stone-400 dark:border-stone-700 dark:text-stone-500">
            עדיין לא הוגדרו בלוקי אינטגרציה — הוסיפו בלוק &quot;HTTP Request&quot; בהמשך העמוד
          </p>
        ) : (
          <Select value={config.blockId ?? ''} onChange={(e) => onConfig({ blockId: e.target.value })}>
            <option value="">ללא בלוק מוצמד</option>
            {httpBlocks.map((block) => (
              <option key={block.id} value={block.id}>
                {blockLabel(block)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {missing && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          הבלוק המוצמד נמחק — יש לבחור בלוק אחר
        </p>
      )}

      <Field label="הערות" hint="לא חובה">
        <Textarea
          rows={3}
          value={config.notes ?? ''}
          onChange={(e) => onConfig({ notes: e.target.value })}
          placeholder="מה נשלח בקריאה הזו ומה נעשה עם התשובה"
        />
      </Field>
    </div>
  )
}
