import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import type { Task } from '@/data/types'

import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Send, ExternalLink, Inbox } from 'lucide-react'
import { formatDate, truncate } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProviderDelivery() {
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const navigate = useNavigate()

  const tasks = useStore((s) => s.tasks)
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)
  const users = useStore((s) => s.users)
  const markDelivered = useStore((s) => s.markDelivered)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- helpers ---- */

  const getClientName = (id: string) =>
    clients.find((c) => c.id === id)?.name ?? 'Unknown'

  const getLocationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? 'Unknown'

  const getWriterName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? 'Unknown'

  /* ---- unique values for filter dropdowns ---- */

  const writtenTasks = useMemo(
    () => tasks.filter((t) => t.internalStatus === 'Written'),
    [tasks],
  )

  const uniqueClients = useMemo(() => {
    const ids = [...new Set(writtenTasks.map((t) => t.clientId))]
    return ids.map((id) => ({ value: id, label: getClientName(id) }))
  }, [writtenTasks, clients])

  const uniquePlatforms = useMemo(() => {
    const platforms = [...new Set(writtenTasks.map((t) => t.platform))]
    return platforms.map((p) => ({ value: p, label: p }))
  }, [writtenTasks])

  /* ---- filtered data ---- */

  const filteredTasks = useMemo(() => {
    let result = writtenTasks

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          getClientName(t.clientId).toLowerCase().includes(q) ||
          getLocationName(t.locationId).toLowerCase().includes(q) ||
          getWriterName(t.writerId).toLowerCase().includes(q) ||
          (t.contentDraft || '').toLowerCase().includes(q),
      )
    }

    if (clientFilter) {
      result = result.filter((t) => t.clientId === clientFilter)
    }

    if (platformFilter) {
      result = result.filter((t) => t.platform === platformFilter)
    }

    return result
  }, [writtenTasks, search, clientFilter, platformFilter, clients, locations, users])

  /* ---- actions ---- */

  const handleMarkDelivered = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    markDelivered(taskId)
    toast.success('Review delivered successfully')
  }

  /* ---- table columns ---- */

  const columns = [
    {
      key: 'client',
      header: 'Client',
      render: (task: Task) => (
        <span className="font-medium text-dark-100">
          {getClientName(task.clientId)}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (task: Task) => getLocationName(task.locationId),
    },
    {
      key: 'writtenAt',
      header: 'Written Date',
      render: (task: Task) =>
        task.writtenAt ? formatDate(task.writtenAt) : '-',
    },
    {
      key: 'writer',
      header: 'Writer',
      render: (task: Task) => getWriterName(task.writerId),
    },
    {
      key: 'preview',
      header: 'Preview',
      render: (task: Task) => (
        <span className="text-dark-400">
          {truncate(task.contentDraft || task.contentBrief, 80)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (task: Task) => <StatusBadge status={task.internalStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (task: Task) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/provider/item/${task.id}`)
            }}
          >
            <ExternalLink size={14} />
            Open
          </Button>
          <Button
            size="sm"
            onClick={(e) => handleMarkDelivered(task.id, e)}
          >
            <Send size={14} />
            Mark Delivered
          </Button>
        </div>
      ),
    },
  ]

  /* ---- loading skeleton ---- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-40 mb-1" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  /* ---- render ---- */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Queue"
        description="Review written content and mark as delivered"
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
          />
          <Input
            placeholder="Search by client, location, writer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="bg-dark-800 border border-dark-700 text-dark-100 focus:ring-2 focus:ring-peach-500/40 focus:border-peach-500 rounded-lg h-9 px-3 text-sm outline-none transition-colors appearance-none cursor-pointer bg-[url(&quot;data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E&quot;)] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8 w-auto min-w-[160px]"
        >
          <option value="">All Clients</option>
          {uniqueClients.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="bg-dark-800 border border-dark-700 text-dark-100 focus:ring-2 focus:ring-peach-500/40 focus:border-peach-500 rounded-lg h-9 px-3 text-sm outline-none transition-colors appearance-none cursor-pointer bg-[url(&quot;data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E&quot;)] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8 w-auto min-w-[160px]"
        >
          <option value="">All Platforms</option>
          {uniquePlatforms.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-dark-850 border border-dark-700/50 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredTasks}
          onRowClick={(task) => navigate(`/provider/item/${task.id}`)}
          keyExtractor={(item) => item.id}
          emptyState={
            <EmptyState
              icon={<Inbox size={24} />}
              title="All caught up!"
              description="No reviews pending delivery."
            />
          }
        />
      </div>
    </div>
  )
}
