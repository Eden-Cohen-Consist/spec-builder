import { Field, Input, Textarea } from './ui.jsx'

export default function FreeTextBlock({ block, onUpdate }) {
  return (
    <div className="space-y-4">
      <Field label="כותרת">
        <Input
          dir="auto"
          value={block.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="על מה הבלוק הזה?"
        />
      </Field>
      <Field label="תיאור">
        <Textarea
          dir="auto"
          rows={5}
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="טקסט חופשי — הקשר, הערות, דרישות מיוחדות או כל דבר שחשוב שהמפתח יידע"
        />
      </Field>
    </div>
  )
}
