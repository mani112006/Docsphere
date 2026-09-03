import QRCode from 'qrcode'
import { encryptText } from './crypto'
import { expiryCountdown, expiryStatus } from './dates'
import { maskDocumentNumber } from './ocr'
import type { DocumentRecord } from '../types'

export async function buildPasscardPayload(doc: DocumentRecord, secret: string): Promise<string> {
  const summary = {
    n: doc.name,
    h: doc.holder_name,
    c: doc.category,
    last4: doc.document_number_last4,
    exp: doc.expiry_date,
    st: expiryStatus(doc.expiry_date),
    cd: expiryCountdown(doc.expiry_date),
  }
  return encryptText(JSON.stringify(summary), secret)
}

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  })
}

export function passcardPlainText(doc: DocumentRecord): string {
  const number = maskDocumentNumber(doc.document_number_last4)
  return [doc.holder_name || doc.name, number, expiryCountdown(doc.expiry_date)].join(' · ')
}
