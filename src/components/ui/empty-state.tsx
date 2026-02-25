import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-800 text-dark-400 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-medium text-dark-200 mb-1">{title}</h3>
      <p className="text-sm text-dark-500 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
