import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-100',
        className,
      )}
    />
  )
}

/** Pre-built skeleton for a card row (icon + 2 lines of text) */
export function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  )
}

/** Pre-built skeleton for a feature card grid */
export function SkeletonFeatureCard() {
  return (
    <div className="flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-6">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-3.5 w-full" />
      <Skeleton className="mt-1 h-3.5 w-2/3" />
    </div>
  )
}
