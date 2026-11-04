import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Sun, Moon, LogOut, ChevronDown } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of inventory and hardware assets' },
  '/inventory': { title: 'Inventory', subtitle: 'Manage office inventory and consumables' },
  '/hardware-assets': { title: 'Hardware Assets', subtitle: 'Manage hardware assets and devices' },
  '/employees': { title: 'Employees', subtitle: 'Manage employee records' },
  '/purchase-requests': { title: 'Purchase Requests', subtitle: 'Manage purchase and reorder requests' },
  '/activity-log': { title: 'Activity Log', subtitle: 'View all system activity and history' },
  '/settings': { title: 'Settings', subtitle: 'Application settings and configuration' },
}

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const page = pageMeta[location.pathname] || { title: '', subtitle: '' }
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || ''
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-default bg-surface px-6">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-primary">{page.title}</h1>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors">
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            ) : (
              <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} />
            )}
          </TooltipTrigger>
          <TooltipContent>{theme === 'light' ? 'Dark mode' : 'Light mode'}</TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-border-default" />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-secondary transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight text-text-primary">{displayName}</p>
              <p className="text-[11px] leading-tight text-text-muted">{profile?.role === 'it_admin' ? 'IT Admin' : 'Office Manager'}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-text-muted hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-border-default bg-surface shadow-lg">
              <div className="border-b border-border-default px-4 py-3">
                <p className="text-sm font-medium text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {user?.email}
                </p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    signOut()
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
