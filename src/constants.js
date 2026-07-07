import { ArrowLeftRight, ShieldCheck, FlaskConical, Table } from 'lucide-react'

// Destination systems that are considered "internal" — anything else is a 3rd party
export const INTERNAL_SYSTEMS = ['glassix', 'consist']

export const FIELD_TYPES = ['String', 'Int', 'Boolean', 'Object', 'Array']

export const AUTH_TYPES = ['None', 'Bearer Token', 'API Key', 'OAuth']

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export const BLOCK_META = {
  http: {
    title: 'HTTP Request / אינטגרציה',
    subtitle: 'קריאת API בין מערכות, כולל מיפוי שדות',
    icon: ArrowLeftRight,
    accent: '#0f766e',
    accentDark: '#2dd4bf',
    tint: 'rgba(15, 118, 110, 0.08)',
  },
  security: {
    title: 'אבטחה וטיפול בשגיאות',
    subtitle: 'שיטת אימות והתנהגות במקרי כשל',
    icon: ShieldCheck,
    accent: '#1d4ed8',
    accentDark: '#60a5fa',
    tint: 'rgba(29, 78, 216, 0.08)',
  },
  testData: {
    title: 'נתוני בדיקה',
    subtitle: 'ערכי דמה למפתחים לצורך דיבוג',
    icon: FlaskConical,
    accent: '#b45309',
    accentDark: '#fbbf24',
    tint: 'rgba(180, 83, 9, 0.08)',
  },
  table: {
    title: 'טבלה דינמית',
    subtitle: 'טבלה חופשית — הגדירו עמודות ושורות לפי הצורך',
    icon: Table,
    accent: '#7c3aed',
    accentDark: '#a78bfa',
    tint: 'rgba(124, 58, 237, 0.08)',
  },
}
