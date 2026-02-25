import { useState, useEffect, useMemo } from 'react'
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
import { PageHeader } from '@/components/ui/page-header'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Search, ListChecks, UserCog } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { Task, InternalStatus, Priority } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function AdminTasks() {
  const tasks = useStore((s) => s.tasks)
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)
  const users = useStore((s) => s.users)
  const reassignTask = useStore((s) => s.reassignTask)

  /* ---- loading ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- filters ---- */
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InternalStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [clientFilter, setClientFilter] = useState('')
  const [writerFilter, setWriterFilter] = useState('')

  /* ---- reassign dialog ---- */
  const [reassignOpen, setReassignOpen] = useState(false)
  const [reassignTaskId, setReassignTaskId] = useState('')
  const [reassignWriterId, setReassignWriterId] = useState('')

  /* ---- lookup maps ---- */
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients],
  )
  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  )
  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u.name])),
    [users],
  )

  const writers = useMemo(
    () => users.filter((u) => u.role === 'writer'),
    [users],
  )

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  )

  const writerOptions = useMemo(
    () => writers.map((w) => ({ value: w.id, label: w.name })),
    [writers],
  )

  /* ---- filtered data ---- */
  const filtered = useMemo(() => {
    let result = tasks

    if (statusFilter) {
      result = result.filter((t) => t.internalStatus === statusFilter)
    }

    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter)
    }

    if (clientFilter) {
      result = result.filter((t) => t.clientId === clientFilter)
    }

    if (writerFilter) {
      result = result.filter((t) => t.writerId === writerFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => {
        const clientName = clientMap.get(t.clientId)?.toLowerCase() ?? ''
        const locationName = locationMap.get(t.locationId)?.toLowerCase() ?? ''
        const writerName = userMap.get(t.writerId)?.toLowerCase() ?? ''
        return (
          clientName.includes(q) ||
          locationName.includes(q) ||
          writerName.includes(q) ||
          t.platform.toLowerCase().includes(q)
        )
      })
    }

    return result
  }, [tasks, statusFilter, priorityFilter, clientFilter, writerFilter, search, clientMap, locationMap, userMap])

  /* ---- reassign handlers ---- */
  const openReassign = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    setReassignTaskId(task.id)
    setReassignWriterId(task.writerId)
    setReassignOpen(true)
  }

  const handleReassign = () => {
    if (!reassignWriterId) {
      toast.error('Please select a writer')
      return
    }
    reassignTask(reassignTaskId, reassignWriterId)
    const writerName = userMap.get(reassignWriterId) ?? 'Unknown'
    toast.success(`Task reassigned to ${writerName}`)
    setReassignOpen(false)
  }

  /* ---- columns ---- */
  const columns = useMemo(
    () => [
      {
        key: 'dueAt',
        header: 'Due Date',
        render: (task: Task) => {
          const overdue =
            new Date(task.dueAt) < new Date() && task.internalStatus !== 'Delivered'
          return (
            <span
              className={cn(
                'text-sm',
                overdue ? 'text-red-400 font-medium' : 'text-dark-200',
              )}
            >
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
        key: 'writer',
        header: 'Writer',
        render: (task: Task) => (
          <span className="text-dark-200 text-sm">
            {userMap.get(task.writerId) ?? 'Unassigned'}
          </span>
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
        key: 'airtableStatus',
        header: 'Airtable',
        render: (task: Task) => (
          <span className="text-dark-400 text-xs">{task.airtableStatus}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        render: (task: Task) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => openReassign(e, task)}
          >
            <UserCog size={14} />
            <span className="hidden sm:inline">Reassign</span>
          </Button>
        ),
      },
    ],
    [clientMap, locationMap, userMap],
  )

  /* ---- skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-3 flex-wrap">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Tasks"
        description={`${tasks.length} total tasks across all writers`}
      />

      {/* ---- Filters ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'New', label: 'New' },
            { value: 'Writing', label: 'Writing' },
            { value: 'Written', label: 'Written' },
            { value: 'Delivered', label: 'Delivered' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InternalStatus | '')}
          className="w-36"
        />
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
          options={[{ value: '', label: 'All Clients' }, ...clientOptions]}
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[{ value: '', label: 'All Writers' }, ...writerOptions]}
          value={writerFilter}
          onChange={(e) => setWriterFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* ---- Table ---- */}
      <div className="bg-dark-850 border border-dark-700/50 rounded-xl overflow-hidden">
        <DataTable<Task>
          columns={columns}
          data={filtered}
          keyExtractor={(task) => task.id}
          emptyState={
            <EmptyState
              icon={<ListChecks size={24} />}
              title="No tasks found"
              description={
                search || statusFilter || priorityFilter || clientFilter || writerFilter
                  ? 'Try adjusting your filters to see more tasks.'
                  : 'No tasks in the system yet.'
              }
            />
          }
        />
      </div>

      {/* ---- Reassign Dialog ---- */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">
                Assign to Writer
              </label>
              <Select
                options={writerOptions}
                placeholder="Select a writer"
                value={reassignWriterId}
                onChange={(e) => setReassignWriterId(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleReassign}>Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
