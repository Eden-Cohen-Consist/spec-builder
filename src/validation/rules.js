import { hasContactContent, isThirdParty } from '../lib.js'
import { makeIssue } from './issue.js'

const blank = (value) => !String(value ?? '').trim()

export const validateAdmin = (admin) => {
  const issues = []
  const push = (severity, code, message, extra) =>
    issues.push(makeIssue(severity, 'admin', code, message, extra))

  if (blank(admin.clientName))
    push('error', 'ADMIN_CLIENT_NAME', 'חסר שם הלקוח', { field: 'clientName' })
  if (blank(admin.pmName))
    push('error', 'ADMIN_PM_NAME', 'חסר שם מנהל/ת הפרויקט', { field: 'pmName' })

  const complete = (c) => !blank(c.name) && (!blank(c.email) || !blank(c.phone))
  // Nothing typed at all is one issue about the table; a half-filled row is flagged in the
  // row itself, so the two never fire together and the PM is never told the same thing twice
  if (!admin.contacts.some(hasContactContent)) {
    push('error', 'ADMIN_NO_CONTACT', 'נדרש לפחות איש קשר אחד עם שם ואימייל או טלפון', {
      field: 'contacts',
    })
  } else {
    for (const contact of admin.contacts) {
      if (!hasContactContent(contact) || complete(contact)) continue
      if (blank(contact.name))
        push('error', 'CONTACT_NAME', 'לאיש הקשר חסר שם', {
          field: 'contactName',
          rowId: contact.id,
        })
      if (blank(contact.email) && blank(contact.phone))
        push('error', 'CONTACT_REACH', 'לאיש הקשר חסר אימייל או טלפון', {
          field: 'contactReach',
          rowId: contact.id,
        })
    }
  }

  if (admin.departmentCreated) {
    for (const department of admin.departments) {
      if (blank(department.name))
        push('error', 'DEPARTMENT_NAME', 'למחלקה חסר שם', {
          field: 'departmentName',
          rowId: department.id,
        })
    }
  }

  return issues
}

export const validateBusiness = (business) => {
  const issues = []
  const push = (severity, code, message, extra) =>
    issues.push(makeIssue(severity, 'business', code, message, extra))

  if (blank(business.goal))
    push('error', 'BUSINESS_GOAL', 'חסרה המטרה העסקית', { field: 'goal' })
  if (!business.triggers.some((t) => !blank(t.text)))
    push('error', 'BUSINESS_NO_TRIGGER', 'נדרש לפחות טריגר אחד', { field: 'triggers' })

  return issues
}

/**
 * A block the PM has not touched yet must stay neutral, so this deliberately ignores the
 * defaults makeBlock() hands out (`method: 'GET'`, `authType: 'None'`, one blank mapping row,
 * two blank table columns) and looks only at what a person could have typed.
 */
export const isBlockEmpty = (block) => {
  switch (block.type) {
    case 'http':
      return (
        [
          block.title,
          block.source,
          block.destination,
          block.endpoint,
          block.requestPayload,
          block.responsePayload,
          block.whitelistedIps,
          block.certificateDetails,
          block.fallback,
        ].every(blank) &&
        !block.ipWhitelistRequired &&
        !block.certificateRequired &&
        block.headers.every((h) => blank(h.key) && blank(h.value)) &&
        block.mapping.every(
          (r) => blank(r.sourceField) && blank(r.targetField) && blank(r.notes),
        )
      )
    case 'freeText':
      return blank(block.title) && blank(block.text)
    case 'testData':
      return block.rows.every((r) => blank(r.key) && blank(r.value) && blank(r.notes))
    case 'table':
      return (
        blank(block.name) &&
        blank(block.freeText) &&
        block.columns.every((c) => blank(c.label)) &&
        block.rows.every((r) => Object.values(r.cells ?? {}).every(blank))
      )
    default:
      return true
  }
}

export const validateBlock = (block) => {
  const issues = []
  const push = (severity, code, message, extra = {}) =>
    issues.push(makeIssue(severity, 'block', code, message, { blockId: block.id, ...extra }))

  // An untouched block gets exactly one warning and no errors: it never blocks the export,
  // but it is not invisible either
  if (isBlockEmpty(block)) {
    push('warning', 'EMPTY_BLOCK', 'בלוק ריק — מלאו אותו או מחקו')
    return issues
  }

  switch (block.type) {
    case 'http': {
      if (blank(block.title))
        push('error', 'HTTP_TITLE', 'חסרה כותרת הבלוק', { field: 'title' })
      if (blank(block.source))
        push('error', 'HTTP_SOURCE', 'חסרה מערכת מקור', { field: 'source' })
      if (blank(block.destination))
        push('error', 'HTTP_DESTINATION', 'חסרה מערכת יעד', { field: 'destination' })
      if (blank(block.endpoint))
        push('error', 'HTTP_ENDPOINT', 'חסר Endpoint', { field: 'endpoint' })

      if (isThirdParty(block.destination)) {
        if (blank(block.requestPayload))
          push('error', 'HTTP_REQUEST_PAYLOAD', 'חסר Request Payload — נדרש מול צד שלישי', {
            field: 'requestPayload',
          })
        if (blank(block.responsePayload))
          push('error', 'HTTP_RESPONSE_PAYLOAD', 'חסר Response Payload — נדרש מול צד שלישי', {
            field: 'responsePayload',
          })
      }

      if (block.ipWhitelistRequired && blank(block.whitelistedIps))
        push('error', 'HTTP_WHITELIST_IPS', 'סומן שנדרשת החרגת IP אך לא הוזנו כתובות', {
          field: 'whitelistedIps',
        })
      if (block.certificateRequired && blank(block.certificateDetails))
        push('error', 'HTTP_CERTIFICATE', 'סומן שנדרשת תעודה אך לא הוזנו פרטים', {
          field: 'certificateDetails',
        })

      if (!block.mapping.some((r) => !blank(r.sourceField) && !blank(r.targetField)))
        push('warning', 'HTTP_NO_MAPPING', 'כדאי למלא לפחות שורת מיפוי שדות אחת', {
          field: 'mapping',
        })
      if (blank(block.fallback))
        push('warning', 'HTTP_NO_FALLBACK', 'כדאי לתאר טיפול בשגיאות', { field: 'fallback' })
      if (block.authType === 'None')
        push('warning', 'HTTP_NO_AUTH', 'לא הוגדר אימות לקריאה', { field: 'authType' })
      break
    }

    case 'freeText':
      if (blank(block.text)) push('error', 'FREETEXT_BODY', 'חסר תיאור', { field: 'text' })
      if (blank(block.title))
        push('warning', 'FREETEXT_TITLE', 'כדאי להוסיף כותרת', { field: 'title' })
      break

    case 'testData':
      if (!block.rows.some((r) => !blank(r.key) && !blank(r.value)))
        push('error', 'TESTDATA_NO_ROW', 'נדרשת לפחות שורה אחת עם שדה וערך', { field: 'rows' })
      break

    case 'table': {
      if (blank(block.name)) push('error', 'TABLE_NAME', 'חסר שם הטבלה', { field: 'name' })
      block.columns.forEach((col, index) => {
        if (blank(col.label))
          push('error', 'TABLE_COLUMN_LABEL', `חסרה תווית לעמודה ${index + 1}`, {
            field: 'columnLabel',
            rowId: col.id,
          })
      })
      if (!block.rows.some((r) => Object.values(r.cells ?? {}).some((v) => !blank(v))))
        push('error', 'TABLE_NO_ROW', 'נדרשת לפחות שורה אחת עם תוכן', { field: 'rows' })
      break
    }
  }

  return issues
}
