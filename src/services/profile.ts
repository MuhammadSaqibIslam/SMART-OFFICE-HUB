import { supabase } from '@/lib/supabase/client'

// Reuse the existing public image bucket (no extra bucket/SQL needed)
const BUCKET = 'employee-photos'

export async function uploadProfileAvatar(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `profiles/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
