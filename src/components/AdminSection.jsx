import LockedSection from './LockedSection.jsx'
import { Field, Input, Textarea, Checkbox } from './ui.jsx'

export default function AdminSection({ value, onChange, delay }) {
  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <LockedSection number="1" title="הקשר אדמיניסטרטיבי" subtitle="מי הלקוח ומי מוביל את הפרויקט" delay={delay}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="שם הלקוח">
          <Input
            value={value.clientName}
            onChange={(e) => set({ clientName: e.target.value })}
            placeholder="למשל: סופר פארם"
          />
        </Field>
        <Field label="שם מנהל/ת הפרויקט">
          <Input
            value={value.pmName}
            onChange={(e) => set({ pmName: e.target.value })}
            placeholder="מי מוביל את האפיון?"
          />
        </Field>
        <Field label="אנשי קשר" hint="שם, תפקיד וטלפון/אימייל — איש קשר בכל שורה" className="sm:col-span-2">
          <Textarea
            rows={2}
            value={value.contacts}
            onChange={(e) => set({ contacts: e.target.value })}
            placeholder={'ישראל ישראלי, מנהל IT, israel@client.co.il'}
          />
        </Field>
      </div>
      <div className="mt-4 border-t border-stone-100 pt-4">
        <Checkbox
          checked={value.departmentCreated}
          onChange={(departmentCreated) => set({ departmentCreated })}
          label="הוקמה מחלקה במערכת?"
        />
      </div>
    </LockedSection>
  )
}
