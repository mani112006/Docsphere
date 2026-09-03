import { ALLOWED_EXTENSIONS, ALLOWED_MIME, MAX_FILE_BYTES, PIN_MAX_LENGTH, PIN_MIN_LENGTH, type AllowedMime } from '../types'
import { isCategoryId } from './categories'

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]
const JPEG_MAGIC = [0xff, 0xd8, 0xff]
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

export function sanitizeOriginalFilename(name: string): string {
  const trimmed = name.trim().replace(/[/\\]/g, '')
  const safe = trimmed.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180)
  return safe.length > 0 ? safe : 'document'
}

export function fileExtension(filename: string): string {
  const lower = filename.toLowerCase()
  const match = ALLOWED_EXTENSIONS.find((ext) => lower.endsWith(ext))
  if (match === '.jpeg') return '.jpg'
  return match ?? ''
}

function bytesStartWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false
  return magic.every((value, index) => bytes[index] === value)
}

export async function detectMimeFromContents(file: File): Promise<AllowedMime | null> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  if (bytesStartWith(header, PDF_MAGIC)) return 'application/pdf'
  if (bytesStartWith(header, JPEG_MAGIC)) return 'image/jpeg'
  if (bytesStartWith(header, PNG_MAGIC)) return 'image/png'
  return null
}

export async function validateUploadFile(file: File): Promise<{ ok: true; mime: AllowedMime; ext: string } | { ok: false; error: string }> {
  if (file.size <= 0) {
    return { ok: false, error: 'The selected file is empty.' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: 'File is larger than 10 MB.' }
  }

  const ext = fileExtension(file.name)
  if (!ext) {
    return { ok: false, error: 'Only PDF, JPG and PNG files are allowed.' }
  }

  const detected = await detectMimeFromContents(file)
  if (!detected) {
    return { ok: false, error: 'The file contents do not match a PDF, JPG or PNG.' }
  }

  if (file.type && !ALLOWED_MIME.includes(file.type as AllowedMime) && file.type !== 'application/octet-stream') {
    return { ok: false, error: 'This file type is not allowed.' }
  }

  if (ext === '.pdf' && detected !== 'application/pdf') {
    return { ok: false, error: 'File extension and contents do not match.' }
  }
  if ((ext === '.jpg' || ext === '.jpeg') && detected !== 'image/jpeg') {
    return { ok: false, error: 'File extension and contents do not match.' }
  }
  if (ext === '.png' && detected !== 'image/png') {
    return { ok: false, error: 'File extension and contents do not match.' }
  }

  return { ok: true, mime: detected, ext }
}

export function validateDocumentName(name: string): string | null {
  const value = name.trim()
  if (value.length < 1) return 'Enter a document name.'
  if (value.length > 120) return 'Name must be 120 characters or fewer.'
  return null
}

export function validateCategory(category: string): string | null {
  if (!isCategoryId(category)) return 'Select a valid category.'
  return null
}

export function validateFamilyFolder(folder: string): string | null {
  if (!['my_vault', 'father', 'spouse', 'kids'].includes(folder)) return 'Select a family folder.'
  return null
}

export function validateDescription(description: string): string | null {
  if (description.length > 500) return 'Description must be 500 characters or fewer.'
  return null
}

export function validatePin(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return 'PIN must contain digits only.'
  if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) {
    return `PIN must be ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits.`
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Include at least one letter and one number.'
  }
  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function storageObjectPath(userId: string, ext: string): string {
  return `${userId}/${crypto.randomUUID()}${ext}`
}
