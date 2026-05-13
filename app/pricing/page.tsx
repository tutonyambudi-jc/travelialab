import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const blocks = [
  {
    title: 'Tarif standard',
    price: 'A partir de 5 000 FC',
    details: 'Acces au reseau principal, siege standard, bagage cabine inclus selon la ligne.',
  },
  {
    title: 'Tarif premium',
    price: 'Variable selon trajet',
    details: 'Confort renforce, services complementaires et disponibilite prioritaire sur certaines lignes.',
  },
  {
    title: 'Services additionnels',
    price: 'Selon options',
    details: 'Bagages supplementaires, services a bord et options de flexibilite selon disponibilite.',
  },
]

export default function PricingPage() {
  return (
    <PublicInfoLayout
      badge="Tarification"
      title="Tarification transparente"
      description="Des prix lisibles, sans surprise, avec details des options avant validation."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {blocks.map((block) => (
          <article key={block.title} className="ar-card ar-card-body">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{block.title}</h2>
            <p className="mt-3 text-[28px] leading-none font-extrabold text-primary-700">{block.price}</p>
            <p className="mt-3 text-[15px] leading-7 text-slate-700 sm:text-base">{block.details}</p>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-primary-100 bg-primary-50 p-5 sm:p-6">
        <h2 className="text-xl font-bold tracking-tight text-primary-900">Bon a savoir</h2>
        <p className="mt-3 text-[15px] leading-7 text-primary-800 sm:text-base">
          Le montant final est affiche avant paiement avec le detail des frais eventuels et des remises appliquees.
        </p>
      </article>
    </PublicInfoLayout>
  )
}
