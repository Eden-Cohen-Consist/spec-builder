import LockedSection from './LockedSection.jsx'
import { Field, Input, Textarea } from './ui.jsx'

export default function BusinessSection({ value, onChange, delay }) {
  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <LockedSection number="2" title="צורך עסקי וטריגר" subtitle="למה בונים את זה, ומה מפעיל את התהליך" delay={delay}>
      <div className="space-y-4">
        <Field label="המטרה העסקית">
          <Textarea
            rows={4}
            value={value.goal}
            onChange={(e) => set({ goal: e.target.value })}
            placeholder="מה הצורך העסקי? איזו בעיה הפתרון פותר, ומה נחשב הצלחה?"
          />
        </Field>
        <Field label="הטריגר המדויק" hint='למשל: "בעת סגירת טיקט"'>
          <Input
            value={value.trigger}
            onChange={(e) => set({ trigger: e.target.value })}
            placeholder="מה בדיוק מפעיל את התהליך?"
          />
        </Field>
      </div>
    </LockedSection>
  )
}
