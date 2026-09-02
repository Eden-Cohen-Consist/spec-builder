import { useMemo } from "react";
import { Trash2, CircleAlert } from "lucide-react";
import LockedSection from "./LockedSection.jsx";
import { Field, Input, Checkbox, DeleteButton, GhostAddRow, invalidCell } from "./ui.jsx";
import { makeContactRow, makeDepartmentRow } from "../lib.js";
import { fieldErrors } from "../validation/index.js";

export default function AdminSection({ value, onChange, issues = [], submitted = false, delay }) {
  const errors = useMemo(() => fieldErrors(issues), [issues]);
  const set = (patch) => onChange({ ...value, ...patch });
  const setContact = (id, patch) =>
    set({
      contacts: value.contacts.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });
  const removeContact = (id) =>
    set({ contacts: value.contacts.filter((c) => c.id !== id) });
  const addContact = () =>
    set({ contacts: [...value.contacts, makeContactRow()] });
  const setDepartment = (id, patch) =>
    set({
      departments: value.departments.map((department) =>
        department.id === id ? { ...department, ...patch } : department,
      ),
    });
  const removeDepartment = (id) =>
    set({
      departments: value.departments.filter(
        (department) => department.id !== id,
      ),
    });
  const addDepartment = () =>
    set({ departments: [...value.departments, makeDepartmentRow()] });

  return (
    <LockedSection
      id="section-admin"
      number="1"
      title="הקשר אדמיניסטרטיבי"
      subtitle="מי הלקוח ומי מוביל את הפרויקט"
      issues={issues}
      submitted={submitted}
      delay={delay}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="שם הלקוח" required error={errors.get("clientName")}>
          <Input
            value={value.clientName}
            invalid={errors.has("clientName")}
            onChange={(e) => set({ clientName: e.target.value })}
            placeholder="למשל: סופר פארם"
          />
        </Field>
        <Field label="שם מנהל/ת הפרויקט" required error={errors.get("pmName")}>
          <Input
            value={value.pmName}
            invalid={errors.has("pmName")}
            onChange={(e) => set({ pmName: e.target.value })}
            placeholder="מי מוביל את האפיון?"
          />
        </Field>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
          <span>
            אנשי קשר
            <span className="text-red-500"> *</span>
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
          <table className="w-full min-w-[560px] text-[13.5px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <th className="w-[24%] px-3 py-2.5 text-start font-semibold">
                  שם מלא <span className="text-red-500">*</span>
                </th>
                <th className="w-[26%] px-3 py-2.5 text-start font-semibold">
                  אימייל
                </th>
                <th className="w-[20%] px-3 py-2.5 text-start font-semibold">
                  טלפון
                </th>
                <th className="px-3 py-2.5 text-start font-semibold">תפקיד</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {value.contacts.map((contact) => {
                const nameMissing = errors.has(`contactName#${contact.id}`);
                const reachMissing = errors.has(`contactReach#${contact.id}`);
                return (
                  <tr
                    key={contact.id}
                    className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30"
                  >
                    <td>
                      <input
                        value={contact.name}
                        onChange={(e) =>
                          setContact(contact.id, { name: e.target.value })
                        }
                        placeholder="ישראל ישראלי"
                        aria-invalid={nameMissing}
                        title={errors.get(`contactName#${contact.id}`)}
                        className={`cell-input font-medium ${nameMissing ? invalidCell : ""}`}
                      />
                    </td>
                    <td>
                      <input
                        dir="ltr"
                        type="email"
                        value={contact.email}
                        onChange={(e) =>
                          setContact(contact.id, { email: e.target.value })
                        }
                        placeholder="israel@client.co.il"
                        aria-invalid={reachMissing}
                        title={errors.get(`contactReach#${contact.id}`)}
                        className={`cell-input text-left font-mono !text-[12.5px] ${reachMissing ? invalidCell : ""}`}
                      />
                    </td>
                    <td>
                      <input
                        dir="ltr"
                        value={contact.phone}
                        onChange={(e) =>
                          setContact(contact.id, { phone: e.target.value })
                        }
                        placeholder="050-1234567"
                        aria-invalid={reachMissing}
                        title={errors.get(`contactReach#${contact.id}`)}
                        className={`cell-input text-left font-mono !text-[12.5px] ${reachMissing ? invalidCell : ""}`}
                      />
                    </td>
                    <td>
                      <input
                        value={contact.jobTitle}
                        onChange={(e) =>
                          setContact(contact.id, { jobTitle: e.target.value })
                        }
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
                );
              })}
              <GhostAddRow colSpan={5} label="הוסף איש קשר" onAdd={addContact} />
            </tbody>
          </table>
        </div>
        {errors.get("contacts") && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
            <CircleAlert className="size-3.5 shrink-0" />
            {errors.get("contacts")}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
        <Checkbox
          checked={value.departmentCreated}
          onChange={(departmentCreated) => set({ departmentCreated })}
          label="הוקמה מחלקה במערכת?"
        />
        {value.departmentCreated && (
          <div className="animate-pop mt-3.5">
            <div className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
              פרטי מחלקות
              <span className="font-normal text-stone-400 dark:text-stone-500">
                ניתן להוסיף מספר מחלקות
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full min-w-[680px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[12px] font-semibold text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                    <th className="w-[30%] px-3 py-2.5 text-start font-semibold">
                      שם המחלקה <span className="text-red-500">*</span>
                    </th>
                    <th className="w-[22%] px-3 py-2.5 text-start font-semibold">
                      מזהה קצר
                    </th>
                    <th className="px-3 py-2.5 text-start font-semibold">
                      מזהה מחלקה (API Key)
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {value.departments.map((department) => (
                    <tr
                      key={department.id}
                      className="group/row transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/30"
                    >
                      <td>
                        <input
                          value={department.name}
                          onChange={(e) =>
                            setDepartment(department.id, {
                              name: e.target.value,
                            })
                          }
                          placeholder="שירות לקוחות"
                          aria-invalid={errors.has(`departmentName#${department.id}`)}
                          title={errors.get(`departmentName#${department.id}`)}
                          className={`cell-input font-medium ${
                            errors.has(`departmentName#${department.id}`) ? invalidCell : ""
                          }`}
                        />
                      </td>
                      <td>
                        <input
                          dir="ltr"
                          value={department.shortId}
                          onChange={(e) =>
                            setDepartment(department.id, {
                              shortId: e.target.value,
                            })
                          }
                          placeholder="12345"
                          className="cell-input text-left font-mono !text-[12.5px]"
                        />
                      </td>
                      <td>
                        <input
                          dir="ltr"
                          value={department.uuid}
                          onChange={(e) =>
                            setDepartment(department.id, {
                              uuid: e.target.value,
                            })
                          }
                          placeholder="550e8400-e29b-41d4-a716-446655440000"
                          className="cell-input text-left font-mono !text-[12px]"
                        />
                      </td>
                      <td className="text-center">
                        {value.departments.length > 1 && (
                          <DeleteButton
                            aria-label="מחיקת מחלקה"
                            onClick={() => removeDepartment(department.id)}
                            className="opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100"
                          >
                            <Trash2 className="size-3.5" />
                          </DeleteButton>
                        )}
                      </td>
                    </tr>
                  ))}
                  <GhostAddRow
                    colSpan={4}
                    label="הוסף מחלקה"
                    onAdd={addDepartment}
                  />
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </LockedSection>
  );
}
