import { prisma } from '@/lib/prisma'
import { BookingActionButtons } from '@/components/admin/BookingActionButtons'
import { PaginationControls } from '@/components/admin/PaginationControls'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { cookies } from 'next/headers'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
    const sp = await searchParams
    const cookieStore = await cookies()
    const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

    const page = Number(sp.page) || 1
    const limit = Number(sp.limit) || 20
    const skip = (page - 1) * limit

    const [bookings, totalBookings] = await Promise.all([
        prisma.booking.findMany({
            where: {
                trip: {
                    departureTime: {
                        gte: new Date() // Only show bookings for future trips
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: true,
                trip: {
                    include: {
                        route: true,
                    },
                },
                travelVoucher: {
                    select: {
                        code: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.booking.count({
            where: {
                trip: {
                    departureTime: {
                        gte: new Date() // Count only future trips
                    }
                }
            }
        })
    ])

    console.log('Bookings:', bookings);
    console.log('Total Bookings:', totalBookings);

    const promotionPercentage = 0; // Temporairement fixe car composant serveur

    const applyPromotion = (price: number, percentage: number) => {
        return price - (price * percentage) / 100;
    };

    return (
        <>
            <AdminPageHeader
                title="Gerer les reservations"
                subtitle="Validation et suivi des ventes de billets."
                backHref="/admin"
                backLabel="Retour admin"
            />

            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {/* La gestion des promotions interactives doit être déplacée dans un composant client dédié */}
                Note: Les promotions sont actuellement désactivées sur cette vue serveur.
            </div>

            <div className="ar-card ar-card-body relative overflow-hidden">
                <div className="relative mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
                    <div>
                        <h2 className="ar-section-title">Dernieres reservations</h2>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Listing complet des transactions</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700">
                        <span className="h-2 w-2 rounded-full bg-primary-600"></span>
                        {totalBookings} Total
                    </div>
                </div>

                {bookings.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Aucune reservation</h3>
                        <p className="text-slate-600">Les nouvelles reservations apparaitront ici.</p>
                    </div>
                ) : (
                    <>
                        <div className="ar-table-wrap">
                            <table className="ar-table min-w-full">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Client / Passager</th>
                                        <th>Trajet</th>
                                        <th>Depart</th>
                                        <th>Prix vente</th>
                                        <th>Bon de voyage</th>
                                        <th className="text-center">Statut</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className="group transition-colors hover:bg-primary-50/20">
                                            <td className="font-mono text-xs font-bold text-slate-500">
                                                #{booking.ticketNumber || booking.id.slice(0, 8)}
                                            </td>
                                            <td>
                                                <div className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{booking.passengerName}</div>
                                                <div className="mt-0.5 text-xs font-medium text-slate-500">{booking.passengerPhone}</div>
                                            </td>
                                            <td>
                                                <div className="text-sm font-semibold text-slate-700">
                                                    {booking.trip.route.origin} <span className="mx-1 opacity-30 not-italic tracking-normal">→</span> {booking.trip.route.destination}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                                                    {new Date(booking.trip.departureTime).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                    })}
                                                </div>
                                                <div className="text-[10px] font-semibold text-slate-500">
                                                    {new Date(booking.trip.departureTime).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </td>
                                            <td>
                                                {(() => {
                                                    const basePrice = Number(booking.basePrice || booking.trip.price)
                                                    const discountAmount = Number(booking.discountAmount || 0)
                                                    const extrasTotal = Number(booking.extrasTotal || 0)
                                                    const subtotal = Math.max(0, basePrice - discountAmount + extrasTotal)
                                                    const total = applyPromotion(booking.totalPrice || booking.trip.price, promotionPercentage)
                                                    const serviceFee = Math.max(0, total - subtotal)
                                                    return (
                                                        <div>
                                                            <div className="text-lg font-bold text-slate-900">{formatCurrency(total, currency)}</div>
                                                            <div className="mt-1 text-[10px] text-slate-500">
                                                                Sous-total: <span className="font-semibold">{formatCurrency(subtotal, currency)}</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-500">
                                                                Frais: <span className="font-semibold">{formatCurrency(serviceFee, currency)}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })()}
                                            </td>
                                            <td>
                                                {booking.travelVoucher ? (
                                                    <div>
                                                        <div className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700">
                                                            {booking.travelVoucher.code}
                                                        </div>
                                                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                                                            {booking.travelVoucher.status}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex justify-center">
                                                    <AdminStatusBadge
                                                        status={booking.status}
                                                        label={
                                                            booking.status === 'CONFIRMED'
                                                                ? 'Valide'
                                                                : booking.status === 'PENDING'
                                                                    ? 'En attente'
                                                                    : booking.status === 'CANCELLED'
                                                                        ? 'Annule'
                                                                        : booking.status
                                                        }
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <BookingActionButtons bookingId={booking.id} status={booking.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <PaginationControls
                            totalItems={totalBookings}
                            currentLimit={limit}
                            currentPage={page}
                        />
                    </>
                )}
            </div>
        </>
    )
}
