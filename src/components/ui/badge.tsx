import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-peach-500/10 text-peach-400 border border-peach-500/20',
  secondary: 'bg-dark-700 text-dark-300 border border-dark-600',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  destructive: 'bg-red-500/10 text-red-400 border border-red-500/20',
  outline: 'border border-dark-600 text-dark-300 bg-transparent',
} as const

type BadgeVariant = keyof typeof variants

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}

function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeProps, BadgeVariant }
