import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR_PROJECT_REF'))

function missingClient(): never {
  throw new Error('Supabase is not configured. Copy .env.example to .env and add your project URL and anon key.')
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : (new Proxy(
      {},
      {
        get() {
          missingClient()
        },
      },
    ) as SupabaseClient)
