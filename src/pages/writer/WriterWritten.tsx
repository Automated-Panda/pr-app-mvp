import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageHeader } from '@/components/ui/page-header'
import { Search, FileCheck, Eye } from 'lucide-react'
import { cn, formatDate, truncate } from '@/lib/utils'
import type { Task } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Status filter chips                                               */
/* ------------------------------------------------------------------ */

const statusChips: { label: string; value: 'All' | 'Written' | 'Delivered' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Written', value: 'Written' },
  { label: 'Delivered', value: 'Delivered' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function WriterWritten() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const tasks = useStore((s) => s.tasks)
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)

  /* ---- loading simulation ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- filters ---- */
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Written' | 'Delivered'>('All')

  /* ---- lookup maps ---- */
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients],
  )
  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  )

  /* ---- written / delivered tasks ---- */
  const writtenTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.writerId === currentUser?.id &&
          (t.internalStatus === 'Written' || t.internalStatus === 'Delivered'),
      ),
    [tasks, currentUser],
  )

  /* ---- filtered ---- */
  const filtered = useMemo(() => {
    let result = writtenTasks

    if (statusFilter !== 'All') {
      result = result.filter((t) => t.internalStatus === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => {
        const clientName = clientMap.get(t.clientId)?.toLowerCase() ?? ''
        const locationName = locationMap.get(t.locationId)?.toLowerCase() ?? ''
        const draft = t.contentDraft.toLowerCase()
        return clientName.includes(q) || locationName.includes(q) || draft.includes(q)
      })
    }

    return result
  }, [writtenTasks, statusFilter, search, clientMap, locationMap])

  /* ---- counts ---- */
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: writtenTasks.length, Written: 0, Delivered: 0 }
    for (const t of writtenTasks) {
      if (t.internalStatus in map) {
        map[t.internalStatus]++
      }
    }
    return map
  }, [writtenTasks])

  /* ---- columns ---- */
  const columns = useMemo(
    () => [
      {
        key: 'writtenAt',
        header: 'Written Date',
        render: (task: Task) => (
          <span className="text-sm text-dark-200">
            {task.writtenAt ? formatDate(task.writtenAt) : '--'}
          </span>
        ),
      },
      {
        key: 'client',
        header: 'Client',
        render: (task: Task) => (
          <span className="text-dark-100 font-medium">
            {clientMap.get(task.clientId) ?? 'Unknown'}
          </span>
        ),
      },
      {
        key: 'location',
        header: 'Location',
        render: (task: Task) => (
          <span className="text-dark-300">
            {locationMap.get(task.locationId) ?? 'Unknown'}
          </span>
        ),
      },
      {
        key: 'platform',
        header: 'Platform',
        render: (task: Task) => <span className="text-dark-300">{task.platform}</span>,
      },
      {
        key: 'internalStatus',
        header: 'Status',
        render: (task: Task) => <StatusBadge status={task.internalStatus} />,
      },
      {
        key: 'contentPreview',
        header: 'Content Preview',
        render: (task: Task) => (
          <span className="text-dark-400 text-xs italic">
            {task.contentDraft ? truncate(task.contentDraft, 60) : 'No content'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: (task: Task) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/writer/task/${task.id}`)
            }}
          >
            <Eye size={14} />
            Open
          </Button>
        ),
      },
    ],
    [clientMap, locationMap, navigate],
  )

  /* ---- skeleton loading ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Writer', href: '/writer/queue' },
          { label: 'Written Items' },
        ]}
      />

      {/* Page header */}
      <PageHeader
        title="Written Items"
        description="Review content you have completed and items that have been delivered"
      />

      {/* Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <Input
            placeholder="Search client, location, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-2">
          {statusChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors',
                statusFilter === chip.value
                  ? 'bg-peach-500/15 text-peach-400 border border-peach-500/30'
                  : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-600',
              )}
            >
              {chip.label}
              <span className="ml-1.5 text-[10px] opacity-70">{counts[chip.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Data table */}
      <div className="bg-dark-850 border border-dark-700/50 rounded-xl overflow-hidden">
        <DataTable<Task>
          columns={columns}
          data={filtered}
          onRowClick={(task) => navigate(`/writer/task/${task.id}`)}
          keyExtractor={(task) => task.id}
          emptyState={
            <EmptyState
              icon={<FileCheck size={24} />}
              title="No written items"
              description={
                search || statusFilter !== 'All'
                  ? 'Try adjusting your filters to see more items.'
                  : 'You have not completed any reviews yet. Head to the queue to start writing!'
              }
              action={
                !search && statusFilter === 'All' ? (
                  <Button variant="secondary" onClick={() => navigate('/writer/queue')}>
                    Go to Queue
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </div>
    </div>
  )
}
