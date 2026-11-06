import { supabase } from '@/lib/supabase/client'
import type { HardwareAsset, AssetHistory, Employee } from '@/types/database'
import { ilikeAny } from '@/lib/postgrest'

export type AssetStatus = 'available' | 'assigned' | 'under_maintenance' | 'missing' | 'retired'

export interface AssetWithAssignment extends HardwareAsset {
  current_assignment?: {
    id: string
    assigned_date: string
    employee: Pick<Employee, 'id' | 'full_name'> | null
  } | null
}

export interface AssetInput {
  name: string
  asset_type: string
  brand?: string | null
  model?: string | null
  serial_number?: string | null
  purchase_date?: string | null
  purchase_cost?: number | null
  warranty_expiry?: string | null
  location?: string | null
  status: AssetStatus
  description?: string | null
  notes?: string | null
}

// Empty strings → null so UNIQUE (serial_number) and optional columns stay clean
function clean(input: AssetInput): AssetInput {
  const out = { ...input } as Record<string, unknown>
  for (const key of Object.keys(out)) {
    if (out[key] === '' || Number.isNaN(out[key] as number)) out[key] = null
  }
  return out as unknown as AssetInput
}

// ---- Assets ----
export async function getAssets(filters?: {
  search?: string
  asset_type?: string
  status?: string
}) {
  let query = supabase
    .from('hardware_assets')
    .select('*, asset_assignments(id, status, assigned_date, employee:employees(id, full_name))')
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.or(ilikeAny(['name', 'serial_number', 'brand', 'model'], filters.search))
  }
  if (filters?.asset_type && filters.asset_type !== 'all') {
    query = query.eq('asset_type', filters.asset_type)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error

  return (data as unknown as (HardwareAsset & { asset_assignments: { id: string; status: string; assigned_date: string; employee: Pick<Employee, 'id' | 'full_name'> | null }[] })[]).map((asset) => {
    const active = asset.asset_assignments?.find((a) => a.status === 'active') || null
    const { asset_assignments: _drop, ...rest } = asset
    void _drop
    return {
      ...rest,
      current_assignment: active
        ? { id: active.id, assigned_date: active.assigned_date, employee: active.employee }
        : null,
    } as AssetWithAssignment
  })
}

export async function createAsset(input: AssetInput) {
  const { data, error } = await supabase
    .from('hardware_assets')
    .insert(clean(input))
    .select('*')
    .single()
  if (error) throw error

  await addHistory(data.id, 'created', `Asset "${input.name}" created`)
  await logActivity('asset_created', `Hardware asset "${input.name}" added`, 'hardware_asset', data.id)
  return data as HardwareAsset
}

export async function updateAsset(id: string, input: AssetInput) {
  const { data, error } = await supabase
    .from('hardware_assets')
    .update(clean(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error

  await addHistory(id, 'updated', `Asset "${data.name}" details updated`)
  await logActivity('asset_updated', `Hardware asset "${data.name}" updated`, 'hardware_asset', id)
  return data as HardwareAsset
}

export async function deleteAsset(id: string, name: string) {
  const { error } = await supabase.from('hardware_assets').delete().eq('id', id)
  if (error) throw error
  await logActivity('asset_deleted', `Hardware asset "${name}" deleted`, 'hardware_asset', id)
}

// ---- Assignment ----
export async function assignAsset(
  assetId: string,
  assetName: string,
  employeeId: string,
  employeeName: string,
  details: { assigned_date?: string; accessories?: string; notes?: string }
) {
  const { data: user } = await supabase.auth.getUser()

  const { error: aErr } = await supabase.from('asset_assignments').insert({
    asset_id: assetId,
    employee_id: employeeId,
    assigned_date: details.assigned_date || new Date().toISOString().slice(0, 10),
    accessories: details.accessories || null,
    notes: details.notes || null,
    status: 'active',
    assigned_by: user.user?.id,
  })
  if (aErr) throw aErr

  const { error: sErr } = await supabase
    .from('hardware_assets')
    .update({ status: 'assigned' })
    .eq('id', assetId)
  if (sErr) throw sErr

  await addHistory(assetId, 'assigned', `Assigned to ${employeeName}`)
  await logActivity('asset_assigned', `"${assetName}" assigned to ${employeeName}`, 'hardware_asset', assetId)
}

export async function returnAsset(
  assignmentId: string,
  assetId: string,
  assetName: string,
  details: { return_condition: string; notes?: string }
) {
  const { error: aErr } = await supabase
    .from('asset_assignments')
    .update({
      return_date: new Date().toISOString().slice(0, 10),
      return_condition: details.return_condition,
      notes: details.notes || null,
      status: 'returned',
    })
    .eq('id', assignmentId)
  if (aErr) throw aErr

  const { error: sErr } = await supabase
    .from('hardware_assets')
    .update({ status: 'available' })
    .eq('id', assetId)
  if (sErr) throw sErr

  await addHistory(assetId, 'returned', `Returned (condition: ${details.return_condition})`)
  await logActivity('asset_returned', `"${assetName}" returned`, 'hardware_asset', assetId)
}

export async function getAssetHistory(assetId: string) {
  const { data, error } = await supabase
    .from('asset_history')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as AssetHistory[]
}

// ---- Helpers ----
async function addHistory(assetId: string, action: string, details: string) {
  const { data: user } = await supabase.auth.getUser()
  await supabase.from('asset_history').insert({
    asset_id: assetId,
    action,
    details,
    performed_by: user.user?.id,
  })
}

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
