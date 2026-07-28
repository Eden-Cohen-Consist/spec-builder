import { Field } from "../ui.jsx";

export default function PayloadEditor({ label, value, onChange, invalid }) {
  return (
    <Field
      label={<span dir="ltr">{label}</span>}
      hint={invalid ? "שדה חובה" : undefined}
    >
      <textarea
        dir="ltr"
        spellCheck={false}
        rows={7}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          '{\n  "ticketId": 12345,\n  "customer": { "phone": "0501234567" }\n}'
        }
        className={`code-scroll w-full resize-y rounded-lg bg-[#161412] p-3.5 text-left font-mono text-[12.5px] leading-relaxed text-stone-200 caret-teal-400 outline-none ring-1 transition-shadow duration-150 placeholder:text-stone-600 ${
          invalid
            ? "ring-2 ring-red-500"
            : "ring-stone-700/80 focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500"
        }`}
      />
    </Field>
  );
}
