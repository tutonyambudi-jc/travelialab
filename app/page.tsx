import Link from 'next/link'
import { SearchForm } from '@/components/client/SearchForm'
import { HomeAnnouncementsCarousel } from '@/components/advertisements/HomeAnnouncementsCarousel'
import { BaggageCalculator } from '@/components/client/BaggageCalculator'
import { Navigation } from '@/components/layout/Navigation'
import { PublicSiteFooter } from '@/components/layout/PublicSiteFooter'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-[#003580] to-[#0b4ea2]">
          <div className="ar-page py-10 md:py-12">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">Aigle Royale</p>
              <h1 className="mt-3 text-[34px] leading-[1.12] font-extrabold tracking-tight text-white md:text-5xl">
                Trouvez et reservez votre trajet en quelques clics
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-6 text-blue-100 md:text-base">
                Comparez les disponibilites, choisissez votre horaire et confirmez rapidement votre reservation.
              </p>
            </div>

            <div id="search" className="mt-7 rounded-2xl border-4 border-[#febb02] bg-white p-4 shadow-2xl md:p-5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
                <SearchForm />
              </div>
            </div>
          </div>
        </section>

        <section className="ar-page py-10 md:py-12">
          <div className="mb-5">
            <h2 className="text-[26px] md:text-[30px] font-extrabold tracking-tight text-slate-900">Annonces et offres</h2>
            <p className="mt-2 text-[15px] text-slate-600">Decouvrez les campagnes en cours et les bons plans disponibles maintenant.</p>
          </div>
          <HomeAnnouncementsCarousel />
        </section>

        <section className="ar-page pb-10 md:pb-12">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[28px] md:text-[34px] font-extrabold tracking-tight text-slate-900">Pourquoi reserver chez nous</h2>
              <p className="mt-2 text-[15px] text-slate-600">Une experience fiable, des prix clairs et un accompagnement permanent.</p>
            </div>
            <Link href="/trips/search" className="ar-btn ar-btn-md ar-btn-primary hidden sm:inline-flex">Voir tous les trajets</Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="ar-card ar-card-body">
              <p className="ar-kicker">Tarifs transparents</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Des prix visibles avant paiement</h3>
              <p className="mt-3 text-[15px] leading-6 text-slate-600">
                Le prix final est affiche clairement avec tous les details avant validation.
              </p>
            </article>
            <article className="ar-card ar-card-body">
              <p className="ar-kicker">Reservation rapide</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Processus simple et rapide</h3>
              <p className="mt-3 text-[15px] leading-6 text-slate-600">
                Recherchez, choisissez et confirmez votre billet en quelques etapes seulement.
              </p>
            </article>
            <article className="ar-card ar-card-body">
              <p className="ar-kicker">Support 7j/7</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Accompagnement continu</h3>
              <p className="mt-3 text-[15px] leading-6 text-slate-600">
                Notre equipe vous assiste pour vos reservations, paiements et modifications.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-10 md:py-12">
          <div className="ar-page">
            <div className="mb-5">
              <h2 className="text-[26px] md:text-[30px] font-extrabold tracking-tight text-slate-900">Bagages et options</h2>
              <p className="mt-2 text-[15px] text-slate-600">
                Estimez rapidement les couts additionnels selon vos besoins.
              </p>
            </div>
            <BaggageCalculator />
          </div>
        </section>

        <section className="ar-page py-10 md:py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Reservation simple', desc: 'Interface claire et etapes guidées.' },
              { title: 'Paiement securise', desc: 'Paiement protege et confirmation rapide.' },
              { title: 'Service colis', desc: 'Suivi des envois et assistance dediee.' },
            ].map((f) => (
              <article key={f.title} className="ar-card ar-card-body">
                <h3 className="text-lg font-bold tracking-tight text-slate-900">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-slate-600">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  )
}
