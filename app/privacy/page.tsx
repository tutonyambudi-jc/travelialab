import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const entries = [
  {
    title: 'Donnees collectees',
    body: 'Nous collectons les donnees necessaires a la reservation: identite, contact, informations de trajet et historique transactionnel.',
  },
  {
    title: 'Finalites',
    body: 'Les donnees sont utilisees pour traiter vos commandes, prevenir la fraude, ameliorer l experience et assurer le support client.',
  },
  {
    title: 'Conservation',
    body: 'Les informations sont conservees pour la duree necessaire aux obligations legales, comptables et operationnelles.',
  },
  {
    title: 'Partage',
    body: 'Aucune cession commerciale des donnees personnelles. Le partage est limite aux partenaires techniques et transporteurs autorises.',
  },
  {
    title: 'Vos droits',
    body: 'Vous pouvez demander acces, rectification, suppression et limitation du traitement via le support officiel.',
  },
]

export default function PrivacyPage() {
  return (
    <PublicInfoLayout
      badge="Confidentialite"
      title="Politique de confidentialite"
      description="Transparence sur les donnees traitees et vos droits en tant qu utilisateur."
    >
      {entries.map((entry) => (
        <article key={entry.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">{entry.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{entry.body}</p>
        </article>
      ))}
    </PublicInfoLayout>
  )
}
