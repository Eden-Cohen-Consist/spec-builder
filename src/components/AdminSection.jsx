import { Plus, Trash2 } from 'lucide-react'
import LockedSection from './LockedSection.jsx'
import { Field, Input, Checkbox, GhostButton, DeleteButton } from './ui.jsx'
import { makeContactRow, hasContactContent } from '../lib.js'

const invalidCell = 'rounded-lg ring-2 ring-inset ring-red-400/70 dark:ring-red-500/50'

export default function AdminSection({ value, onChange, invalid, delay }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const setContact = (id, patch) =>
    set({ contacts: value.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  const removeContact = (id) => set({ contacts: value.contacts.filter((c) => c.id !== id) })
  const addContact = () => set({ contacts: [...value.contacts, makeContactRow()] })

  return (
    <LockedSection
      id="section-admin"
      number="1"
      title="הקשר אדמיניסטרטיבי"
      subtitle="מי הלקוח ומי מוביל את הפרויקט"
      delay={delay}
    >
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
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
          אנשי קשר
          <span className="font-normal text-stone-400 dark:text-stone-500">
            שם — חובה · אימייל או טלפון — לפחות אחד
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="w-full min-w-[560px] text-[13.5px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <th className="w-[24%] px-3 py-2.5 text-start font-semibold">
                  שם מלא <span className="text-red-500">*</span>
                </th>
                <th className="w-[26%] px-3 py-2.5 text-start font-semibold">אימייל</th>
                <th className="w-[20%] px-3 py-2.5 text-start font-semibold">טלפון</th>
                <th className="px-3 py-2.5 text-start font-semibold">תפקיד</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {value.contacts.map((contact) => {
                const dirty = hasContactContent(contact)
                const nameMissing = invalid && dirty && !contact.name.trim()
                const reachMissing =
                  invalid && dirty && !contact.email.trim() && !contact.phone.trim()
                return (
                  <tr key={contact.id} className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30">
                    <td>
                      <input
                        value={contact.name}
                        onChange={(e) => setContact(contact.id, { name: e.target.value })}
                        placeholder="ישראל ישראלי"
                        className={`cell-input font-medium ${nameMissing ? invalidCell : ''}`}
                      />
                    </td>
                    <td>
                      <input
                        dir="ltr"
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact(contact.id, { email: e.target.value })}
                        placeholder="israel@client.co.il"
                        className={`cell-input text-left font-mono !text-[12.5px] ${reachMissing ? invalidCell : ''}`}
                      />
                    </td>
                    <td>
                      <input
                        dir="ltr"
                        value={contact.phone}
                        onChange={(e) => setContact(contact.id, { phone: e.target.value })}
                        placeholder="050-1234567"
                        className={`cell-input text-left font-mono !text-[12.5px] ${reachMissing ? invalidCell : ''}`}
                      />
                    </td>
                    <td>
                      <input
                        value={contact.jobTitle}
                        onChange={(e) => setContact(contact.id, { jobTitle: e.target.value })}
                        placeholder="מנהל IT"
                        className="cell-input"
                      />
                    </td>
                    <td className="text-center">
                      {value.contacts.length > 1 && (
                        <DeleteButton
                          aria-label="מחיקת איש קשר"
                          onClick={() => removeContact(contact.id)}
                          className="opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100"
                        >
                          <Trash2 className="size-3.5" />
                        </DeleteButton>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <GhostButton icon={Plus} onClick={addContact} className="mt-2.5">
          הוסף איש קשר
        </GhostButton>
      </div>

      <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
        <Checkbox
          checked={value.departmentCreated}
          onChange={(departmentCreated) => set({ departmentCreated })}
          label="הוקמה מחלקה במערכת?"
        />
        {value.departmentCreated && (
          <div className="animate-pop mt-3.5 sm:w-1/2">
            <Field label="מזהה המחלקה (Department ID)">
              <Input
                dir="ltr"
                value={value.departmentId}
                onChange={(e) => set({ departmentId: e.target.value })}
                placeholder="dep_12345"
                className="text-left font-mono !text-[13.5px]"
              />
            </Field>
          </div>
        )}
      </div>
    </LockedSection>
  )
}
