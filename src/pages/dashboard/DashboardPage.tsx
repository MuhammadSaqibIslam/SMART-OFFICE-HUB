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
  Loader2,
  TrendingUp,
  Clock,
  ChevronRight,
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
    <div className="flex h-full flex-col gap-5">
      {/* Inventory KPIs */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" strokeWidth={1.8} />
          <h2 className="text-[15px] font-semibold text-text-primary">Inventory Overview</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Items"
            value={stats.totalInventoryItems}
            icon={<Package className="h-5 w-5" />}
            color="primary"
            subtitle="Registered items"
          />
          <KpiCard
            title="Available Stock"
            value={stats.totalStock}
            icon={<TrendingUp className="h-5 w-5" />}
            color="success"
            subtitle="Units in stock"
          />
          <KpiCard
            title="Low Stock"
            value={stats.lowStockItems}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="warning"
            subtitle="Need attention"
          />
          <KpiCard
            title="Pending Requests"
            value={stats.pendingPurchaseRequests}
            icon={<ShoppingCart className="h-5 w-5" />}
            color="info"
            subtitle="Awaiting action"
          />
        </div>
      </section>

      {/* Asset KPIs */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" strokeWidth={1.8} />
          <h2 className="text-[15px] font-semibold text-text-primary">Hardware Assets</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Assets"
            value={stats.totalAssets}
            icon={<Monitor className="h-5 w-5" />}
            color="primary"
            subtitle="All devices"
          />
          <KpiCard
            title="Available"
            value={stats.availableAssets}
            icon={<ArrowUpRight className="h-5 w-5" />}
            color="success"
            subtitle="Ready to assign"
          />
          <KpiCard
            title="Assigned"
            value={stats.assignedAssets}
            icon={<Users className="h-5 w-5" />}
            color="info"
            subtitle="In use"
          />
          <KpiCard
            title="Missing"
            value={stats.missingAssets}
            icon={<ArrowDownRight className="h-5 w-5" />}
            color="danger"
            subtitle="Not accounted"
          />
        </div>
      </section>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 flex-1 min-h-0">
        {/* Low Stock Items */}
        <div className="rounded-xl border border-border-default bg-surface flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold text-text-primary">Low Stock Items</h3>
            </div>
            <Link to="/inventory" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {lowStockList.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <p className="text-sm text-text-muted">All items are well stocked</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {lowStockList.map(item => (
                  <li key={item.id} className="flex items-center justify-between rounded-lg bg-surface-secondary/50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-[11px] text-text-muted">Min: {item.min_stock_threshold} {item.unit}</p>
                    </div>
                    <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning tabular-nums">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border-default bg-surface flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" />
              <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
            </div>
            <Link to="/activity-log" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
                  <Clock className="h-5 w-5 text-text-muted" />
                </div>
                <p className="text-sm text-text-muted">No recent activity</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {recentActivity.map(log => (
                  <li key={log.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-secondary/50 transition-colors">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">{log.description}</p>
                      <p className="text-[11px] text-text-muted">
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
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border-default bg-surface flex flex-col min-h-0">
          <div className="flex items-center gap-2 border-b border-border-default px-4 py-3">
            <Plus className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Quick Actions</h3>
          </div>
          <div className="space-y-1 p-3">
            <QuickAction to="/inventory" icon={<Plus className="h-4 w-4" />} label="Add Inventory Item" desc="Add new consumable" />
            <QuickAction to="/hardware-assets" icon={<Monitor className="h-4 w-4" />} label="Register Asset" desc="Register new device" />
            <QuickAction to="/employees" icon={<Users className="h-4 w-4" />} label="Add Employee" desc="Create employee record" />
            <QuickAction to="/purchase-requests" icon={<ShoppingCart className="h-4 w-4" />} label="Purchase Request" desc="Create reorder request" />
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
  subtitle,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  subtitle: string
}) {
  const styles = {
    primary: { icon: 'bg-primary/10 text-primary', border: 'border-primary/20' },
    success: { icon: 'bg-success/10 text-success', border: 'border-success/20' },
    warning: { icon: 'bg-warning/10 text-warning', border: 'border-warning/20' },
    danger: { icon: 'bg-danger/10 text-danger', border: 'border-danger/20' },
    info: { icon: 'bg-info/10 text-info', border: 'border-info/20' },
  }

  return (
    <div className={`rounded-xl border bg-surface px-4 py-3.5 ${styles[color].border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-text-muted">{title}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-text-primary">{value}</p>
          <p className="text-[11px] text-text-muted">{subtitle}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles[color].icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  to,
  icon,
  label,
  desc,
}: {
  to: string
  icon: React.ReactNode
  label: string
  desc: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-surface-secondary transition-colors group"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-[11px] text-text-muted">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}
