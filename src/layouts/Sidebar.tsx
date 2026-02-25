import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import {
  LayoutDashboard,
  ListTodo,
  FileCheck,
  PenTool,
  Send,
  Users,
  Building2,
  MapPin,
  ClipboardList,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const writerNav: NavItem[] = [
  { label: 'Queue', path: '/writer/queue', icon: <ListTodo size={18} /> },
  { label: 'Written', path: '/writer/written', icon: <FileCheck size={18} /> },
]

const providerNav: NavItem[] = [
  { label: 'Overview', path: '/provider/overview', icon: <LayoutDashboard size={18} /> },
  { label: 'Delivery', path: '/provider/delivery', icon: <Send size={18} /> },
]

const adminNav: NavItem[] = [
  { label: 'Overview', path: '/admin/overview', icon: <LayoutDashboard size={18} /> },
  { label: 'Clients', path: '/admin/clients', icon: <Building2 size={18} /> },
  { label: 'Locations', path: '/admin/locations', icon: <MapPin size={18} /> },
  { label: 'Users', path: '/admin/users', icon: <Users size={18} /> },
  { label: 'Tasks', path: '/admin/tasks', icon: <ClipboardList size={18} /> },
  { label: 'Activity', path: '/admin/activity', icon: <Activity size={18} /> },
]

export function Sidebar() {
  const currentUser = useStore(s => s.currentUser)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  if (!currentUser) return null

  const navItems = currentUser.role === 'writer'
    ? writerNav
    : currentUser.role === 'provider'
      ? providerNav
      : adminNav

  const roleLabel = currentUser.role === 'writer'
    ? 'Writer'
    : currentUser.role === 'provider'
      ? 'Provider'
      : 'Admin'

  return (
    <aside
      className={cn(
        'h-full bg-dark-900 border-r border-dark-700/50 flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-dark-700/50 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-peach-500 flex items-center justify-center shrink-0">
            <PenTool size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-dark-50 whitespace-nowrap">
              Peach Reviews
            </span>
          )}
        </div>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-dark-700/50">
          <span className="text-[10px] uppercase tracking-wider text-dark-500 font-medium">
            {roleLabel} Panel
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-peach-500/10 text-peach-400'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-dark-700/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg text-dark-500 hover:text-dark-300 hover:bg-dark-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
