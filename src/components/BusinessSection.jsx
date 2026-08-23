import { useMemo } from "react";
import LockedSection from "./LockedSection.jsx";
import { Field, Textarea } from "./ui.jsx";
import { fieldErrors } from "../validation/index.js";

export default function BusinessSection({ value, onChange, issues = [], submitted = false, delay }) {
  const errors = useMemo(() => fieldErrors(issues), [issues]);
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <LockedSection
      id="section-business"
      number="2"
      title="צורך עסקי"
      subtitle="למה בונים את זה ומה נחשב הצלחה"
      issues={issues}
      submitted={submitted}
      delay={delay}
    >
      <Field label="המטרה העסקית" required error={errors.get("goal")}>
        <Textarea
          dir="rtl"
          rows={4}
          value={value.goal}
          invalid={errors.has("goal")}
          onChange={(e) => set({ goal: e.target.value })}
          placeholder="מה הצורך העסקי? איזו בעיה הפתרון פותר, ומה נחשב הצלחה?"
        />
      </Field>
    </LockedSection>
  );
}
