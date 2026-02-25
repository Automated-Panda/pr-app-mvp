import type { InternalStatus } from '@/data/types'
import { cn } from '@/lib/utils'

const statusStyles: Record<InternalStatus, string> = {
  New: 'bg-dark-700 text-dark-300 border border-dark-600',
  Writing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Written: 'bg-peach-500/10 text-peach-400 border border-peach-500/20',
  Delivered: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
}

interface StatusBadgeProps {
  status: InternalStatus
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}

export { StatusBadge }
export type { StatusBadgeProps }
