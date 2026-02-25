import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Send,
  FileText,
  User,
  MapPin,
  Globe,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Activity dot colors                                                */
/* ------------------------------------------------------------------ */

function getActivityDotColor(action: string): string {
  if (action.toLowerCase().includes('delivered')) return 'bg-emerald-400'
  if (action.toLowerCase().includes('written') || action.toLowerCase().includes('marked'))
    return 'bg-peach-400'
  if (action.toLowerCase().includes('writing') || action.toLowerCase().includes('started'))
    return 'bg-blue-400'
  if (action.toLowerCase().includes('saved') || action.toLowerCase().includes('draft'))
    return 'bg-amber-400'
  return 'bg-dark-500'
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProviderItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const tasks = useStore((s) => s.tasks)
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)
  const users = useStore((s) => s.users)
  const markDelivered = useStore((s) => s.markDelivered)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const task = tasks.find((t) => t.id === id)
  const client = task ? clients.find((c) => c.id === task.clientId) : null
  const location = task ? locations.find((l) => l.id === task.locationId) : null
  const writer = task ? users.find((u) => u.id === task.writerId) : null

  /* ---- word count ---- */

  const wordCount = task?.contentDraft
    ? task.contentDraft.split(/\s+/).filter(Boolean).length
    : 0

  /* ---- actions ---- */

  const handleMarkDelivered = () => {
    if (!task) return
    markDelivered(task.id)
    toast.success('Review delivered successfully')
    navigate('/provider/delivery')
  }

  /* ---- loading skeleton ---- */

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  /* ---- not found ---- */

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dark-800 text-dark-400 mb-4">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-lg font-semibold text-dark-100 mb-1">
          Item Not Found
        </h2>
        <p className="text-sm text-dark-500 mb-6">
          The review item you are looking for does not exist or has been removed.
        </p>
        <Button variant="secondary" onClick={() => navigate('/provider/delivery')}>
          Back to Delivery Queue
        </Button>
      </div>
    )
  }

  /* ---- render ---- */

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Provider', href: '/provider/overview' },
          { label: 'Delivery', href: '/provider/delivery' },
          { label: `Item #${task.id.slice(0, 8)}` },
        ]}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Written Content Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-peach-400" />
                <CardTitle>Review Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-dark-900 rounded-lg p-5 border border-dark-700/50">
                <p className="text-base leading-relaxed text-dark-100 whitespace-pre-wrap">
                  {task.contentDraft || (
                    <span className="italic text-dark-500">
                      No content draft available.
                    </span>
                  )}
                </p>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-dark-400">
                <span className="flex items-center gap-1.5">
                  <FileText size={13} />
                  {wordCount} words
                </span>
                {task.writtenAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    Written {formatDate(task.writtenAt)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Globe size={13} />
                  {task.platform}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Action Card */}
          {task.internalStatus === 'Written' && (
            <Card className="border-peach-500/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-dark-50 mb-1">
                      Ready for Delivery
                    </h3>
                    <p className="text-sm text-dark-400">
                      Confirm this review has been posted to {task.platform}
                    </p>
                  </div>
                  <Button
                    className="h-11 px-8 text-sm font-semibold shrink-0"
                    onClick={handleMarkDelivered}
                  >
                    <Send size={16} />
                    Mark as Delivered
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column — 1/3 */}
        <div className="space-y-6">
          {/* Context Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <DetailRow
                  icon={<User size={14} />}
                  label="Client"
                  value={client?.name ?? 'Unknown'}
                />
                <DetailRow
                  icon={<MapPin size={14} />}
                  label="Location"
                  value={location?.name ?? 'Unknown'}
                />
                <DetailRow
                  icon={<Globe size={14} />}
                  label="Platform"
                  value={task.platform}
                />
                <div>
                  <dt className="flex items-center gap-2 text-xs text-dark-500 mb-1">
                    Priority
                  </dt>
                  <dd>
                    <PriorityBadge priority={task.priority} />
                  </dd>
                </div>
                <DetailRow
                  icon={<User size={14} />}
                  label="Writer"
                  value={writer?.name ?? 'Unknown'}
                />
                <DetailRow
                  icon={<Calendar size={14} />}
                  label="Written Date"
                  value={task.writtenAt ? formatDate(task.writtenAt) : '-'}
                />
                <div>
                  <dt className="flex items-center gap-2 text-xs text-dark-500 mb-1">
                    Airtable Status
                  </dt>
                  <dd className="text-sm text-dark-200">
                    {task.airtableStatus}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs text-dark-500 mb-1">
                    Internal Status
                  </dt>
                  <dd>
                    <StatusBadge status={task.internalStatus} />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Activity Log Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-dark-400" />
                <CardTitle className="text-base">Activity Log</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {task.activity.length === 0 ? (
                <p className="text-sm text-dark-500 italic">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="relative space-y-0">
                  {[...task.activity]
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime(),
                    )
                    .map((entry, idx, arr) => (
                      <div key={entry.id} className="relative flex gap-3 pb-4">
                        {/* Timeline line */}
                        {idx < arr.length - 1 && (
                          <div className="absolute left-[7px] top-4 bottom-0 w-px bg-dark-700" />
                        )}
                        {/* Dot */}
                        <div
                          className={`relative mt-1 h-[14px] w-[14px] shrink-0 rounded-full border-2 border-dark-850 ${getActivityDotColor(entry.action)}`}
                        />
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-dark-200 leading-snug">
                            {entry.action}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.userName && (
                              <span className="text-xs text-dark-500">
                                {entry.userName}
                              </span>
                            )}
                            <span className="text-xs text-dark-600">
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail Row helper component                                        */
/* ------------------------------------------------------------------ */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs text-dark-500 mb-1">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-dark-200">{value}</dd>
    </div>
  )
}
