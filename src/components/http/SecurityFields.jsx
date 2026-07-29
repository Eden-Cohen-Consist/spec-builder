import { ShieldCheck } from "lucide-react";
import { Field, Textarea, Select, Checkbox } from "../ui.jsx";
import { AUTH_TYPES } from "../../constants.js";

export default function SecurityFields({ block, errors, onUpdate }) {
  return (
    <div className="mt-6 border-t border-stone-100 pt-5 dark:border-stone-800">
      <h4 className="mb-3 flex items-center gap-1.5 text-[13.5px] font-bold text-stone-700 dark:text-stone-300">
        <ShieldCheck className="size-4 text-blue-700 dark:text-blue-400" />
        אבטחה וטיפול בשגיאות
      </h4>
      <div className="space-y-4">
        <Field label="סוג אימות" hint="איך הקריאה מזוהה מול מערכת היעד">
          <Select
            value={block.authType}
            onChange={(e) => onUpdate({ authType: e.target.value })}
            wrapperClassName="sm:w-1/2"
          >
            {AUTH_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-1">
          <div className="rounded-xl border border-stone-200 p-3.5 dark:border-stone-800">
            <Checkbox
              checked={block.ipWhitelistRequired}
              onChange={(ipWhitelistRequired) =>
                onUpdate({ ipWhitelistRequired })
              }
              label="נדרשת החרגת כתובות IP (Whitelist)"
            />
            {block.ipWhitelistRequired && (
              <Field
                label="כתובות IP להחרגה"
                hint="כתובת אחת בכל שורה"
                required
                error={errors.get("whitelistedIps")}
                className="animate-pop mt-3"
              >
                <Textarea
                  dir="ltr"
                  rows={3}
                  value={block.whitelistedIps}
                  invalid={errors.has("whitelistedIps")}
                  onChange={(e) => onUpdate({ whitelistedIps: e.target.value })}
                  placeholder={"203.0.113.10\n198.51.100.0/24"}
                  className="text-left font-mono !text-[12.5px]"
                />
              </Field>
            )}
          </div>
          <div className="rounded-xl border border-stone-200 p-3.5 dark:border-stone-800">
            <Checkbox
              checked={block.certificateRequired}
              onChange={(certificateRequired) =>
                onUpdate({ certificateRequired })
              }
              label="נדרשת תעודה (Certificate)"
            />
            {block.certificateRequired && (
              <Field
                label="פרטי התעודה"
                hint="סוג, פורמט והנחיות מסירה"
                required
                error={errors.get("certificateDetails")}
                className="animate-pop mt-3"
              >
                <Textarea
                  rows={3}
                  value={block.certificateDetails}
                  invalid={errors.has("certificateDetails")}
                  onChange={(e) =>
                    onUpdate({ certificateDetails: e.target.value })
                  }
                  placeholder="למשל: תעודת mTLS בפורמט PEM"
                />
              </Field>
            )}
          </div>
        </div>
        <Field label="הערות כלליות" hint="מה קורה כשמתקבלת שגיאת 400/500?">
          <Textarea
            rows={3}
            value={block.fallback}
            onChange={(e) => onUpdate({ fallback: e.target.value })}
            placeholder="ניסיונות חוזרים? התראה לצוות? הודעה ללקוח? תיעוד בלוג?"
          />
        </Field>
      </div>
    </div>
  );
}
