import { supabase } from '@/lib/supabase/client'
import type { ActivityLog } from '@/types/database'

export interface ActivityLogRow extends ActivityLog {
  performer_name?: string | null
}

export const ENTITY_TYPES: { value: string; label: string }[] = [
  { value: 'inventory_item', label: 'Inventory' },
  { value: 'employee', label: 'Employees' },
  { value: 'hardware_asset', label: 'Hardware Assets' },
  { value: 'purchase_request', label: 'Purchase Requests' },
]

export async function getActivityLogs(filters?: {
  search?: string
  entity_type?: string
  limit?: number
}) {
  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }
  if (filters?.entity_type && filters.entity_type !== 'all') {
    query = query.eq('entity_type', filters.entity_type)
  }

  query = query.range(0, (filters?.limit || 50) - 1)

  const { data, error, count } = await query
  if (error) throw error

  const logs = (data as ActivityLog[]) || []

  // Resolve performer names from profiles (needs the read-all-profiles policy)
  const ids = Array.from(new Set(logs.map((l) => l.performed_by).filter((x): x is string => !!x)))
  let nameMap: Record<string, string> = {}
  if (ids.length) {
    const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids)
    nameMap = Object.fromEntries((profs || []).map((p) => [p.id, p.full_name]))
  }

  const rows: ActivityLogRow[] = logs.map((l) => ({
    ...l,
    performer_name: l.performed_by ? nameMap[l.performed_by] || null : null,
  }))

  return { logs: rows, total: count || 0 }
}

export async function deleteActivityLog(id: string) {
  const { data, error } = await supabase.from('activity_logs').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Nothing was deleted — delete permission may be missing (run migration 004).')
  }
}

export async function deleteActivityLogs(ids: string[]) {
  if (!ids.length) return
  const { data, error } = await supabase.from('activity_logs').delete().in('id', ids).select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Nothing was deleted — delete permission may be missing (run migration 004).')
  }
}
