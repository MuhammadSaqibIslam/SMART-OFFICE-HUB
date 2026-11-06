import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo/mode'
import { demoFetch } from '@/lib/demo/server'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input, init) => (isDemoMode() ? demoFetch(input, init) : fetch(input, init)),
  },
})
