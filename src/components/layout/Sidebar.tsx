import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Monitor,
  Users,
  ShoppingCart,
  ClipboardList,
  Settings,
  Sparkles,
} from 'lucide-react'

const APP_VERSION = '1.0.0'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/hardware-assets', label: 'Hardware Assets', icon: Monitor },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/purchase-requests', label: 'Purchase Requests', icon: ShoppingCart },
  { to: '/activity-log', label: 'Activity Log', icon: ClipboardList },
  { to: '/ask-ai', label: 'Ask AI', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 xl:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border-default bg-sidebar transition-transform duration-200 xl:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 sm:h-16 lg:h-[4.25rem] items-center gap-2 border-b border-border-default px-4 sm:px-6 sidebar-logo-gradient">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <Package className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
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
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-light text-primary'
                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary hover:translate-x-0.5'
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

        {/* Version */}
        <div className="border-t border-border-default px-6 py-3">
          <p className="text-xs text-text-muted">
            Smart Office Hub <span className="text-text-muted/70">· v{APP_VERSION}</span>
          </p>
        </div>
      </aside>
    </>
  )
}
