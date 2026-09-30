import { ConfigProvider, Steps, theme } from 'antd'

const STEPS = [
  { title: 'הקשר וצורך', description: 'פרטי לקוח ומטרה' },
  { title: 'תרשים זרימה', description: 'תהליכים עסקיים' },
  { title: 'בלוקים טכניים', description: 'אינטגרציות ונתונים' },
  { title: 'שיחה עם ה-AI', description: 'גיבוש האפיון הסופי' },
]

export default function WizardStepper({ step, maxReached, onSelect, dark }) {
  const items = STEPS.map((item, index) => {
    const n = index + 1
    const reached = n <= maxReached
    return {
      title: item.title,
      content: item.description,
      disabled: !reached,
      status: n === step ? 'process' : reached ? 'finish' : 'wait',
    }
  })

  return (
    <nav
      aria-label="שלבי האפיון"
      className="border-b border-stone-200/70 bg-paper/80 dark:border-stone-800/80"
    >
      <div className="form-shell py-4">
        <ConfigProvider
          direction="rtl"
          theme={{
            algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: dark ? '#14b8a6' : '#0d9488',
              colorText: dark ? '#e9e6e2' : '#1c1917',
              colorTextDescription: dark ? '#78716c' : '#a8a29e',
              colorBgContainer: 'transparent',
              fontFamily: '"Google Sans", "Assistant", ui-sans-serif, system-ui, sans-serif',
            },
          }}
        >
          <Steps
            current={step - 1}
            items={items}
            titlePlacement="vertical"
            responsive={false}
            size="small"
            onChange={(index) => {
              const n = index + 1
              if (n <= maxReached) onSelect(n)
            }}
          />
        </ConfigProvider>
      </div>
    </nav>
  )
}
