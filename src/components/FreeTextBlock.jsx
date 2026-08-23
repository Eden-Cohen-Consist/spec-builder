import { Field, Input, Textarea } from './ui.jsx'

export default function FreeTextBlock({ block, errors = new Map(), onUpdate }) {
  return (
    <div className="space-y-4">
      <Field label="כותרת">
        <Input
          dir="rtl"
          value={block.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="על מה הבלוק הזה?"
        />
      </Field>
      <Field label="תיאור" required error={errors.get('text')}>
        <Textarea
          dir="rtl"
          rows={5}
          value={block.text}
          invalid={errors.has('text')}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="טקסט חופשי — הקשר, הערות, דרישות מיוחדות או כל דבר שחשוב שהמפתח יידע"
        />
      </Field>
    </div>
  )
}
