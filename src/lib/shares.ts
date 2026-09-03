import { hashPin, randomSalt, sha256Hex } from './crypto'
import { createSignedUrl } from './documents'
import { supabase } from './supabase'
import type { DocumentRecord } from '../types'

export type ShareTtl = 600 | 3600

export async function createDocumentShare(input: {
  doc: DocumentRecord
  ttl: ShareTtl
  pin?: string
}): Promise<{ url: string; expiresAt: string }> {
  const token = crypto.randomUUID().replace(/-/g, '')
  const signedUrl = await createSignedUrl(input.doc.storage_path, input.ttl)
  const pinHash = input.pin ? await sha256Hex(`share:${input.pin}`) : null
  const expiresAt = new Date(Date.now() + input.ttl * 1000).toISOString()

  const { error } = await supabase.from('document_shares').insert({
    user_id: input.doc.user_id,
    document_id: input.doc.id,
    token,
    pin_hash: pinHash,
    signed_url: signedUrl,
    expires_at: expiresAt,
  })
  if (error) throw error

  return { url: `${window.location.origin}/s/${token}`, expiresAt }
}

export async function fetchPublicShare(token: string, pin?: string) {
  const pinHash = pin ? await sha256Hex(`share:${pin}`) : null
  const { data, error } = await supabase.rpc('get_document_share', {
    p_token: token,
    p_pin_hash: pinHash,
  })
  if (error) throw error
  return data as {
    ok?: boolean
    error?: string
    requires_pin?: boolean
    name?: string
    category?: string
    holder_name?: string | null
    document_number_last4?: string | null
    issue_date?: string | null
    expiry_date?: string | null
    signed_url?: string
    mime_type?: string
    expires_at?: string
  }
}

export async function listVaultLocks() {
  const { data, error } = await supabase
    .from('vault_locks')
    .select('id, lock_type, lock_key, pin_salt')
  if (error) throw error
  return (data ?? []) as Array<{ id: string; lock_type: 'folder' | 'category'; lock_key: string; pin_salt: string }>
}

export async function upsertVaultLock(input: {
  userId: string
  lockType: 'folder' | 'category'
  lockKey: string
  pin: string
}) {
  const salt = randomSalt()
  const pinHash = await hashPin(input.pin, salt)
  const { error } = await supabase.from('vault_locks').upsert(
    {
      user_id: input.userId,
      lock_type: input.lockType,
      lock_key: input.lockKey,
      pin_hash: pinHash,
      pin_salt: salt,
    },
    { onConflict: 'user_id,lock_type,lock_key' },
  )
  if (error) throw error
}

export async function removeVaultLock(lockType: 'folder' | 'category', lockKey: string) {
  const { error } = await supabase.from('vault_locks').delete().eq('lock_type', lockType).eq('lock_key', lockKey)
  if (error) throw error
}

export async function verifyVaultLock(lock: { pin_salt: string; lock_type: string; lock_key: string }, pin: string) {
  const { data, error } = await supabase
    .from('vault_locks')
    .select('pin_hash, pin_salt')
    .eq('lock_type', lock.lock_type)
    .eq('lock_key', lock.lock_key)
    .maybeSingle()
  if (error) throw error
  if (!data?.pin_hash || !data.pin_salt) return false
  return (await hashPin(pin, data.pin_salt)) === data.pin_hash
}
