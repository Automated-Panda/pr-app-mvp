import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Search, Activity, ChevronDown } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { ActivityEntry } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Action type color mapping                                         */
/* ------------------------------------------------------------------ */

function getActionDotColor(action: string): string {
  const lower = action.toLowerCase()
  if (lower.includes('started writing') || lower.includes('writing')) return 'bg-blue-500'
  if (lower.includes('written') || lower.includes('saved draft')) return 'bg-peach-500'
  if (lower.includes('delivered')) return 'bg-emerald-500'
  if (lower.includes('reassigned')) return 'bg-amber-500'
  if (lower.includes('added') || lower.includes('created')) return 'bg-cyan-500'
  if (lower.includes('deleted')) return 'bg-red-500'
  if (lower.includes('updated')) return 'bg-violet-500'
  return 'bg-dark-500'
}

/* ------------------------------------------------------------------ */
/*  Page size                                                         */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function AdminActivity() {
  const globalActivity = useStore((s) => s.globalActivity)

  /* ---- loading ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- filters ---- */
  const [search, setSearch] = useState('')

  /* ---- pagination ---- */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  /* ---- filtered data ---- */
  const filtered = useMemo(() => {
    if (!search.trim()) return globalActivity
    const q = search.toLowerCase()
    return globalActivity.filter(
      (entry) =>
        entry.action.toLowerCase().includes(q) ||
        (entry.userName ?? '').toLowerCase().includes(q),
    )
  }, [globalActivity, search])

  const visibleEntries = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  )

  const hasMore = visibleCount < filtered.length

  const loadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  /* ---- skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-9 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Feed"
        description="All actions across the platform"
      />

      {/* ---- Search ---- */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            className="pl-9"
          />
        </div>
        <span className="text-xs text-dark-500">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* ---- Activity list ---- */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Activity size={24} />}
          title="No activity found"
          description={
            search
              ? 'Try adjusting your search query.'
              : 'No activity recorded yet. Actions will appear here as users interact with the platform.'
          }
        />
      ) : (
        <Card className="divide-y divide-dark-700/50 overflow-hidden">
          {visibleEntries.map((entry: ActivityEntry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-dark-800/50"
            >
              {/* Colored dot */}
              <div className="mt-1.5 flex-shrink-0">
                <span
                  className={`block h-2.5 w-2.5 rounded-full ${getActionDotColor(entry.action)}`}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-dark-100">{entry.action}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {entry.userName && (
                    <span className="text-xs text-dark-400">{entry.userName}</span>
                  )}
                  <span className="text-xs text-dark-500">
                    {formatRelativeTime(entry.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                className="text-dark-400"
              >
                <ChevronDown size={14} />
                Load More ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
