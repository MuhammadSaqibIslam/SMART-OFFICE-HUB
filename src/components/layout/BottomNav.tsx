import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Monitor,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react'

const tabs = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/hardware-assets', label: 'Assets', icon: Monitor },
  { to: '/ask-ai', label: 'Ask AI', icon: Sparkles },
]

interface BottomNavProps {
  onMoreClick: () => void
}

export function BottomNav({ onMoreClick }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-default bg-surface xl:hidden">
      <div className="flex h-14 md:h-16 items-stretch px-2 sm:px-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 md:gap-1 text-[11px] md:text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted'
              }`
            }
          >
            <tab.icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.8} />
            {tab.label}
          </NavLink>
        ))}
        <button
          onClick={onMoreClick}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 md:gap-1 text-[11px] md:text-xs font-medium text-text-muted transition-colors"
        >
          <MoreHorizontal className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.8} />
          More
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
