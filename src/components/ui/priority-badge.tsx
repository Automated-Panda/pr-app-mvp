import type { Priority } from '@/data/types'
import { cn } from '@/lib/utils'

const priorityStyles: Record<Priority, string> = {
  High: 'bg-red-500/10 text-red-400 border border-red-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Low: 'bg-dark-600/50 text-dark-400 border border-dark-600',
}

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        priorityStyles[priority],
        className,
      )}
    >
      {priority}
    </span>
  )
}

export { PriorityBadge }
export type { PriorityBadgeProps }
