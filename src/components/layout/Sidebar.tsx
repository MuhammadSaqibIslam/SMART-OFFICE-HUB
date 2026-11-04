import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Monitor,
  Users,
  ShoppingCart,
  ClipboardList,
  Settings,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/hardware-assets', label: 'Hardware Assets', icon: Monitor },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/purchase-requests', label: 'Purchase Requests', icon: ShoppingCart },
  { to: '/activity-log', label: 'Activity Log', icon: ClipboardList },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border-default bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border-default px-6">
        <Package className="h-7 w-7 text-primary" strokeWidth={2} />
        <span className="text-lg font-semibold text-text-primary">
          Smart Office Hub
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                  }`
                }
              >
                <item.icon className="h-5 w-5" strokeWidth={1.8} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
