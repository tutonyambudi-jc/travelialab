'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock3, Tag, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Announcement = {
  id: string
  title: string
  description: string
  badge: string
  ctaLabel: string
  ctaHref: string
  tone: string
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'weekend-offer',
    title: 'Offres week-end sur plusieurs lignes',
    description: 'Economisez jusqu a 15% sur une selection de trajets en depart vendredi et samedi.',
    badge: 'Offre limitee',
    ctaLabel: 'Voir les offres',
    ctaHref: '/trips/search',
    tone: 'from-[#003580] via-[#0071c2] to-[#0b4ea2]',
  },
  {
    id: 'group-booking',
    title: 'Voyage en groupe, paiement simplifie',
    description: 'Creez un groupe, selectionnez les sieges et reglez en une seule operation.',
    badge: 'Nouveau',
    ctaLabel: 'Reserver en groupe',
    ctaHref: '/booking-groups',
    tone: 'from-[#005da0] via-[#0071c2] to-[#0d6fc0]',
  },
  {
    id: 'freight-launch',
    title: 'Service fret premium disponible',
    description: 'Expediez vos colis avec suivi QR et confirmation de reception.',
    badge: 'Service actif',
    ctaLabel: 'Envoyer un colis',
    ctaHref: '/freight',
    tone: 'from-[#1e3a8a] via-[#0f5bb8] to-[#0369a1]',
  },
  {
    id: 'loyalty-points',
    title: 'Cumulez des points de fidelite',
    description: 'Chaque reservation vous rapproche des avantages exclusifs et des remises.',
    badge: 'Programme fidelite',
    ctaLabel: 'Decouvrir',
    ctaHref: '/loyalty',
    tone: 'from-[#3b2f82] via-[#2459ad] to-[#0b4ea2]',
  },
]

export function HomeAnnouncementsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  const cards = useMemo(() => ANNOUNCEMENTS, [])

  useEffect(() => {
    if (cards.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length)
    }, 5500)

    return () => window.clearInterval(interval)
  }, [cards.length])

  const goTo = (index: number) => setActiveIndex(index)
  const next = () => setActiveIndex((prev) => (prev + 1) % cards.length)
  const prev = () => setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length)

  return (
    <section aria-label="Annonces" className="rounded-3xl border border-slate-200 bg-white p-3 shadow-xl md:p-4">
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {cards.map((item) => (
            <article
              key={item.id}
              className="relative min-w-full overflow-hidden rounded-2xl border border-white/10"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.tone}`} />
              <div className="absolute right-[-60px] top-[-60px] h-40 w-40 rounded-full bg-white/10 blur-xl" />
              <div className="absolute left-[-50px] bottom-[-50px] h-36 w-36 rounded-full bg-white/10 blur-xl" />

              <div className="relative grid gap-6 p-6 md:grid-cols-[1.4fr_auto] md:p-8">
                <div>
                  <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                    {item.badge}
                  </span>
                  <h3 className="mt-4 max-w-xl text-2xl font-extrabold tracking-tight text-white md:text-4xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 md:text-base">
                    {item.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/90">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      Confirmation rapide
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5">
                      <Ticket className="h-3.5 w-3.5" />
                      Billet digital
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Prix clairs
                    </span>
                  </div>
                </div>

                <div className="flex items-end md:items-center">
                  <Link
                    href={item.ctaHref}
                    className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white px-5 py-3 text-sm font-bold text-[#003580] transition-colors hover:bg-blue-50"
                  >
                    {item.ctaLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="absolute left-3 top-1/2 hidden -translate-y-1/2 md:block">
          <button
            type="button"
            onClick={prev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur hover:bg-white/30"
            aria-label="Annonce precedente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 md:block">
          <button
            type="button"
            onClick={next}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur hover:bg-white/30"
            aria-label="Annonce suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {cards.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Aller a l annonce ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex ? 'w-7 bg-[#0071c2]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2 md:hidden">
          <button
            type="button"
            onClick={prev}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
            aria-label="Annonce precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
            aria-label="Annonce suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
