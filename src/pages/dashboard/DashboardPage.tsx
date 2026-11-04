import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Monitor,
  AlertTriangle,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { InventoryItem, ActivityLog } from '@/types/database'

interface DashboardStats {
  totalInventoryItems: number
  totalStock: number
  lowStockItems: number
  pendingPurchaseRequests: number
  totalAssets: number
  availableAssets: number
  assignedAssets: number
  missingAssets: number
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInventoryItems: 0,
    totalStock: 0,
    lowStockItems: 0,
    pendingPurchaseRequests: 0,
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0,
    missingAssets: 0,
  })
  const [lowStockList, setLowStockList] = useState<InventoryItem[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const [
        inventoryRes,
        purchaseRes,
        assetsRes,
        activityRes,
      ] = await Promise.all([
        supabase.from('inventory_items').select('*'),
        supabase.from('purchase_requests').select('*').in('status', ['submitted', 'approved', 'ordered']),
        supabase.from('hardware_assets').select('*'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10),
      ])

      const inventoryItems = (inventoryRes.data || []) as InventoryItem[]
      const totalStock = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
      const lowStock = inventoryItems.filter(item => item.quantity <= item.min_stock_threshold)

      const assets = assetsRes.data || []
      const availableAssets = assets.filter(a => a.status === 'available').length
      const assignedAssets = assets.filter(a => a.status === 'assigned').length
      const missingAssets = assets.filter(a => a.status === 'missing').length

      setStats({
        totalInventoryItems: inventoryItems.length,
        totalStock,
        lowStockItems: lowStock.length,
        pendingPurchaseRequests: purchaseRes.data?.length || 0,
        totalAssets: assets.length,
        availableAssets,
        assignedAssets,
        missingAssets,
      })

      setLowStockList(lowStock.slice(0, 5))
      setRecentActivity((activityRes.data || []) as ActivityLog[])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of inventory and hardware assets
        </p>
      </div>

      {/* Inventory KPIs */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Inventory Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Items"
            value={stats.totalInventoryItems}
            icon={<Package className="h-5 w-5" />}
            color="primary"
          />
          <KpiCard
            title="Available Stock"
            value={stats.totalStock}
            icon={<ArrowUpRight className="h-5 w-5" />}
            color="success"
          />
          <KpiCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="warning"
          />
          <KpiCard
            title="Pending Requests"
            value={stats.pendingPurchaseRequests}
            icon={<ShoppingCart className="h-5 w-5" />}
            color="info"
          />
        </div>
      </div>

      {/* Asset KPIs */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Hardware Assets Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Assets"
            value={stats.totalAssets}
            icon={<Monitor className="h-5 w-5" />}
            color="primary"
          />
          <KpiCard
            title="Available"
            value={stats.availableAssets}
            icon={<ArrowUpRight className="h-5 w-5" />}
            color="success"
          />
          <KpiCard
            title="Assigned"
            value={stats.assignedAssets}
            icon={<Users className="h-5 w-5" />}
            color="info"
          />
          <KpiCard
            title="Missing"
            value={stats.missingAssets}
            icon={<ArrowDownRight className="h-5 w-5" />}
            color="danger"
          />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Low Stock Items */}
        <div className="lg:col-span-1 rounded-xl border border-border-default bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Low Stock Items</h3>
            <Link to="/inventory" className="text-xs font-medium text-primary hover:text-primary-hover">
              View all
            </Link>
          </div>
          {lowStockList.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No low stock items</p>
          ) : (
            <ul className="space-y-3">
              {lowStockList.map(item => (
                <li key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-muted">Min: {item.min_stock_threshold} {item.unit}</p>
                  </div>
                  <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning tabular-nums">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 rounded-xl border border-border-default bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Recent Activity</h3>
            <Link to="/activity-log" className="text-xs font-medium text-primary hover:text-primary-hover">
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map(log => (
                <li key={log.id} className="flex items-start gap-3">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                  <div>
                    <p className="text-sm text-text-primary">{log.description}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(log.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 rounded-xl border border-border-default bg-surface p-5">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction to="/inventory" icon={<Plus className="h-4 w-4" />} label="Add Inventory Item" />
            <QuickAction to="/hardware-assets" icon={<Monitor className="h-4 w-4" />} label="Register Asset" />
            <QuickAction to="/employees" icon={<Users className="h-4 w-4" />} label="Add Employee" />
            <QuickAction to="/purchase-requests" icon={<ShoppingCart className="h-4 w-4" />} label="Create Purchase Request" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Sub-components ----

function KpiCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
  }

  return (
    <div className="rounded-xl border border-border-default bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-text-primary">{value}</p>
    </div>
  )
}

function QuickAction({
  to,
  icon,
  label,
}: {
  to: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      {label}
    </Link>
  )
}
