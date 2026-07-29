import { Plus, Trash2 } from "lucide-react";
import LockedSection from "./LockedSection.jsx";
import { Field, Input, Textarea, GhostButton, DeleteButton } from "./ui.jsx";
import { makeTriggerRow } from "../lib.js";

export default function BusinessSection({ value, onChange, issues = [], submitted = false, delay }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const setTrigger = (id, text) =>
    set({
      triggers: value.triggers.map((t) => (t.id === id ? { ...t, text } : t)),
    });
  const removeTrigger = (id) =>
    set({ triggers: value.triggers.filter((t) => t.id !== id) });
  const addTrigger = () =>
    set({ triggers: [...value.triggers, makeTriggerRow()] });

  return (
    <LockedSection
      id="section-business"
      number="2"
      title="צורך עסקי וטריגר"
      subtitle="למה בונים את זה, ומה מפעיל את התהליך"
      issues={issues}
      submitted={submitted}
      delay={delay}
    >
      <div className="space-y-4">
        <Field label="המטרה העסקית">
          <Textarea
            rows={4}
            value={value.goal}
            onChange={(e) => set({ goal: e.target.value })}
            placeholder="מה הצורך העסקי? איזו בעיה הפתרון פותר, ומה נחשב הצלחה?"
          />
        </Field>
        <div>
          <span className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
            {value.triggers.length > 1 ? "הטריגרים המדויקים" : "הטריגר המדויק"}
            <span className="font-normal text-stone-400 dark:text-stone-500">
              למשל: "לקוח פנה בווטסאפ"
            </span>
          </span>
          <div className="space-y-2">
            {value.triggers.map((trigger, index) => (
              <div
                key={trigger.id}
                className="group/trigger flex items-center gap-1.5"
              >
                <Input
                  value={trigger.text}
                  onChange={(e) => setTrigger(trigger.id, e.target.value)}
                  placeholder={
                    index === 0 ? "מה בדיוק מפעיל את התהליך?" : "טריגר נוסף..."
                  }
                />
                {value.triggers.length > 1 && (
                  <DeleteButton
                    aria-label="מחיקת טריגר"
                    onClick={() => removeTrigger(trigger.id)}
                    className="opacity-0 focus-visible:opacity-100 group-hover/trigger:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </DeleteButton>
                )}
              </div>
            ))}
          </div>
          <GhostButton icon={Plus} onClick={addTrigger} className="mt-2.5">
            הוסף טריגר
          </GhostButton>
        </div>
      </div>
    </LockedSection>
  );
}
