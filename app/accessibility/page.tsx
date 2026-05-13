import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const commitments = [
  'Navigation clavier sur les parcours principaux.',
  'Contrastes renforces pour les elements critiques.',
  'Zones tactiles adaptees au mobile.',
  'Titres et structures semantiques coherents.',
]

export default function AccessibilityPage() {
  return (
    <PublicInfoLayout
      badge="Accessibilite"
      title="Declaration d accessibilite"
      description="Aigle Royale s engage a rendre ses services numeriques accessibles au plus grand nombre."
    >
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Nos engagements</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {commitments.map((commitment) => (
            <li key={commitment} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {commitment}
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Signaler une difficulte</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
          Si vous rencontrez un blocage, contactez-nous via le centre d aide pour une resolution prioritaire.
        </p>
      </article>
    </PublicInfoLayout>
  )
}
