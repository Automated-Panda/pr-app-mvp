import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import type { Task } from '@/data/types'

import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileCheck, Send, Clock, Inbox } from 'lucide-react'
import { formatDate, truncate } from '@/lib/utils'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ------------------------------------------------------------------ */
/*  Mock chart data                                                    */
/* ------------------------------------------------------------------ */

function generateChartData() {
  const data: { date: string; count: number }[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: Math.floor(Math.random() * 8) + 1,
    })
  }
  return data
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProviderOverview() {
  const [loading, setLoading] = useState(true)
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

  /* ---- derived data ---- */

  const writtenTasks = useMemo(
    () => tasks.filter((t) => t.internalStatus === 'Written'),
    [tasks],
  )

  const deliveredThisMonth = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return tasks.filter((t) => {
      if (t.internalStatus !== 'Delivered' || !t.deliveredAt) return false
      const d = new Date(t.deliveredAt)
      return d.getMonth() === month && d.getFullYear() === year
    }).length
  }, [tasks])

  const chartData = useMemo(() => generateChartData(), [])

  /* ---- helpers ---- */

  const getClientName = (id: string) =>
    clients.find((c) => c.id === id)?.name ?? 'Unknown'

  const getLocationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? 'Unknown'

  const getWriterName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? 'Unknown'

  const handleMarkDelivered = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    markDelivered(taskId)
    toast.success('Review marked as delivered')
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
          {truncate(task.contentDraft || task.contentBrief, 60)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (task: Task) => (
        <Button
          size="sm"
          onClick={(e) => handleMarkDelivered(task.id, e)}
        >
          <Send size={14} />
          Mark Delivered
        </Button>
      ),
    },
  ]

  /* ---- loading skeleton ---- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-[320px] rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  /* ---- render ---- */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provider Overview"
        description="Monitor delivery pipeline and manage written content ready for posting"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Written Pending Delivery"
          value={writtenTasks.length}
          icon={<FileCheck size={18} />}
          className="[&_.text-peach-400]:text-peach-400"
        />
        <KpiCard
          title="Delivered This Month"
          value={deliveredThisMonth}
          icon={<Send size={18} />}
          trend="up"
          change="+8% vs last month"
          className="[&>div>div:first-child]:text-emerald-400"
        />
        <KpiCard
          title="Avg Delivery Time"
          value="4.2 hours"
          icon={<Clock size={18} />}
          trend="down"
          change="-1.3h vs last month"
          className="[&>div>div:first-child]:text-blue-400"
        />
      </div>

      {/* Delivery Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="peachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#peachGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Needs Delivery Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>Needs Delivery</CardTitle>
            <Badge variant="default">{writtenTasks.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <DataTable
            columns={columns}
            data={writtenTasks}
            onRowClick={(task) => navigate(`/provider/item/${task.id}`)}
            keyExtractor={(item) => item.id}
            emptyState={
              <EmptyState
                icon={<Inbox size={24} />}
                title="All caught up!"
                description="No reviews are currently pending delivery."
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
