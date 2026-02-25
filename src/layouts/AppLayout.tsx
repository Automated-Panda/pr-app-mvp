import { Outlet, Navigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const currentUser = useStore(s => s.currentUser)

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
