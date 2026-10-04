/**
 * PII Redaction & Client Data Masking Utility (DPDP Act, 2023)
 * Protects Aadhaar, PAN, phone numbers, emails, and bank accounts
 * before transmitting to external LLMs or exporting drafts.
 */

const AADHAAR_REGEX = /\b[2-9]{1}\d{3}[-\s]?\d{4}[-\s]?\d{4}\b/g
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g
const PHONE_REGEX = /(?:\+?91[-\s]?|0)?[6-9]\d{9}\b/g
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const IFSC_REGEX = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g
const BANK_ACC_REGEX = /(?:A\/C|Account|Acc|A\/c No\.?|Account No\.?)[:\s]+(\d{9,18})\b/gi

/**
 * Redacts sensitive Indian PII entities conforming to DPDP Act 2023.
 * @param {string} text
 * @returns {{ sanitizedText: string, totalRedacted: number, breakdown: object }}
 */
export function redactPII(text) {
  if (!text || typeof text !== 'string') {
    return { sanitizedText: text, totalRedacted: 0, breakdown: {} }
  }

  const breakdown = {
    aadhaar: (text.match(AADHAAR_REGEX) || []).length,
    pan: (text.match(PAN_REGEX) || []).length,
    phone: (text.match(PHONE_REGEX) || []).length,
    email: (text.match(EMAIL_REGEX) || []).length,
    ifsc: (text.match(IFSC_REGEX) || []).length,
    bank: (text.match(BANK_ACC_REGEX) || []).length,
  }

  let sanitized = text
    .replace(AADHAAR_REGEX, (m) => {
      const clean = m.replace(/[-\s]/g, '')
      const last4 = clean.slice(-4)
      return `[REDACTED AADHAAR: XXXX-XXXX-${last4}]`
    })
    .replace(PAN_REGEX, (m) => {
      const p = m.slice(0, 2)
      const s = m.slice(-1)
      return `[REDACTED PAN: ${p}***${s}]`
    })
    .replace(PHONE_REGEX, (m) => {
      const clean = m.replace(/[-\s]/g, '')
      const last4 = clean.slice(-4)
      return `[REDACTED PHONE: +91-XXXXX-${last4}]`
    })
    .replace(EMAIL_REGEX, (m) => {
      const parts = m.split('@')
      const user = parts[0].length > 1 ? parts[0][0] + '****' : '****'
      return `[REDACTED EMAIL: ${user}@${parts[1]}]`
    })
    .replace(IFSC_REGEX, (m) => `[REDACTED IFSC: ${m.slice(0, 4)}0******]`)
    .replace(BANK_ACC_REGEX, (m, acc) => {
      const last4 = acc.slice(-4)
      return m.replace(acc, `[REDACTED A/C: ******${last4}]`)
    })

  const totalRedacted = Object.values(breakdown).reduce((a, b) => a + b, 0)

  return {
    sanitizedText: sanitized,
    totalRedacted,
    breakdown,
    isSanitized: totalRedacted > 0,
  }
}
