import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/pages/login/LoginPage'
import { WriterQueue } from '@/pages/writer/WriterQueue'
import { WriterTaskDetail } from '@/pages/writer/WriterTaskDetail'
import { WriterWritten } from '@/pages/writer/WriterWritten'
import { ProviderOverview } from '@/pages/provider/ProviderOverview'
import { ProviderDelivery } from '@/pages/provider/ProviderDelivery'
import { ProviderItemDetail } from '@/pages/provider/ProviderItemDetail'
import { AdminOverview } from '@/pages/admin/AdminOverview'
import { AdminClients } from '@/pages/admin/AdminClients'
import { AdminLocations } from '@/pages/admin/AdminLocations'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminTasks } from '@/pages/admin/AdminTasks'
import { AdminActivity } from '@/pages/admin/AdminActivity'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        {/* Writer */}
        <Route path="/writer/queue" element={<WriterQueue />} />
        <Route path="/writer/task/:id" element={<WriterTaskDetail />} />
        <Route path="/writer/written" element={<WriterWritten />} />
        {/* Provider */}
        <Route path="/provider/overview" element={<ProviderOverview />} />
        <Route path="/provider/delivery" element={<ProviderDelivery />} />
        <Route path="/provider/item/:id" element={<ProviderItemDetail />} />
        {/* Admin */}
        <Route path="/admin/overview" element={<AdminOverview />} />
        <Route path="/admin/clients" element={<AdminClients />} />
        <Route path="/admin/locations" element={<AdminLocations />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/tasks" element={<AdminTasks />} />
        <Route path="/admin/activity" element={<AdminActivity />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
