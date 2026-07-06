import { Field, Select, Textarea } from './ui.jsx'
import { AUTH_TYPES } from '../constants.js'

export default function SecurityBlock({ block, onUpdate }) {
  return (
    <div className="space-y-4">
      <Field label="סוג אימות (Authentication)" className="sm:w-1/2">
        <Select value={block.authType} onChange={(e) => onUpdate({ authType: e.target.value })}>
          {AUTH_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="התנהגות במקרה שגיאה (Fallback)" hint="מה קורה כשמתקבלת שגיאת 400/500?">
        <Textarea
          rows={4}
          value={block.fallback}
          onChange={(e) => onUpdate({ fallback: e.target.value })}
          placeholder="ניסיונות חוזרים? התראה לצוות? הודעה ללקוח? תיעוד בלוג?"
        />
      </Field>
    </div>
  )
}
