import { cn } from '@/lib/utils'

interface AdminStatusBadgeProps {
  status: string | null | undefined
  className?: string
  label?: string
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  REDEEMED: 'bg-emerald-100 text-emerald-700',
  PAID: 'bg-emerald-100 text-emerald-700',

  PENDING: 'bg-amber-100 text-amber-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  DRAFT: 'bg-blue-100 text-blue-700',

  CANCELLED: 'bg-rose-100 text-rose-700',
  CANCELED: 'bg-rose-100 text-rose-700',
  EXPIRED: 'bg-rose-100 text-rose-700',
  FAILED: 'bg-rose-100 text-rose-700',

  INACTIVE: 'bg-slate-200 text-slate-700',
  DEFAULT: 'bg-slate-200 text-slate-700',
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Valide',
  PENDING: 'En attente',
  CANCELLED: 'Annule',
  CANCELED: 'Annule',
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
}

export function AdminStatusBadge({ status, className, label }: AdminStatusBadgeProps) {
  const normalized = (status || 'DEFAULT').toUpperCase()
  const resolvedLabel = label ?? STATUS_LABELS[normalized] ?? normalized

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide',
        STATUS_STYLES[normalized] || STATUS_STYLES.DEFAULT,
        className
      )}
    >
      {resolvedLabel}
    </span>
  )
}
