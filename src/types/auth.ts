import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'office_manager' | 'it_admin'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
}
