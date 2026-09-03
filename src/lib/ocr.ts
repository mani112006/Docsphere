import { CATEGORIES, type CategoryId } from './categories'

const DATE_PATTERNS = [
  /\b(\d{2})[/-](\d{2})[/-](\d{4})\b/g,
  /\b(\d{4})[/-](\d{2})[/-](\d{2})\b/g,
  /\b(\d{2})\s?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s?(\d{4})\b/gi,
]

const MONTHS: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
}

function isoDate(year: number, month: number, day: number): string | null {
  if (year < 1950 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function collectDates(text: string): string[] {
  const found: string[] = []
  const first = [...text.matchAll(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/g)]
  for (const match of first) {
    const day = Number(match[1])
    const month = Number(match[2])
    const year = Number(match[3])
    const iso = isoDate(year, month, day)
    if (iso) found.push(iso)
  }
  const isoStyle = [...text.matchAll(/\b(\d{4})[/-](\d{2})[/-](\d{2})\b/g)]
  for (const match of isoStyle) {
    const iso = isoDate(Number(match[1]), Number(match[2]), Number(match[3]))
    if (iso) found.push(iso)
  }
  const named = [...text.matchAll(/\b(\d{1,2})\s?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s?(\d{4})\b/gi)]
  for (const match of named) {
    const month = MONTHS[match[2]?.slice(0, 3).toLowerCase() ?? '']
    if (!month) continue
    const iso = isoDate(Number(match[3]), Number(month), Number(match[1]))
    if (iso) found.push(iso)
  }
  void DATE_PATTERNS
  return [...new Set(found)]
}

function detectCategory(text: string): CategoryId {
  const t = text.toLowerCase()
  if (/\baadhaar\b|\buidai\b|\bआधार\b/.test(t)) return 'aadhaar'
  if (/\bpermanent account\b|\bincome tax\b|\bpan\b/.test(t) && /[A-Z]{5}\d{4}[A-Z]/i.test(text)) return 'pan'
  if (/\bpassport\b|\brepublic of india\b/.test(t)) return 'passport'
  if (/\bdriving\b|\blicence\b|\blicense\b|\bsrto\b/.test(t)) return 'driving_licence'
  if (/\bvoter\b|\belection commission\b|\bepic\b/.test(t)) return 'voter_id'
  if (/\bration\b|\bnfsa\b/.test(t)) return 'ration'
  if (/\binsurance\b|\bpolicy no\b|\bpremium\b/.test(t)) return 'insurance'
  if (/\bvalid thru\b|\bvisa\b|\bmastercard\b|\brupee\b|\batm\b|\bcredit card\b/.test(t)) return 'atm_card'
  if (/\baccount\b|\bifsc\b|\bbank\b/.test(t)) return 'bank'
  if (/\bhospital\b|\bmedical\b|\bprescription\b/.test(t)) return 'medical'
  return 'other'
}

function detectNumber(text: string, category: string): string {
  const compact = text.replace(/\s+/g, ' ')
  if (category === 'aadhaar') {
    const match = compact.match(/\b(\d{4})\s(\d{4})\s(\d{4})\b/) ?? compact.match(/\b(\d{12})\b/)
    return match?.[0]?.replace(/\s/g, '') ?? ''
  }
  if (category === 'pan') {
    return compact.match(/\b[A-Z]{5}\d{4}[A-Z]\b/i)?.[0]?.toUpperCase() ?? ''
  }
  if (category === 'passport') {
    return compact.match(/\b[A-Z][0-9]{7}\b/i)?.[0]?.toUpperCase() ?? ''
  }
  if (category === 'atm_card') {
    const match = compact.match(/\b(?:\d{4}[\s-]?){3}\d{4}\b/)
    return match?.[0]?.replace(/[^\d]/g, '') ?? ''
  }
  const generic = compact.match(/\b[A-Z0-9][A-Z0-9/-]{5,18}\b/)
  return generic?.[0] ?? ''
}

function detectName(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 4 && line.length <= 48)
  const labeled = text.match(/(?:name|holder|naam)\s*[:\-]\s*([A-Z][A-Za-z. ]{2,40})/i)
  if (labeled?.[1]) return labeled[1].trim()
  const skip = /government|india|republic|department|male|female|address|dob|date|valid|card|uidai|income|tax/
  const candidate = lines.find((line) => /^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z.]+)+$/.test(line) && !skip.test(line.toLowerCase()))
  return candidate ?? ''
}

export function last4(value: string): string | null {
  const compact = value.replace(/[\s-]/g, '')
  if (!compact) return null
  return compact.slice(-4).toUpperCase()
}

export function maskDocumentNumber(value: string | null | undefined): string {
  if (!value) return '—'
  const compact = value.replace(/[\s-]/g, '')
  if (compact.length <= 4) return compact
  return `•••• ${compact.slice(-4)}`
}

export function parseOcrText(text: string): {
  category: CategoryId
  name: string
  holderName: string
  documentNumber: string
  issueDate: string
  expiryDate: string
} {
  const category = detectCategory(text)
  const dates = collectDates(text).sort()
  const today = new Date().toISOString().slice(0, 10)
  const future = dates.filter((d) => d >= today)
  const past = dates.filter((d) => d < today)
  const expiryDate = future.at(-1) ?? dates.at(-1) ?? ''
  const issueDate = past[0] ?? (dates.length > 1 ? dates[0] : '') ?? ''
  const holderName = detectName(text)
  const documentNumber = detectNumber(text, category)
  const categoryName = CATEGORIES.find((item) => item.id === category)?.label ?? 'Document'
  const name = holderName ? `${holderName} · ${categoryName}` : categoryName
  return {
    category,
    name: name.slice(0, 120),
    holderName: holderName.slice(0, 120),
    documentNumber,
    issueDate: issueDate && expiryDate && issueDate > expiryDate ? '' : issueDate,
    expiryDate,
  }
}

export async function recognizeDocument(file: Blob): Promise<{ text: string } & ReturnType<typeof parseOcrText>> {
  if (!file.type.startsWith('image/')) {
    return { text: '', category: 'other', name: '', holderName: '', documentNumber: '', issueDate: '', expiryDate: '' }
  }
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  try {
    const { data } = await worker.recognize(file)
    const parsed = parseOcrText(data.text ?? '')
    return { text: data.text ?? '', ...parsed }
  } finally {
    await worker.terminate()
  }
}
