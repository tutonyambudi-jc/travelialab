import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const policy = [
  {
    title: 'Annulation standard',
    body: 'Selon le delai avant depart, des frais peuvent s appliquer. Le montant exact est affiche avant confirmation d annulation.',
  },
  {
    title: 'Retard ou suppression',
    body: 'En cas de suppression de trajet imputable au transporteur, vous pouvez demander report ou remboursement integral.',
  },
  {
    title: 'Delai de remboursement',
    body: 'Les remboursements valides sont traites sous 3 a 10 jours ouvres selon votre moyen de paiement.',
  },
  {
    title: 'Cas non remboursables',
    body: 'Billets deja utilises, no-show non justifie ou fraude confirmee ne sont pas eligibles au remboursement.',
  },
]

export default function RefundPolicyPage() {
  return (
    <PublicInfoLayout
      badge="Politique"
      title="Politique de remboursement et annulation"
      description="Regles claires pour annuler un billet et connaitre votre eligibilite au remboursement."
    >
      {policy.map((item) => (
        <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{item.body}</p>
        </article>
      ))}
    </PublicInfoLayout>
  )
}
