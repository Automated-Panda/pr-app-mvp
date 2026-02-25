import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { FileText, Clock, Send, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Task } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Mock trend data (last 12 weeks)                                   */
/* ------------------------------------------------------------------ */

const weeklyTrend = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  written: Math.floor(Math.random() * 12) + 8,
  delivered: Math.floor(Math.random() * 13) + 5,
}))

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function isThisMonth(dateStr: string | undefined): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function isPending(task: Task): boolean {
  return (
    task.internalStatus === 'New' ||
    task.internalStatus === 'Writing' ||
    task.internalStatus === 'Written'
  )
}

/* ------------------------------------------------------------------ */
/*  Chart tooltip                                                     */
/* ------------------------------------------------------------------ */

const CHART_COLORS = {
  Active: '#10b981',
  Paused: '#f59e0b',
  Cancelled: '#ef4444',
} as const

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-dark-900 border border-dark-700 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-dark-300 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function AdminOverview() {
  const tasks = useStore((s) => s.tasks)
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)

  /* ---- loading simulation ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- KPI computations ---- */
  const writtenThisMonth = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (t.internalStatus === 'Written' || t.internalStatus === 'Delivered') &&
          isThisMonth(t.writtenAt),
      ).length,
    [tasks],
  )

  const totalPending = useMemo(() => tasks.filter(isPending).length, [tasks])

  const deliveredThisMonth = useMemo(
    () =>
      tasks.filter(
        (t) => t.internalStatus === 'Delivered' && isThisMonth(t.deliveredAt),
      ).length,
    [tasks],
  )

  const mrr = useMemo(
    () => clients.filter((c) => c.status === 'Active').reduce((sum, c) => sum + c.mrr, 0),
    [clients],
  )

  const annualRevenue = mrr * 12

  /* ---- Client status chart data ---- */
  const clientStatusData = useMemo(() => {
    const counts: Record<string, number> = { Active: 0, Paused: 0, Cancelled: 0 }
    for (const c of clients) {
      counts[c.status] = (counts[c.status] || 0) + 1
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
  }, [clients])

  /* ---- At Risk locations ---- */
  const atRiskLocations = useMemo(() => {
    const pendingByLocation = new Map<string, number>()
    for (const t of tasks) {
      if (isPending(t)) {
        pendingByLocation.set(t.locationId, (pendingByLocation.get(t.locationId) || 0) + 1)
      }
    }
    const clientMap = new Map(clients.map((c) => [c.id, c.name]))
    return locations
      .filter((loc) => (pendingByLocation.get(loc.id) || 0) >= 3)
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        city: loc.city,
        clientName: clientMap.get(loc.clientId) ?? 'Unknown',
        pendingCount: pendingByLocation.get(loc.id) ?? 0,
      }))
      .sort((a, b) => b.pendingCount - a.pendingCount)
  }, [tasks, locations, clients])

  /* ---- skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of all operations" />

      {/* ---- KPI cards ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Written This Month"
          value={writtenThisMonth}
          icon={<FileText size={18} />}
          trend="up"
        />
        <KpiCard
          title="Total Pending"
          value={totalPending}
          icon={<Clock size={18} />}
          trend="neutral"
        />
        <KpiCard
          title="Delivered This Month"
          value={deliveredThisMonth}
          icon={<Send size={18} />}
          trend="up"
        />
        <KpiCard
          title="MRR"
          value={formatCurrency(mrr)}
          icon={<DollarSign size={18} />}
          trend="up"
        />
        <KpiCard
          title="Annual Revenue"
          value={formatCurrency(annualRevenue)}
          icon={<TrendingUp size={18} />}
          trend="up"
        />
      </div>

      {/* ---- Charts ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Written vs Delivered trend */}
        <Card className="p-5">
          <h3 className="text-sm font-medium text-dark-200 mb-4">Written vs Delivered Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorWritten" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="written"
                name="Written"
                stroke="#f97316"
                fill="url(#colorWritten)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="delivered"
                name="Delivered"
                stroke="#10b981"
                fill="url(#colorDelivered)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-xs text-dark-400">Written</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-dark-400">Delivered</span>
            </div>
          </div>
        </Card>

        {/* Clients by Status */}
        <Card className="p-5">
          <h3 className="text-sm font-medium text-dark-200 mb-4">Clients by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={clientStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {clientStatusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS] ?? '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]
                  return (
                    <div className="rounded-lg bg-dark-900 border border-dark-700 px-3 py-2 shadow-xl">
                      <p className="text-xs text-dark-200">
                        {String(d.name)}: <span className="font-medium">{String(d.value)}</span>
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-5 mt-2">
            {clientStatusData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      CHART_COLORS[entry.name as keyof typeof CHART_COLORS] ?? '#6b7280',
                  }}
                />
                <span className="text-xs text-dark-400">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ---- At Risk Locations ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle size={16} className="text-amber-400" />
            At Risk Locations
          </CardTitle>
          <p className="text-sm text-dark-400">
            Locations with high pending task counts
          </p>
        </CardHeader>
        <CardContent>
          {atRiskLocations.length === 0 ? (
            <p className="text-sm text-dark-500 py-4 text-center">
              No at-risk locations. All locations have fewer than 3 pending tasks.
            </p>
          ) : (
            <div className="divide-y divide-dark-700/50">
              {atRiskLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-100 truncate">{loc.name}</p>
                    <p className="text-xs text-dark-400">
                      {loc.clientName} &middot; {loc.city}
                    </p>
                  </div>
                  <Badge variant="destructive">{loc.pendingCount} pending</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
