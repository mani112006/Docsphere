export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const
export const SIGNED_URL_TTL_SECONDS = 60
export const EXPIRING_SOON_DAYS = 30
export const PIN_MIN_LENGTH = 4
export const PIN_MAX_LENGTH = 6
export const PIN_MAX_ATTEMPTS = 5
export const AUTO_LOCK_MS = 3 * 60 * 1000
export const SESSION_IDLE_SIGNOUT_MS = 15 * 60 * 1000

export type AllowedMime = (typeof ALLOWED_MIME)[number]

export const DOCUMENT_SELECT =
  'id, user_id, name, category, description, issue_date, expiry_date, storage_path, mime_type, file_size, original_filename, holder_name, document_number_last4, family_folder, pin_locked, created_at, updated_at'

export type FamilyFolderId = 'my_vault' | 'father' | 'spouse' | 'kids'

export type DocumentRecord = {
  id: string
  user_id: string
  name: string
  category: string
  description: string | null
  issue_date: string | null
  expiry_date: string | null
  storage_path: string
  mime_type: AllowedMime
  file_size: number
  original_filename: string
  holder_name: string | null
  document_number_last4: string | null
  family_folder: FamilyFolderId | string
  pin_locked: boolean
  created_at: string
  updated_at: string
}

export type ExtractedDetails = {
  name: string
  category: string
  holderName: string
  documentNumber: string
  issueDate: string
  expiryDate: string
  familyFolder: string
  description: string
  pinLocked: boolean
}

export type ProfileRecord = {
  id: string
  display_name: string | null
  pin_enabled: boolean
  pin_salt: string | null
  pin_failed_attempts: number
  pin_locked_until: string | null
}

export type ExpiryStatus = 'expired' | 'soon' | 'valid' | 'none'
