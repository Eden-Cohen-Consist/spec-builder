import { Play, Flag, GitBranch, Globe, Zap } from 'lucide-react'

export const WORKFLOW_TRIGGER_TYPES = ['MANUAL', 'FORM_SUBMIT', 'WEBHOOK', 'EVENT', 'SCHEDULE']

export const TRIGGER_LABELS = {
  MANUAL: 'הפעלה ידנית',
  FORM_SUBMIT: 'שליחת טופס',
  WEBHOOK: 'Webhook נכנס',
  EVENT: 'אירוע במערכת',
  SCHEDULE: 'לפי לוח זמנים',
}

// Shown under the trigger select so a PM knows what to write in the free-text field
export const TRIGGER_HINTS = {
  MANUAL: 'מי מפעיל את התהליך ומתי',
  FORM_SUBMIT: 'איזה טופס נשלח ועל ידי מי',
  WEBHOOK: 'איזו מערכת שולחת את הקריאה ומתי',
  EVENT: 'איזה אירוע במערכת מפעיל את התהליך',
  SCHEDULE: 'באיזו תדירות ובאיזו שעה',
}

export const WORKFLOW_NODE_TYPES = ['START', 'ACTION', 'DECISION', 'HTTP_REQUEST', 'END']

// Same shape as BLOCK_META in src/constants.js so node cards reuse the block accent vocabulary
export const NODE_META = {
  START: {
    label: 'התחלה',
    hint: 'נקודת הכניסה לתהליך',
    icon: Play,
    accent: '#0f766e',
    accentDark: '#2dd4bf',
    tint: 'rgba(15, 118, 110, 0.08)',
  },
  ACTION: {
    label: 'פעולה',
    hint: 'שלב שמתאר מה קורה בתהליך',
    icon: Zap,
    accent: '#0f766e',
    accentDark: '#2dd4bf',
    tint: 'rgba(15, 118, 110, 0.08)',
  },
  DECISION: {
    label: 'תנאי',
    hint: 'פיצול התהליך לכמה מסלולים לפי תנאי',
    icon: GitBranch,
    accent: '#b45309',
    accentDark: '#fbbf24',
    tint: 'rgba(180, 83, 9, 0.08)',
  },
  HTTP_REQUEST: {
    label: 'קריאת API',
    hint: 'מפנה לבלוק אינטגרציה מסעיף הבלוקים הטכניים',
    icon: Globe,
    accent: '#1d4ed8',
    accentDark: '#60a5fa',
    tint: 'rgba(29, 78, 216, 0.08)',
  },
  END: {
    label: 'סיום',
    hint: 'נקודת היציאה מהתהליך',
    icon: Flag,
    accent: '#57534e',
    accentDark: '#a8a29e',
    tint: 'rgba(87, 83, 78, 0.08)',
  },
}
