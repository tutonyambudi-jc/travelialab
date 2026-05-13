import { cn } from '@/lib/utils'

export type SyncLogStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

type Props = {
  status: SyncLogStatus
  retryCount: number
  className?: string
}

/** Libellés alignés sur la spec produit (PENDING_SYNC, SYNCED, FAILED, RETRYING). */
export function SyncStatusBadge({ status, retryCount, className }: Props) {
  const isRetrying = status === 'PENDING' && retryCount > 0
  const label =
    status === 'SUCCESS'
      ? 'SYNCED'
      : status === 'FAILED'
        ? 'FAILED'
        : isRetrying
          ? 'RETRYING'
          : 'PENDING_SYNC'

  const styles =
    status === 'SUCCESS'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : status === 'FAILED'
        ? 'bg-red-50 text-red-800 ring-red-200'
        : isRetrying
          ? 'bg-sky-50 text-sky-800 ring-sky-200'
          : 'bg-amber-50 text-amber-900 ring-amber-200'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        styles,
        className
      )}
    >
      {label}
    </span>
  )
}
