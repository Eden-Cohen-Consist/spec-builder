import { Field, Input, Select, Textarea } from '../../ui.jsx'
import { DELAY_UNITS, DELAY_UNIT_LABELS } from '../../../workflow/constants.js'

/** Bodies for the node types that need little or no extra configuration. */
export default function SimpleNodePanel({ node, onConfig }) {
  const config = node.config ?? {}

  if (node.type === 'DELAY') {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Field label="משך ההמתנה">
          <Input
            inputMode="numeric"
            value={config.duration ?? ''}
            onChange={(e) => onConfig({ duration: e.target.value })}
            placeholder="15"
          />
        </Field>
        <Field label="יחידת זמן">
          <Select value={config.unit ?? 'MINUTES'} onChange={(e) => onConfig({ unit: e.target.value })}>
            {DELAY_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {DELAY_UNIT_LABELS[unit]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    )
  }

  if (node.type === 'PARALLEL') {
    return (
      <Field label="הערות" hint="מה רץ במקביל">
        <Textarea
          rows={3}
          value={config.notes ?? ''}
          onChange={(e) => onConfig({ notes: e.target.value })}
          placeholder="פרטו אילו מסלולים רצים יחד ומה צריך להסתיים לפני ההמשך"
        />
      </Field>
    )
  }

  return null
}
