import { DOCUMENT_SELECT, SIGNED_URL_TTL_SECONDS, type DocumentRecord } from '../types'
import { last4 } from './ocr'
import { supabase } from './supabase'
import { storageObjectPath, sanitizeOriginalFilename } from './validation'

const BUCKET = 'documents'

function asDocument(row: unknown): DocumentRecord {
  const doc = row as DocumentRecord
  return {
    ...doc,
    holder_name: doc.holder_name ?? null,
    document_number_last4: doc.document_number_last4 ?? null,
    family_folder: doc.family_folder || 'my_vault',
    pin_locked: Boolean(doc.pin_locked),
  }
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const { data, error } = await supabase.from('documents').select(DOCUMENT_SELECT).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(asDocument)
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const { data, error } = await supabase.from('documents').select(DOCUMENT_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? asDocument(data) : null
}

export async function createSignedUrl(storagePath: string, expiresIn = SIGNED_URL_TTL_SECONDS): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresIn)
  if (error || !data?.signedUrl) {
    throw error ?? new Error('Could not create a signed link.')
  }
  return data.signedUrl
}

export async function fetchDocumentBlob(storagePath: string): Promise<Blob> {
  const signedUrl = await createSignedUrl(storagePath)
  const response = await fetch(signedUrl, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Could not retrieve the document.')
  }
  return response.blob()
}

export async function uploadDocument(input: {
  userId: string
  name: string
  category: string
  description: string | null
  issueDate: string | null
  expiryDate: string | null
  holderName: string | null
  documentNumber: string | null
  familyFolder: string
  pinLocked: boolean
  file: File
  mime: DocumentRecord['mime_type']
  ext: string
}): Promise<DocumentRecord> {
  const path = storageObjectPath(input.userId, input.ext)
  const original = sanitizeOriginalFilename(input.file.name)

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    cacheControl: '0',
    upsert: false,
    contentType: input.mime,
  })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: input.userId,
      name: input.name.trim(),
      category: input.category,
      description: input.description,
      issue_date: input.issueDate,
      expiry_date: input.expiryDate,
      holder_name: input.holderName?.trim() || null,
      document_number_last4: last4(input.documentNumber ?? ''),
      family_folder: input.familyFolder,
      pin_locked: input.pinLocked,
      storage_path: path,
      mime_type: input.mime,
      file_size: input.file.size,
      original_filename: original,
    })
    .select(DOCUMENT_SELECT)
    .single()

  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }

  return asDocument(data)
}

export async function updateDocumentMeta(
  id: string,
  patch: {
    name: string
    category: string
    description: string | null
    issue_date: string | null
    expiry_date: string | null
    holder_name: string | null
    document_number_last4: string | null
    family_folder: string
    pin_locked: boolean
  },
): Promise<void> {
  const { error } = await supabase.from('documents').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteDocument(doc: DocumentRecord): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([doc.storage_path])
  if (storageError) throw storageError

  const { error } = await supabase.from('documents').delete().eq('id', doc.id)
  if (error) throw error
}
