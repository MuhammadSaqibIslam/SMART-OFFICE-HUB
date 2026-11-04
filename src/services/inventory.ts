import { supabase } from '@/lib/supabase/client'
import type { InventoryItem, InventoryCategory, InventoryTransaction } from '@/types/database'

// ---- Categories ----
export async function getCategories() {
  const { data, error } = await supabase
    .from('inventory_categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data as InventoryCategory[]
}

// ---- Inventory Items ----
export async function getInventoryItems(filters?: {
  search?: string
  category_id?: string
  stock_status?: 'all' | 'low' | 'in_stock' | 'out_of_stock'
}) {
  let query = supabase
    .from('inventory_items')
    .select('*, category:inventory_categories(*)')
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  const { data, error } = await query
  if (error) throw error

  let items = data as InventoryItem[]

  if (filters?.stock_status === 'low') {
    items = items.filter(i => i.quantity > 0 && i.quantity <= i.min_stock_threshold)
  } else if (filters?.stock_status === 'out_of_stock') {
    items = items.filter(i => i.quantity === 0)
  } else if (filters?.stock_status === 'in_stock') {
    items = items.filter(i => i.quantity > i.min_stock_threshold)
  }

  return items
}

export async function getInventoryItem(id: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, category:inventory_categories(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as InventoryItem
}

export async function createInventoryItem(item: {
  name: string
  category_id: string
  description?: string
  quantity: number
  min_stock_threshold: number
  unit: string
  location?: string
}) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(item)
    .select('*, category:inventory_categories(*)')
    .single()
  if (error) throw error

  await logActivity('inventory_item_created', `Inventory item "${item.name}" created`, 'inventory_item', data.id)
  return data as InventoryItem
}

export async function updateInventoryItem(id: string, updates: Partial<{
  name: string
  category_id: string
  description: string
  quantity: number
  min_stock_threshold: number
  unit: string
  location: string
}>) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select('*, category:inventory_categories(*)')
    .single()
  if (error) throw error

  await logActivity('inventory_item_updated', `Inventory item "${data.name}" updated`, 'inventory_item', id)
  return data as InventoryItem
}

export async function deleteInventoryItem(id: string, name: string) {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)
  if (error) throw error

  await logActivity('inventory_item_deleted', `Inventory item "${name}" deleted`, 'inventory_item', id)
}

// ---- Stock Transactions ----
export async function stockIn(itemId: string, quantity: number, notes?: string) {
  const item = await getInventoryItem(itemId)
  const previousStock = item.quantity
  const updatedStock = previousStock + quantity

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ quantity: updatedStock })
    .eq('id', itemId)
  if (updateError) throw updateError

  const { data: user } = await supabase.auth.getUser()

  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert({
      item_id: itemId,
      type: 'stock_in',
      quantity,
      previous_stock: previousStock,
      updated_stock: updatedStock,
      notes,
      performed_by: user.user?.id,
    })
  if (txError) throw txError

  await logActivity('stock_in', `Stock in: ${quantity} ${item.unit} of "${item.name}" (${previousStock} → ${updatedStock})`, 'inventory_item', itemId)
}

export async function stockOut(itemId: string, quantity: number, notes?: string) {
  const item = await getInventoryItem(itemId)
  const previousStock = item.quantity

  if (quantity > previousStock) {
    throw new Error(`Cannot issue ${quantity} ${item.unit}. Only ${previousStock} available.`)
  }

  const updatedStock = previousStock - quantity

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ quantity: updatedStock })
    .eq('id', itemId)
  if (updateError) throw updateError

  const { data: user } = await supabase.auth.getUser()

  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert({
      item_id: itemId,
      type: 'stock_out',
      quantity,
      previous_stock: previousStock,
      updated_stock: updatedStock,
      notes,
      performed_by: user.user?.id,
    })
  if (txError) throw txError

  await logActivity('stock_out', `Stock out: ${quantity} ${item.unit} of "${item.name}" (${previousStock} → ${updatedStock})`, 'inventory_item', itemId)
}

export async function getStockHistory(itemId: string) {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as InventoryTransaction[]
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
