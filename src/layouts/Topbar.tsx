import { useStore } from '@/store/useStore'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut, User, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function Topbar() {
  const currentUser = useStore(s => s.currentUser)
  const logout = useStore(s => s.logout)
  const resetStore = useStore(s => s.resetStore)
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleReset = () => {
    localStorage.removeItem('peach-reviews-storage')
    resetStore()
    setShowUserMenu(false)
    toast.success('Demo data has been reset')
  }

  return (
    <header className="h-14 bg-dark-900 border-b border-dark-700/50 flex items-center justify-between px-4 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-dark-800 border border-dark-700 rounded-lg h-8 pl-9 pr-3 text-sm text-dark-200 placeholder:text-dark-500 outline-none focus:ring-1 focus:ring-peach-500/40 focus:border-peach-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-peach-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-peach-500/20 flex items-center justify-center">
              <User size={14} className="text-peach-400" />
            </div>
            <span className="text-sm text-dark-200 hidden sm:block">
              {currentUser?.name ?? 'User'}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-dark-850 border border-dark-700 rounded-lg shadow-xl z-50 py-1">
                <div className="px-3 py-2 border-b border-dark-700">
                  <p className="text-xs text-dark-400">Signed in as</p>
                  <p className="text-sm text-dark-100 font-medium truncate">{currentUser?.email}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset demo data
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
