import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a lightweight Supabase client for use in standalone scripts.
 * Does NOT depend on Next.js cookies or any framework-specific APIs.
 */
export function createScriptClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Make sure your .env.local file is loaded.'
    )
  }

  return createSupabaseClient(url, key)
}
