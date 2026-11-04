import { useState, useRef, useEffect } from 'react'
import { Search, Bell, Sun, Moon, User, LogOut } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-default bg-surface px-6">
      {/* Global Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search inventory, assets, employees..."
          className="h-10 w-full rounded-lg border border-border-default bg-surface-secondary pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors">
          <Bell className="h-5 w-5" strokeWidth={1.8} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" strokeWidth={1.8} />
          ) : (
            <Sun className="h-5 w-5" strokeWidth={1.8} />
          )}
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary"
          >
            <User className="h-5 w-5" strokeWidth={1.8} />
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
