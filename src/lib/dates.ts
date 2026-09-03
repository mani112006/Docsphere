import { EXPIRING_SOON_DAYS, type DocumentRecord, type ExpiryStatus } from '../types'

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function parseIsoDate(value: string | null): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function expiryStatus(expiryDate: string | null, today = startOfToday()): ExpiryStatus {
  const expiry = parseIsoDate(expiryDate)
  if (!expiry) return 'none'
  if (expiry < today) return 'expired'
  const soonLimit = addDays(today, EXPIRING_SOON_DAYS)
  if (expiry <= soonLimit) return 'soon'
  return 'valid'
}

export function formatDisplayDate(value: string | null): string {
  const date = parseIsoDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function dashboardStats(documents: DocumentRecord[]) {
  let expired = 0
  let expiringSoon = 0
  for (const doc of documents) {
    const status = expiryStatus(doc.expiry_date)
    if (status === 'expired') expired += 1
    if (status === 'soon') expiringSoon += 1
  }
  return {
    total: documents.length,
    expired,
    expiringSoon,
  }
}

export function expiryCountdown(expiryDate: string | null, today = startOfToday()): string {
  const expiry = parseIsoDate(expiryDate)
  if (!expiry) return 'No expiry date'
  const days = Math.round((expiry.getTime() - today.getTime()) / 86400000)
  if (days < 0) {
    const n = Math.abs(days)
    return `Expired ${n} day${n === 1 ? '' : 's'} ago`
  }
  if (days === 0) return 'Expires today'
  return `Expires in ${days} day${days === 1 ? '' : 's'}`
}

export function expiryLabel(status: ExpiryStatus): string {
  if (status === 'expired') return 'Expired'
  if (status === 'soon') return 'Expiring soon'
  if (status === 'valid') return 'Valid'
  return 'No expiry'
}
