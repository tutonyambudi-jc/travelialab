import Link from 'next/link'
import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const faq = [
  {
    q: 'Comment reserver un trajet ?',
    a: 'Utilisez la recherche, choisissez votre horaire, completez les passagers puis finalisez le paiement.',
  },
  {
    q: 'Comment recuperer mon billet ?',
    a: 'Apres paiement valide, votre confirmation est accessible dans vos reservations et dans vos recus.',
  },
  {
    q: 'Comment demander une annulation ?',
    a: 'Accedez a la reservation concernee et suivez le flux d annulation. Les conditions de remboursement s appliquent.',
  },
  {
    q: 'Le support est-il disponible 7j/7 ?',
    a: 'Oui, notre support traite les demandes tous les jours sur les horaires indiques sur la page contact.',
  },
]

export default function HelpPage() {
  return (
    <PublicInfoLayout
      badge="Support"
      title="Centre d aide"
      description="Retrouvez rapidement des reponses claires pour reserver, payer, annuler et suivre vos voyages."
    >
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Actions rapides</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/trips/search" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
            Rechercher un trajet
          </Link>
          <Link href="/support" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
            Ouvrir un ticket support
          </Link>
          <Link href="/refund-policy" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
            Regles de remboursement
          </Link>
          <Link href="/contact" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
            Nous contacter
          </Link>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Questions frequentes</h2>
        <div className="mt-4 grid gap-4">
          {faq.map((item) => (
            <div key={item.q} className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{item.q}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">{item.a}</p>
            </div>
          ))}
        </div>
      </article>
    </PublicInfoLayout>
  )
}
