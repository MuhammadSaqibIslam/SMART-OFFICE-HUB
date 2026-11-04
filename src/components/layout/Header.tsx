import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Sun, Moon, LogOut, ChevronDown, Menu, CheckCircle2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getNotifications, getReadIds, saveReadIds, type AppNotification } from '@/services/notifications'

const kindDot: Record<string, string> = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
}

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of inventory and hardware assets' },
  '/inventory': { title: 'Inventory', subtitle: 'Manage office inventory and consumables' },
  '/hardware-assets': { title: 'Hardware Assets', subtitle: 'Manage hardware assets and devices' },
  '/employees': { title: 'Employees', subtitle: 'Manage employee records' },
  '/purchase-requests': { title: 'Purchase Requests', subtitle: 'Manage purchase and reorder requests' },
  '/activity-log': { title: 'Activity Log', subtitle: 'View all system activity and history' },
  '/settings': { title: 'Settings', subtitle: 'Application settings and configuration' },
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const page = pageMeta[location.pathname] || { title: '', subtitle: '' }
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [readIds, setReadIds] = useState<string[]>(() => getReadIds())
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(() => {
    getNotifications()
      .then((list) => {
        setNotifications(list)
        // Prune stored read ids to only those that still exist
        setReadIds((prev) => {
          const valid = prev.filter((id) => list.some((n) => n.id === id))
          saveReadIds(valid)
          return valid
        })
      })
      .catch(() => setNotifications([]))
  }, [])

  // Refresh notifications on mount and whenever the route changes (after actions)
  useEffect(() => { loadNotifications() }, [loadNotifications, location.pathname])

  const isRead = (id: string) => readIds.includes(id)
  const unreadCount = notifications.filter((n) => !isRead(n.id)).length

  const markRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveReadIds(next)
      return next
    })
  }

  const markAllRead = () => {
    const all = notifications.map((n) => n.id)
    setReadIds(all)
    saveReadIds(all)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openNotification = (n: AppNotification) => {
    markRead(n.id)
    setShowNotif(false)
    navigate(n.to)
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || ''
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-default bg-surface px-6">
      {/* Page Title + mobile menu */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-primary">{page.title}</h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif((s) => !s)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-border-default bg-surface shadow-lg">
              <div className="flex items-center justify-between border-b border-border-default px-4 py-2.5">
                <span className="text-sm font-semibold text-text-primary">
                  Notifications{unreadCount > 0 && <span className="ml-1 text-xs font-normal text-text-muted">({unreadCount} new)</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-primary hover:text-primary-hover">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <CheckCircle2 className="h-8 w-8 text-success/60" />
                    <p className="text-sm text-text-secondary">All caught up</p>
                    <p className="text-xs text-text-muted">No notifications right now</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const unread = !isRead(n.id)
                    return (
                      <button
                        key={n.id}
                        onClick={() => openNotification(n)}
                        className={`flex w-full items-start gap-3 border-b border-border-default px-4 py-3 text-left last:border-0 hover:bg-surface-secondary/50 ${unread ? 'bg-primary/[0.04]' : ''}`}
                      >
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? kindDot[n.kind] : 'bg-border-default'}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${unread ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>{n.title}</p>
                          <p className="text-xs text-text-muted">{n.description}</p>
                        </div>
                        {unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" title="Unread" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
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
