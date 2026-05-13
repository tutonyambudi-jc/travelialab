import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const sections = [
  {
    title: '1. Objet du service',
    body: 'Aigle Royale met a disposition une plateforme de recherche, reservation et paiement de trajets de bus et services associes.',
  },
  {
    title: '2. Compte utilisateur',
    body: 'Vous etes responsable de la confidentialite de vos identifiants et de l exactitude des informations fournies lors de la reservation.',
  },
  {
    title: '3. Paiement et confirmation',
    body: 'Une reservation est consideree comme validee apres confirmation de paiement et emission du justificatif de voyage.',
  },
  {
    title: '4. Comportement et securite',
    body: 'Tout usage frauduleux, tentative d acces non autorise ou perturbation du service peut entrainer une suspension immediate.',
  },
  {
    title: '5. Evolution des conditions',
    body: 'Ces conditions peuvent evoluer. La version en ligne fait foi et s applique des sa publication.',
  },
]

export default function TermsPage() {
  return (
    <PublicInfoLayout
      badge="Legal"
      title="Conditions d utilisation"
      description="Cadre contractuel d utilisation de la plateforme Aigle Royale."
    >
      {sections.map((section) => (
        <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{section.body}</p>
        </article>
      ))}
    </PublicInfoLayout>
  )
}
