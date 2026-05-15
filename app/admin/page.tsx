import { prisma } from '@/lib/prisma'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { getPaymentTimeRemaining, isPaymentUrgent } from '@/lib/booking-utils'
import { getAdminDashboardAnalytics } from '@/lib/admin-dashboard-analytics'
import { getAdminGlobalModuleOverview } from '@/lib/admin-global-overview'
import { AdminGlobalOverview } from '@/components/admin/AdminGlobalOverview'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { DatabaseSetupNotice } from '@/components/admin/DatabaseSetupNotice'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import Link from 'next/link'
import { BookingActionButtons } from '@/components/admin/BookingActionButtons'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getAdminStats() {
  const [
    totalBookings,
    totalRevenue,
    totalUsers,
    totalTrips,
    todayBookings,
    todayRevenue,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.user.count(),
    prisma.trip.count({ where: { isActive: true } }),
    prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { amount: true },
    }),
  ])

  return {
    totalBookings,
    totalRevenue: totalRevenue._sum.amount || 0,
    totalUsers,
    totalTrips,
    todayBookings,
    todayRevenue: todayRevenue._sum.amount || 0,
  }
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  let stats: Awaited<ReturnType<typeof getAdminStats>>
  let analytics: Awaited<ReturnType<typeof getAdminDashboardAnalytics>>
  let globalOverview: Awaited<ReturnType<typeof getAdminGlobalModuleOverview>>

  try {
    ;[stats, analytics, globalOverview] = await Promise.all([
      getAdminStats(),
      getAdminDashboardAnalytics(),
      getAdminGlobalModuleOverview(),
    ])
  } catch (error) {
    console.error('[admin] dashboard data:', error)
    return <DatabaseSetupNotice error={error} />
  }

  return (
    <>
      <AdminPageHeader
        title="Tableau de bord administrateur"
        subtitle={`Bienvenue, ${session?.user?.name || 'admin'}`}
      />

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="ar-card ar-card-body">
          <div className="text-sm text-gray-600 mb-1">Réservations totales</div>
          <div className="ar-stat-value">{stats.totalBookings}</div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.todayBookings} aujourd'hui
          </div>
        </div>
        <div className="ar-card ar-card-body">
          <div className="text-sm text-gray-600 mb-1">Chiffre d'affaires total</div>
          <div className="ar-stat-value text-primary-700">
            {formatCurrency(stats.totalRevenue, currency)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {formatCurrency(stats.todayRevenue, currency)} aujourd'hui
          </div>
        </div>
        <div className="ar-card ar-card-body">
          <div className="text-sm text-gray-600 mb-1">Utilisateurs</div>
          <div className="ar-stat-value">{stats.totalUsers}</div>
        </div>
        <div className="ar-card ar-card-body">
          <div className="text-sm text-gray-600 mb-1">Trajets actifs</div>
          <div className="ar-stat-value">{stats.totalTrips}</div>
        </div>
      </div>

      <AdminGlobalOverview overview={globalOverview} />

      {/* Statistiques ventes, revenus, remplissage, partenaires */}
      <div className="mb-8">
        <h2 className="ar-section-title mb-4">Indicateurs de performance</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="ar-card p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ventes (7 j.)</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{analytics.salesLast7d}</div>
            <div className="text-xs text-gray-500 mt-1">Billets confirmés</div>
          </div>
          <div className="ar-card p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ventes (30 j.)</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{analytics.salesLast30d}</div>
            <div className="text-xs text-gray-500 mt-1">Billets confirmés</div>
          </div>
          <div className="ar-card p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenus (7 j.)</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(analytics.revenueLast7d, currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Paiements encaissés</div>
          </div>
          <div className="ar-card p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenus (30 j.)</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(analytics.revenueLast30d, currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Paiements encaissés</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow border border-indigo-100 p-6">
            <div className="text-sm font-semibold text-indigo-900 mb-1">Taux de remplissage</div>
            <p className="text-xs text-indigo-700/80 mb-4">
              Trajets partis sur les 30 derniers jours : sièges vendus / capacité totale des bus.
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-indigo-900">{analytics.fillRatePercent}</span>
              <span className="text-xl font-bold text-indigo-600 mb-1">%</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.min(100, analytics.fillRatePercent)}%` }}
              />
            </div>
            <div className="mt-4 text-xs text-gray-600 space-y-1">
              <div>
                Sièges occupés : <strong>{analytics.totalOccupiedSeats}</strong> /{' '}
                <strong>{analytics.totalCapacitySeats}</strong> places
              </div>
              <div>Trajets analysés : {analytics.fillTripCount}</div>
            </div>
          </div>

          <div className="lg:col-span-2 ar-card ar-card-body">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Performance partenaires (compagnies)</h3>
                <p className="text-xs text-gray-500">
                  Top compagnies sur 30 j. — CA issu des billets payés (par bus affecté).
                </p>
              </div>
              <Link
                href="/companies/ranking"
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                Classement public →
              </Link>
            </div>
            {analytics.partners.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">Aucune donnée compagnie sur cette période.</p>
            ) : (
              <div className="ar-table-wrap">
                <table className="ar-table">
                  <thead>
                    <tr>
                      <th>Compagnie</th>
                      <th>Billets payés</th>
                      <th>Chiffre d’affaires (30 j.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.partners.map((p, i) => (
                      <tr key={p.companyId || `row-${i}`}>
                        <td className="font-medium text-gray-900">{p.name}</td>
                        <td>{p.bookingsCount}</td>
                        <td className="font-semibold text-emerald-700">
                          {formatCurrency(p.revenue, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="ar-card ar-card-body">
          <h2 className="ar-section-title mb-4">Reservations recentes</h2>
          <div className="space-y-3">
            {await prisma.booking.findMany({
              where: {
                trip: {
                  departureTime: {
                    gte: new Date() // Only show bookings for future trips
                  }
                }
              },
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                trip: {
                  include: { route: true },
                },
                user: true,
                payment: true, // Include payment info
              },
            }).then(bookings => bookings.map(booking => {
              const needsAttention = booking.payment?.status === 'PENDING' &&
                booking.payment?.method !== 'CASH';

              return (
                <div key={booking.id} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {booking.trip.route.origin} → {booking.trip.route.destination}
                      </div>
                      <div className="text-sm text-slate-600">
                        {booking.passengerName} • {formatCurrency(booking.trip.price, currency)}
                      </div>
                      {/* Countdown for unpaid bookings */}
                      {needsAttention && booking.payment?.status === 'PENDING' && (() => {
                        const timeRemaining = getPaymentTimeRemaining({
                          id: booking.id,
                          createdAt: booking.createdAt,
                          status: booking.status,
                          trip: booking.trip,
                          payment: booking.payment
                        })
                        const isUrgent = isPaymentUrgent({
                          id: booking.id,
                          createdAt: booking.createdAt,
                          status: booking.status,
                          trip: booking.trip,
                          payment: booking.payment
                        })

                        return (
                          <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${timeRemaining.isExpired ? 'text-red-600' :
                            isUrgent ? 'text-orange-600' :
                              'text-amber-600'
                            }`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeRemaining.isExpired ? 'Expiré' : timeRemaining.formatted}
                          </div>
                        )
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminStatusBadge status={booking.status} />
                      <BookingActionButtons bookingId={booking.id} status={booking.status} />
                    </div>
                  </div>
                </div>
              )
            }))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/admin/bookings" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Voir toutes les reservations →
            </Link>
          </div>
        </div>

        <div className="ar-card ar-card-body">
          <h2 className="ar-section-title mb-4">Rapports rapides</h2>
          <div className="space-y-3">
            <Link href="/admin/bookings" className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">Rapport des reservations</div>
              <div className="text-sm text-slate-600">Voir toutes les reservations</div>
            </Link>
            <Link href="/admin/reports/revenue" className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">Rapport financier</div>
              <div className="text-sm text-slate-600">Chiffre d'affaires et paiements</div>
            </Link>
            <Link href="/admin/reports/agents" className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">Performance des agents</div>
              <div className="text-sm text-slate-600">Ventes et commissions</div>
            </Link>
            <Link href="/admin/city-stops" className="block rounded-lg border border-slate-200 bg-blue-50 p-3 hover:bg-blue-100/70">
              <div className="font-semibold text-slate-900">Arrets de ville</div>
              <div className="text-sm text-slate-600">Gerer les gares et arrets</div>
            </Link>
            <Link href="/admin/notifications" className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">Module notifications</div>
              <div className="text-sm text-slate-600">Envoyer SMS, WhatsApp, Email et in-app</div>
            </Link>
            <Link href="/admin/notifications/dashboard" className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">Dashboard notifications</div>
              <div className="text-sm text-slate-600">Suivi des envois et statistiques</div>
            </Link>
            <Link href="/admin/support" className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="font-semibold text-slate-900">Support client</div>
              <div className="text-sm text-slate-600">Plaintes, reclamations et parametres WhatsApp</div>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
