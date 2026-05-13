import { ReactNode } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { PublicSiteFooter } from '@/components/layout/PublicSiteFooter'

interface PublicInfoLayoutProps {
  badge: string
  title: string
  description: string
  children: ReactNode
}

export function PublicInfoLayout({ badge, title, description, children }: PublicInfoLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="pt-8 sm:pt-10">
        <section className="ar-page pb-8">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-6 py-9 text-white shadow-lg sm:px-10 sm:py-11">
            <p className="inline-flex rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">
              {badge}
            </p>
            <h1 className="mt-4 max-w-3xl text-[28px] leading-[1.15] font-extrabold tracking-tight sm:text-[34px]">{title}</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-blue-100 sm:text-base">{description}</p>
          </div>
        </section>

        <section className="ar-page pb-16">
          <div className="grid gap-6">{children}</div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
