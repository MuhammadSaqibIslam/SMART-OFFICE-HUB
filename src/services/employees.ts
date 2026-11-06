import { supabase } from '@/lib/supabase/client'
import type { Employee } from '@/types/database'
import { ilikeAny } from '@/lib/postgrest'

const PHOTO_BUCKET = 'employee-photos'

export interface EmployeeInput {
  full_name: string
  employee_id?: string | null
  email?: string | null
  department?: string | null
  job_title?: string | null
  contact_number?: string | null
  joining_date?: string | null
  status: 'active' | 'inactive'
  notes?: string | null
  avatar_url?: string | null
}

// Empty strings → null so UNIQUE (employee_id) and optional columns stay clean
function clean(input: EmployeeInput): EmployeeInput {
  const out = { ...input } as Record<string, unknown>
  for (const key of Object.keys(out)) {
    if (out[key] === '') out[key] = null
  }
  return out as unknown as EmployeeInput
}

export async function getEmployees(filters?: {
  search?: string
  department?: string
  status?: 'all' | 'active' | 'inactive'
}) {
  let query = supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.or(ilikeAny(['full_name', 'employee_id', 'email'], filters.search))
  }
  if (filters?.department && filters.department !== 'all') {
    query = query.eq('department', filters.department)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Employee[]
}

export async function getEmployee(id: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Employee
}

export async function createEmployee(input: EmployeeInput) {
  const { data, error } = await supabase
    .from('employees')
    .insert(clean(input))
    .select('*')
    .single()
  if (error) throw error

  await logActivity('employee_created', `Employee "${input.full_name}" added`, 'employee', data.id)
  return data as Employee
}

export async function updateEmployee(id: string, input: EmployeeInput) {
  const { data, error } = await supabase
    .from('employees')
    .update(clean(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error

  await logActivity('employee_updated', `Employee "${data.full_name}" updated`, 'employee', id)
  return data as Employee
}

export async function deleteEmployee(id: string, fullName: string) {
  const { count, error: assignmentError } = await supabase
    .from('asset_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', id)
    .eq('status', 'active')
  if (assignmentError) throw assignmentError
  if (count) {
    throw new Error(`${fullName} still has ${count} assigned device${count > 1 ? 's' : ''}. Return ${count > 1 ? 'them' : 'it'} before deleting this employee.`)
  }

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
  if (error) throw error

  await logActivity('employee_deleted', `Employee "${fullName}" deleted`, 'employee', id)
}

// ---- Photo upload ----
export async function uploadEmployeePhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// Best-effort removal of a previously uploaded photo (ignores failures)
export async function removeEmployeePhoto(url: string): Promise<void> {
  const marker = `/${PHOTO_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  await supabase.storage.from(PHOTO_BUCKET).remove([path])
}

// ---- Activity Log Helper ----
async function logActivity(action: string, description: string, entityType?: string, entityId?: string) {
  const { data: user } = await supabase.auth.getUser()
  await supabase.from('activity_logs').insert({
    action,
    description,
    entity_type: entityType,
    entity_id: entityId,
    performed_by: user.user?.id,
  })
}
