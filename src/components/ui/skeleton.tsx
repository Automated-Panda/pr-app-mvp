import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('bg-dark-700 animate-pulse rounded-lg', className)}
    />
  )
}

export { Skeleton }
export type { SkeletonProps }
