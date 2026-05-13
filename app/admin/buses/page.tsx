import { prisma } from '@/lib/prisma'
import { BusRegistrationForm } from '@/components/admin/BusRegistrationForm'
import { BusSeatConfigurator } from '@/components/admin/BusSeatConfigurator'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export default async function AdminBusesPage() {
  const buses = await prisma.bus.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      company: true,
      seats: {
        select: {
          id: true,
          seatNumber: true,
          isAvailable: true,
        },
        orderBy: { seatNumber: 'asc' },
      },
      _count: { select: { seats: true, trips: true } },
    },
  })

  return (
    <>
      <AdminPageHeader
        kicker="Flotte & capacite"
        title="Gerer les bus"
        subtitle="Enregistre les compagnies, ajoute les bus et configure la flotte avec une mise en page inspiree booking."
        backHref="/admin"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BusRegistrationForm />
        </div>

        <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Liste des bus</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">{buses.length} bus</span>
          </div>

          {buses.length === 0 ? (
            <p className="text-slate-600">Aucun bus pour le moment.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm bg-white">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Image</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Compagnie</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Bus</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Marque</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Immat.</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Sièges</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Amenities</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 group">
                      <td className="px-4 py-3">
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.name} className="w-12 h-8 object-cover rounded border border-slate-200" />
                        ) : (
                          <div className="flex h-8 w-12 items-center justify-center rounded border border-slate-200 bg-slate-100 text-[10px] text-slate-400">
                            IMG
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{b.company?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-900">{b.name}</td>
                      <td className="px-4 py-3 text-slate-700">{b.brand ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{b.plateNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {b.capacity} <span className="text-xs text-slate-400">({b._count.seats} créés)</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{b.amenities ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/admin/buses/${b.id}`} className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                            Modifier
                          </Link>
                          {b._count.seats > 0 && (
                            <>
                              <span className="text-gray-300">|</span>
                              <Link href={`/admin/buses/${b.id}/seats`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                Sièges
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-500">
            Remarque: la numérotation fine des sièges (avec exclusion du siège chauffeur) se fait via l’outil
            ci-dessous.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <BusSeatConfigurator buses={buses} />
      </div>
    </>
  )
}
