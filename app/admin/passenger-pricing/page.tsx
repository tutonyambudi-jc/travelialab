import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PassengerPricingForm } from '@/components/admin/PassengerPricingForm'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function PassengerPricingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMINISTRATOR') {
    redirect('/auth/login')
  }

  const pricingRules = await prisma.passengerPricing.findMany({
    orderBy: { passengerType: 'asc' },
  })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Pricing control"
        title="Tarification par type de passager"
        subtitle="Gere les reductions par profil voyageur avec une presentation plus directe et plus booking."
        backHref="/admin"
      />

      <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_22px_60px_-45px_rgba(15,23,42,0.4)]">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingRules.map((rule: any) => (
            <div
              key={rule.id}
              className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-6 transition hover:-translate-y-1 hover:border-[#0071c2]/35 hover:shadow-[0_18px_40px_-28px_rgba(0,113,194,0.35)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  {rule.passengerType === 'ADULT' && '👨‍💼 Adulte'}
                  {rule.passengerType === 'CHILD' && '👶 Enfant'}
                  {rule.passengerType === 'INFANT' && '🍼 Bébé'}
                  {rule.passengerType === 'SENIOR' && '👴 Senior'}
                  {rule.passengerType === 'DISABLED' && '♿ Handicapé'}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    rule.isActive
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-slate-200 bg-slate-100 text-slate-500'
                  }`}
                >
                  {rule.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-sm text-slate-500">Réduction</span>
                  <div className="text-2xl font-black text-[#0071c2]">
                    -{rule.discountPercent}%
                  </div>
                </div>

                <div>
                  <span className="text-sm text-slate-500">Tranche d'âge</span>
                  <div className="text-sm font-semibold text-slate-900">
                    {rule.minAge !== null && rule.maxAge !== null
                      ? `${rule.minAge} - ${rule.maxAge} ans`
                      : rule.minAge !== null
                      ? `${rule.minAge}+ ans`
                      : 'Tous âges'}
                  </div>
                </div>

                {rule.description && (
                  <div>
                    <span className="text-sm text-slate-500">Description</span>
                    <p className="mt-1 text-sm text-slate-700">{rule.description}</p>
                  </div>
                )}

                {rule.requiresDisabilityProof && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      📄 Justificatif requis
                    </span>
                  </div>
                )}
              </div>

              <PassengerPricingForm rule={rule} />
            </div>
          ))}

          <div className="mt-8 rounded-[24px] border border-blue-200 bg-blue-50 p-6">
            <h4 className="mb-2 text-sm font-bold text-blue-900">💡 Comment ça fonctionne ?</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Le <strong>tarif adulte</strong> est le prix de base du billet (0% de réduction)</li>
              <li>• Le <strong>tarif enfant</strong> applique automatiquement une réduction de 50% pour les 2-11 ans</li>
              <li>• Le <strong>tarif bébé</strong> applique une réduction de 80% pour les 0-1 an</li>
              <li>• Le <strong>tarif senior</strong> offre 30% de réduction pour les personnes de 60 ans et plus</li>
              <li>• Le <strong>tarif handicapé</strong> offre 40% de réduction avec justificatif obligatoire</li>
              <li>• L'âge du passager est vérifié automatiquement lors de la réservation</li>
              <li>• Les réductions sont calculées automatiquement en fonction du type de passager sélectionné</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
