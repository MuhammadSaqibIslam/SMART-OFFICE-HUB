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
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setPageError(null)
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
      setPageError('Failed to load dashboard data')
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
    <div className="space-y-4 xl:flex xl:h-full xl:flex-col xl:gap-5 xl:space-y-0 page-enter">
      {pageError && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{pageError}</div>
      )}

      {/* Inventory KPIs */}
      <section>
        <div className="mb-2 sm:mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg icon-gradient-primary">
            <Package className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary" strokeWidth={1.8} />
          </div>
          <h2 className="text-[15px] sm:text-base lg:text-lg font-semibold text-text-primary">Inventory Overview</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
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
        <div className="mb-2 sm:mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg icon-gradient-primary">
            <Monitor className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary" strokeWidth={1.8} />
          </div>
          <h2 className="text-[15px] sm:text-base lg:text-lg font-semibold text-text-primary">Hardware Assets</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:flex-1 xl:min-h-0">
        {/* Low Stock Items */}
        <div className="rounded-xl border border-border-default bg-surface flex flex-col min-h-0 card-enhanced">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3 card-header-accent">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md icon-gradient-warning">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              </div>
              <h3 className="text-sm lg:text-base font-semibold text-text-primary">Low Stock Items</h3>
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
                      <p className="text-xs text-text-muted">Min: {item.min_stock_threshold} {item.unit}</p>
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
        <div className="rounded-xl border border-border-default bg-surface flex flex-col min-h-0 card-enhanced">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3 card-header-accent">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md icon-gradient-info">
                <Clock className="h-3.5 w-3.5 text-info" />
              </div>
              <h3 className="text-sm lg:text-base font-semibold text-text-primary">Recent Activity</h3>
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
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border-default bg-surface flex flex-col min-h-0 card-enhanced">
          <div className="flex items-center gap-2 border-b border-border-default px-4 py-3 card-header-accent">
            <div className="flex h-6 w-6 items-center justify-center rounded-md icon-gradient-primary">
              <Plus className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm lg:text-base font-semibold text-text-primary">Quick Actions</h3>
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
    primary: { icon: 'icon-gradient-primary text-primary', border: 'border-primary/20', accent: 'kpi-accent-primary' },
    success: { icon: 'icon-gradient-success text-success', border: 'border-success/20', accent: 'kpi-accent-success' },
    warning: { icon: 'icon-gradient-warning text-warning', border: 'border-warning/20', accent: 'kpi-accent-warning' },
    danger: { icon: 'icon-gradient-danger text-danger', border: 'border-danger/20', accent: 'kpi-accent-danger' },
    info: { icon: 'icon-gradient-info text-info', border: 'border-info/20', accent: 'kpi-accent-info' },
  }

  return (
    <div className={`rounded-xl border bg-surface px-3 pt-4 pb-2.5 sm:px-4 sm:pt-5 sm:pb-3.5 lg:px-5 lg:pt-6 lg:pb-4 kpi-card ${styles[color].accent} ${styles[color].border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs lg:text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-0.5 text-xl sm:text-2xl lg:text-[1.7rem] font-semibold tabular-nums text-text-primary">{value}</p>
          <p className="text-[11px] sm:text-xs lg:text-sm text-text-muted">{subtitle}</p>
        </div>
        <div className={`flex h-7 w-7 sm:h-9 sm:w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg ${styles[color].icon}`}>
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
      className="flex items-center gap-3 rounded-lg px-3 py-3 lg:px-4 lg:py-3.5 text-sm hover:bg-surface-secondary transition-colors group"
    >
      <span className="flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm lg:text-base font-medium text-text-primary">{label}</p>
        <p className="text-xs lg:text-sm text-text-muted">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}
