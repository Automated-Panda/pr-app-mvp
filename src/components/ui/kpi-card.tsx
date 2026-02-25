import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface KpiCardProps {
  title: string
  value: string | number
  change?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

const trendColors = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  neutral: 'text-dark-400',
} as const

const trendArrows = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
} as const

function KpiCard({ title, value, change, icon, trend = 'neutral', className }: KpiCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800 text-peach-400">
            {icon}
          </div>
        )}
      </div>
      <div className={cn('mt-3', !icon && 'mt-0')}>
        <p className="text-sm font-medium text-dark-400">{title}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-dark-50">{value}</span>
          {change && (
            <span className={cn('text-xs font-medium', trendColors[trend])}>
              {trendArrows[trend]} {change}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

export { KpiCard }
export type { KpiCardProps }
