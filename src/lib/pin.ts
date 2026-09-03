import type { ProfileRecord } from '../types'
import { hashPin, randomSalt } from './crypto'
import { supabase } from './supabase'

export async function fetchProfile(): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, pin_enabled, pin_salt, pin_failed_attempts, pin_locked_until')
    .maybeSingle()

  if (error) throw error
  return (data as ProfileRecord | null) ?? null
}

export async function ensureProfile(userId: string, displayName?: string | null): Promise<void> {
  const existing = await fetchProfile()
  if (existing) return
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    display_name: displayName ?? null,
  })
  if (error && error.code !== '23505') throw error
}

export async function enablePin(pin: string): Promise<void> {
  const salt = randomSalt()
  const pinHash = await hashPin(pin, salt)
  const { error } = await supabase
    .from('profiles')
    .update({
      pin_enabled: true,
      pin_hash: pinHash,
      pin_salt: salt,
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')

  if (error) throw error
}

export async function disablePin(): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      pin_enabled: false,
      pin_hash: null,
      pin_salt: null,
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')

  if (error) throw error
}

export type PinVerifyResult =
  | { ok: true }
  | { ok: false; locked: boolean; remaining?: number; until?: string; error?: string }

export async function verifyPin(pin: string, salt: string): Promise<PinVerifyResult> {
  const pinHash = await hashPin(pin, salt)
  const { data, error } = await supabase.rpc('verify_document_pin', { p_pin_hash: pinHash })
  if (error) throw error

  const result = data as {
    ok?: boolean
    locked?: boolean
    remaining?: number
    until?: string
    error?: string
  }

  if (result?.ok) return { ok: true }
  return {
    ok: false,
    locked: Boolean(result?.locked),
    remaining: result?.remaining,
    until: result?.until,
    error: result?.error,
  }
}

export async function updateDisplayName(name: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ display_name: name }).eq(
    'id',
    (await supabase.auth.getUser()).data.user?.id ?? '',
  )
  if (error) throw error
}
