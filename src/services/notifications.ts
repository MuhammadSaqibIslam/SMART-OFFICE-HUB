import { supabase } from '@/lib/supabase/client'

export type NotificationKind = 'danger' | 'warning' | 'info'

export interface AppNotification {
  id: string
  kind: NotificationKind
  category: 'inventory' | 'asset' | 'purchase' | 'warranty'
  title: string
  description: string
  to: string
}

// ---- Read state (stored locally, since notifications are derived, not a table) ----
const READ_KEY = 'soh-read-notifications'

export function getReadIds(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function saveReadIds(ids: string[]) {
  localStorage.setItem(READ_KEY, JSON.stringify(ids))
}

export async function getNotifications(): Promise<AppNotification[]> {
  const out: AppNotification[] = []

  const [items, assets, prs] = await Promise.all([
    supabase.from('inventory_items').select('id, name, quantity, min_stock_threshold, unit'),
    supabase.from('hardware_assets').select('id, name, status, warranty_expiry'),
    supabase.from('purchase_requests').select('id, request_number, status'),
  ])

  // Inventory: out of stock / low stock
  for (const i of items.data || []) {
    if (i.quantity === 0) {
      out.push({ id: `inv-out-${i.id}`, kind: 'danger', category: 'inventory', title: 'Out of stock', description: `"${i.name}" has no stock left`, to: '/inventory' })
    } else if (i.quantity <= i.min_stock_threshold) {
      out.push({ id: `inv-low-${i.id}`, kind: 'warning', category: 'inventory', title: 'Low stock', description: `"${i.name}" is down to ${i.quantity} ${i.unit}`, to: '/inventory' })
    }
  }

  // Assets: under maintenance / missing + warranty expiring in 30 days
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  for (const a of assets.data || []) {
    if (a.status === 'missing') {
      out.push({ id: `asset-missing-${a.id}`, kind: 'danger', category: 'asset', title: 'Asset missing', description: `"${a.name}" is marked missing`, to: '/hardware-assets' })
    } else if (a.status === 'under_maintenance') {
      out.push({ id: `asset-maint-${a.id}`, kind: 'warning', category: 'asset', title: 'Under maintenance', description: `"${a.name}" is under maintenance`, to: '/hardware-assets' })
    }
    if (a.warranty_expiry) {
      const w = new Date(a.warranty_expiry)
      if (w >= now && w <= in30) {
        out.push({ id: `asset-warranty-${a.id}`, kind: 'info', category: 'warranty', title: 'Warranty expiring', description: `"${a.name}" warranty ends ${w.toLocaleDateString()}`, to: '/hardware-assets' })
      }
    }
  }

  // Purchase requests awaiting action
  for (const p of prs.data || []) {
    if (p.status === 'submitted') {
      out.push({ id: `pr-${p.id}`, kind: 'info', category: 'purchase', title: 'Request pending', description: `${p.request_number || 'Purchase request'} is awaiting approval`, to: '/purchase-requests' })
    }
  }

  return out
}
