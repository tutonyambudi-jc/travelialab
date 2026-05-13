import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const cookieTypes = [
  {
    title: 'Cookies essentiels',
    body: 'Necessaires au fonctionnement du site, authentification et securite des sessions.',
  },
  {
    title: 'Cookies de performance',
    body: 'Utilises pour comprendre les parcours utilisateurs et optimiser la rapidite et l ergonomie.',
  },
  {
    title: 'Cookies de personnalisation',
    body: 'Permettent de retenir certaines preferences telles que la devise ou les filtres de recherche.',
  },
]

export default function CookiePolicyPage() {
  return (
    <PublicInfoLayout
      badge="Cookies"
      title="Politique des cookies"
      description="Explication des cookies utilises et des choix disponibles pour les utilisateurs."
    >
      {cookieTypes.map((cookieType) => (
        <article key={cookieType.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">{cookieType.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{cookieType.body}</p>
        </article>
      ))}
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Gestion de vos preferences</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
          Vous pouvez modifier vos choix depuis vos parametres et via les reglages de votre navigateur.
        </p>
      </article>
    </PublicInfoLayout>
  )
}
