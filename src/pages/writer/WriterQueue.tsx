import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageHeader } from '@/components/ui/page-header'
import { Search, ListChecks, Play, CheckCircle2, Eye } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { Task, InternalStatus, Platform, Priority } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Status chip options                                               */
/* ------------------------------------------------------------------ */

const statusChips: { label: string; value: InternalStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'New', value: 'New' },
  { label: 'Writing', value: 'Writing' },
  { label: 'Written', value: 'Written' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function WriterQueue() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const tasks = useStore((s) => s.tasks)
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)
  const startWriting = useStore((s) => s.startWriting)
  const markWritten = useStore((s) => s.markWritten)

  /* ---- loading simulation ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- filters ---- */
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InternalStatus | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [platformFilter, setPlatformFilter] = useState<Platform | ''>('')

  /* ---- helpers to look up names ---- */
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients],
  )
  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  )

  /* ---- my tasks (writer) ---- */
  const myTasks = useMemo(
    () => tasks.filter((t) => t.writerId === currentUser?.id),
    [tasks, currentUser],
  )

  /* ---- filtered tasks ---- */
  const filtered = useMemo(() => {
    let result = myTasks

    if (statusFilter !== 'All') {
      result = result.filter((t) => t.internalStatus === statusFilter)
    }

    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter)
    }

    if (platformFilter) {
      result = result.filter((t) => t.platform === platformFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => {
        const clientName = clientMap.get(t.clientId)?.toLowerCase() ?? ''
        const locationName = locationMap.get(t.locationId)?.toLowerCase() ?? ''
        return clientName.includes(q) || locationName.includes(q)
      })
    }

    return result
  }, [myTasks, statusFilter, priorityFilter, platformFilter, search, clientMap, locationMap])

  /* ---- stat counts ---- */
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: myTasks.length, New: 0, Writing: 0, Written: 0 }
    for (const t of myTasks) {
      if (t.internalStatus in map) {
        map[t.internalStatus]++
      }
    }
    return map
  }, [myTasks])

  /* ---- actions ---- */
  const handleStartWriting = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    startWriting(taskId)
    toast.success('Task moved to Writing')
  }

  const handleMarkWritten = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    markWritten(taskId)
    toast.success('Task marked as Written')
  }

  const handleOpen = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    navigate(`/writer/task/${taskId}`)
  }

  /* ---- columns ---- */
  const columns = useMemo(
    () => [
      {
        key: 'dueAt',
        header: 'Due Date',
        render: (task: Task) => {
          const overdue = new Date(task.dueAt) < new Date()
          return (
            <span className={cn('text-sm', overdue ? 'text-red-400 font-medium' : 'text-dark-200')}>
              {formatDate(task.dueAt)}
            </span>
          )
        },
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
        key: 'airtableStatus',
        header: 'Airtable Status',
        render: (task: Task) => (
          <span className="text-dark-400 text-xs">{task.airtableStatus}</span>
        ),
      },
      {
        key: 'internalStatus',
        header: 'Status',
        render: (task: Task) => <StatusBadge status={task.internalStatus} />,
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (task: Task) => <PriorityBadge priority={task.priority} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        render: (task: Task) => (
          <div className="flex items-center justify-end gap-1.5">
            {task.internalStatus === 'New' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => handleStartWriting(e, task.id)}
              >
                <Play size={12} />
                Start
              </Button>
            )}
            {task.internalStatus === 'Writing' && (
              <Button
                size="sm"
                onClick={(e) => handleMarkWritten(e, task.id)}
              >
                <CheckCircle2 size={12} />
                Written
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleOpen(e, task.id)}
            >
              <Eye size={14} />
            </Button>
          </div>
        ),
      },
    ],
    [clientMap, locationMap],
  )

  /* ---- skeleton loading ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
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
      <Breadcrumbs items={[{ label: 'Writer', href: '/writer/queue' }, { label: 'Queue' }]} />

      {/* Page header */}
      <PageHeader
        title="Writing Queue"
        description="Manage and complete your assigned review writing tasks"
      />

      {/* Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <Input
              placeholder="Search client or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
            className="w-36"
          />
          <Select
            options={[
              { value: '', label: 'All Platforms' },
              { value: 'Google', label: 'Google' },
              { value: 'Trustpilot', label: 'Trustpilot' },
              { value: 'Facebook', label: 'Facebook' },
              { value: 'Yelp', label: 'Yelp' },
            ]}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | '')}
            className="w-36"
          />
        </div>
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

      {/* Summary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statusChips.map((chip) => (
          <div
            key={chip.value}
            className={cn(
              'rounded-xl border px-4 py-3 transition-colors',
              statusFilter === chip.value
                ? 'bg-peach-500/5 border-peach-500/20'
                : 'bg-dark-850 border-dark-700/50',
            )}
          >
            <p className="text-xs text-dark-400 font-medium">{chip.label}</p>
            <p className="text-xl font-semibold text-dark-50 mt-0.5">{counts[chip.value] ?? 0}</p>
          </div>
        ))}
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
              icon={<ListChecks size={24} />}
              title="No tasks found"
              description={
                search || statusFilter !== 'All' || priorityFilter || platformFilter
                  ? 'Try adjusting your filters to see more tasks.'
                  : 'You have no tasks assigned. Check back later!'
              }
            />
          }
        />
      </div>
    </div>
  )
}
