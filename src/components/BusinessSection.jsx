import { useMemo } from "react";
import { Plus, Trash2, CircleAlert } from "lucide-react";
import LockedSection from "./LockedSection.jsx";
import { Field, Input, Textarea, GhostButton, DeleteButton } from "./ui.jsx";
import { makeTriggerRow } from "../lib.js";
import { fieldErrors } from "../validation/index.js";

export default function BusinessSection({ value, onChange, issues = [], submitted = false, delay }) {
  const errors = useMemo(() => fieldErrors(issues), [issues]);
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
        <Field label="המטרה העסקית" required error={errors.get("goal")}>
          <Textarea
            rows={4}
            value={value.goal}
            invalid={errors.has("goal")}
            onChange={(e) => set({ goal: e.target.value })}
            placeholder="מה הצורך העסקי? איזו בעיה הפתרון פותר, ומה נחשב הצלחה?"
          />
        </Field>
        <div>
          <span className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-stone-600 dark:text-stone-300">
            <span>
              {value.triggers.length > 1 ? "הטריגרים המדויקים" : "הטריגר המדויק"}
              <span className="text-red-500"> *</span>
            </span>
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
                  invalid={errors.has("triggers") && index === 0}
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
          {errors.get("triggers") && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
              <CircleAlert className="size-3.5 shrink-0" />
              {errors.get("triggers")}
            </p>
          )}
          <GhostButton icon={Plus} onClick={addTrigger} className="mt-2.5">
            הוסף טריגר
          </GhostButton>
        </div>
      </div>
    </LockedSection>
  );
}
