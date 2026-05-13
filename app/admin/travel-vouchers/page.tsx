import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'

export const dynamic = 'force-dynamic'

export default async function AdminTravelVouchersPage() {
  const vouchers = await prisma.travelVoucher.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      route: { select: { id: true, origin: true, destination: true } },
      trip: { select: { id: true, departureTime: true } },
      booking: { select: { ticketNumber: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  })

  return (
    <>
      <AdminPageHeader
        title="Bons de voyage"
        subtitle="Suivi des bons emis, utilises et expires"
        backHref="/admin"
        backLabel="Retour admin"
        actions={
          <Link href="/admin/travel-vouchers/create" className="ar-btn ar-btn-md ar-btn-primary">
            + Creer un bon
          </Link>
        }
      />

      <div className="ar-card ar-card-body">
        <div className="ar-table-wrap">
        <table className="ar-table w-full text-left">
          <thead>
            <tr>
              <th>Code</th>
              <th>Beneficiaire</th>
              <th>Montant</th>
              <th>Itineraire</th>
              <th>Statut</th>
              <th>Cree le</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Aucun bon de voyage pour le moment.
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <div className="inline-block rounded border border-primary-100 bg-primary-50 px-2 py-1 font-mono text-sm text-primary-700">
                      {voucher.code}
                    </div>
                    {voucher.booking?.ticketNumber ? (
                      <div className="mt-1 text-xs text-slate-500">Billet: {voucher.booking.ticketNumber}</div>
                    ) : null}
                  </td>
                  <td>
                    <div className="font-medium text-slate-900">{voucher.beneficiaryName}</div>
                    {voucher.beneficiaryPhone ? (
                      <div className="text-sm text-slate-600">{voucher.beneficiaryPhone}</div>
                    ) : null}
                  </td>
                  <td className="font-semibold text-slate-900">
                    {formatCurrency(voucher.valueAmount, 'FC')}
                  </td>
                  <td className="text-sm text-slate-600">
                    {voucher.route ? (
                      <>
                        <div>
                          {voucher.route.origin} - {voucher.route.destination}
                        </div>
                        {voucher.trip?.departureTime ? (
                          <div className="text-xs text-slate-500">
                            Depart: {format(voucher.trip.departureTime, 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-slate-400">Non limite a une ligne</span>
                    )}
                  </td>
                  <td>
                    <AdminStatusBadge status={voucher.status} />
                  </td>
                  <td className="text-sm text-slate-600">
                    <div>{format(voucher.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
                    {voucher.createdBy ? (
                      <div className="text-xs text-slate-500">
                        Par {voucher.createdBy.firstName} {voucher.createdBy.lastName}
                      </div>
                    ) : null}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/travel-vouchers/create?${new URLSearchParams({
                        title: voucher.title || '',
                        beneficiaryName: voucher.beneficiaryName || '',
                        beneficiaryPhone: voucher.beneficiaryPhone || '',
                        beneficiaryEmail: voucher.beneficiaryEmail || '',
                        valueAmount: String(voucher.valueAmount),
                        passengerCount: String(voucher.passengerCount || 1),
                        validUntil: voucher.validUntil ? voucher.validUntil.toISOString().slice(0, 10) : '',
                        routeId: voucher.route?.id || '',
                        tripId: voucher.trip?.id || '',
                        notes: voucher.notes || '',
                      }).toString()}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      Dupliquer
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  )
}
