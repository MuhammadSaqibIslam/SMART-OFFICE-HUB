import { supabase } from '@/lib/supabase/client'
import type { PurchaseRequest, PurchaseRequestItem } from '@/types/database'

export type PRStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'received'

export interface PurchaseRequestWithItems extends PurchaseRequest {
  purchase_request_items?: PurchaseRequestItem[]
}

export interface PRLineItem {
  item_id?: string | null
  item_name: string
  quantity: number
  notes?: string | null
}

export interface PRInput {
  request_number?: string | null
  notes?: string | null
  items: PRLineItem[]
}

export const PR_STATUSES: { value: PRStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'received', label: 'Received' },
]

export const PR_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-text-muted/10 text-text-muted',
  submitted: 'bg-info/10 text-info',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
  ordered: 'bg-warning/10 text-warning',
  received: 'bg-primary/10 text-primary',
}

// Allowed forward transitions in the workflow
export const NEXT_STATUSES: Record<PRStatus, PRStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'rejected'],
  approved: ['ordered'],
  rejected: [],
  ordered: ['received'],
  received: [],
}

export async function getPurchaseRequests(filters?: { search?: string; status?: string }) {
  let query = supabase
    .from('purchase_requests')
    .select('*, purchase_request_items(*)')
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.ilike('request_number', `%${filters.search}%`)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as PurchaseRequestWithItems[]
}

async function nextRequestNumber(): Promise<string> {
  const { count } = await supabase
    .from('purchase_requests')
    .select('*', { count: 'exact', head: true })
  return `PR-${String((count || 0) + 1).padStart(4, '0')}`
}

export async function createPurchaseRequest(input: PRInput) {
  const { data: user } = await supabase.auth.getUser()
  const number = input.request_number?.trim() || (await nextRequestNumber())

  const { data: pr, error } = await supabase
    .from('purchase_requests')
    .insert({ request_number: number, notes: input.notes || null, status: 'draft', requested_by: user.user?.id })
    .select('*')
    .single()
  if (error) throw error

  await insertItems(pr.id, input.items)
  await logActivity('purchase_request_created', `Purchase request ${number} created`, 'purchase_request', pr.id)
  return pr as PurchaseRequest
}

export async function updatePurchaseRequest(id: string, input: PRInput) {
  const { data: pr, error } = await supabase
    .from('purchase_requests')
    .update({ request_number: input.request_number?.trim() || null, notes: input.notes || null })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error

  // Replace line items
  const { error: delErr } = await supabase.from('purchase_request_items').delete().eq('request_id', id)
  if (delErr) throw delErr
  await insertItems(id, input.items)

  await logActivity('purchase_request_updated', `Purchase request ${pr.request_number} updated`, 'purchase_request', id)
  return pr as PurchaseRequest
}

export async function updateStatus(id: string, number: string | null, status: PRStatus) {
  const { error } = await supabase.from('purchase_requests').update({ status }).eq('id', id)
  if (error) throw error
  await logActivity('purchase_request_status', `Purchase request ${number || ''} → ${status}`, 'purchase_request', id)
}

export async function deletePurchaseRequest(id: string, number: string | null) {
  const { error } = await supabase.from('purchase_requests').delete().eq('id', id)
  if (error) throw error
  await logActivity('purchase_request_deleted', `Purchase request ${number || ''} deleted`, 'purchase_request', id)
}

async function insertItems(requestId: string, items: PRLineItem[]) {
  const rows = items
    .filter((i) => i.item_name.trim())
    .map((i) => ({
      request_id: requestId,
      item_id: i.item_id || null,
      item_name: i.item_name.trim(),
      quantity: i.quantity,
      notes: i.notes || null,
    }))
  if (rows.length === 0) return
  const { error } = await supabase.from('purchase_request_items').insert(rows)
  if (error) throw error
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
