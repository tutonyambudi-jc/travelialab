import type { ReactNode } from 'react'
import Link from 'next/link'

interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  kicker?: string
  backHref?: string
  backLabel?: string
  actions?: ReactNode
}

export function AdminPageHeader({
  title,
  subtitle,
  kicker,
  backHref,
  backLabel = 'Retour admin',
  actions,
}: AdminPageHeaderProps) {
  return (
    <section className="ar-page-header overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)]">
      <div className="bg-gradient-to-r from-[#003580] via-[#0071c2] to-[#0f88d4] px-6 py-6 text-white md:px-8 md:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-50">
              {kicker || 'Espace admin'}
            </div>
            <h1 className="mt-4 text-[30px] font-extrabold leading-[1.1] tracking-tight text-white md:text-[36px]">{title}</h1>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50/90 md:text-[15px]">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {actions}
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
              >
                {backLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-white/90 px-6 py-4 text-sm text-slate-600 md:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
          Interface booking-style
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
          Navigation admin unifiée
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
          Actions rapides visibles
        </span>
      </div>
    </section>
  )
}
