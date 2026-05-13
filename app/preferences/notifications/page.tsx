import { PublicInfoLayout } from '@/components/layout/PublicInfoLayout'

const preferenceItems = [
  {
    title: 'Alertes de reservation',
    description: 'Recevoir les confirmations, rappels de depart et changements de statut.',
  },
  {
    title: 'Promotions et nouveautes',
    description: 'Recevoir les offres exclusives, campagnes saisonnieres et codes promotionnels.',
  },
  {
    title: 'Mises a jour de service',
    description: 'Recevoir les notifications de maintenance, indisponibilites et informations importantes.',
  },
]

export default function NotificationPreferencesPage() {
  return (
    <PublicInfoLayout
      badge="Preferences"
      title="Preferences de notifications"
      description="Choisissez les communications que vous souhaitez recevoir par email ou via l application."
    >
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Categories disponibles</h2>
        <div className="mt-4 grid gap-4">
          {preferenceItems.map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">{item.description}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-primary-100 bg-primary-50 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-primary-900">Prochaine etape</h2>
        <p className="mt-3 text-sm leading-7 text-primary-800 sm:text-base">
          Cette page constitue la base fonctionnelle. L integration des bascules actives sera connectee au profil utilisateur dans le prochain lot.
        </p>
      </article>
    </PublicInfoLayout>
  )
}
