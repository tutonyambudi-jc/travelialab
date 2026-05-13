import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { getPaymentTimeRemaining } from '@/lib/booking-utils'
import { CancelBookingButton } from '@/components/reservations/CancelBookingButton'
import { PrintInvoiceButton } from '@/components/reservations/PrintInvoiceButton'
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Bus,
  ChevronRight,
  Search,
  ArrowRight,
  Inbox,
  CreditCard,
  Ticket,
  AlertTriangle,
  Info
} from 'lucide-react'

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  // Réservations voyageurs
  if (session.user.role !== 'CLIENT') {
    redirect('/dashboard')
  }

  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  const status = (sp?.status || 'ALL').toUpperCase() as StatusFilter
  const where: any = { userId: session.user.id }
  if (status !== 'ALL') where.status = status

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      trip: { include: { route: true, bus: true } },
      seat: true,
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const tab = (label: string, value: StatusFilter, icon: any) => {
    const Icon = icon
    return (
      <Link
        key={value}
        href={value === 'ALL' ? '/reservations' : `/reservations?status=${value}`}
        className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-[14px] font-semibold transition-colors ${status === value
          ? 'border-[#0071c2] bg-[#0071c2] text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
          }`}
      >
        <Icon size={16} />
        {label}
      </Link>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 lg:space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-2">
            <h1 className="text-[30px] leading-[1.15] md:text-[34px] font-extrabold text-slate-900 tracking-tight">
              Mes <span className="text-primary-600">Voyages</span>
            </h1>
            <p className="text-slate-600 text-[15px] md:text-base flex items-center gap-2">
              Consultez, payez ou gérez vos réservations Aigle Royale.
            </p>
          </div>

          <Link
            href="/#search"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0071c2] px-6 text-[15px] font-bold text-white hover:bg-[#005da0] transition-colors shadow-sm"
          >
            <Search size={20} />
            Nouvelle réservation
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2.5 pb-1 overflow-x-auto no-scrollbar">
          {tab('Tous', 'ALL', Inbox)}
          {tab('En attente', 'PENDING', Clock)}
          {tab('Confirmés', 'CONFIRMED', Ticket)}
          {tab('Annulés', 'CANCELLED', ArrowRight)}
        </div>

        {/* Payment Policy Reminder */}
        {bookings.some(b => b.status === 'PENDING') && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <Info className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 leading-none mb-2 text-[15px]">Règles de paiement en ligne</h3>
              <p className="text-[14px] text-amber-800 leading-relaxed">
                • Pour les voyages dans <span className="font-bold">plus de 5 jours</span>, vous avez <span className="font-bold">24 heures</span> pour régler votre billet.<br />
                • Pour les voyages dans <span className="font-bold">moins de 48 heures</span>, le paiement doit être effectué dans les <span className="font-bold">2 heures</span> suivant la réservation.<br />
                Au-delà de ces délais, votre réservation sera <span className="font-bold">automatiquement annulée</span> pour libérer le siège.
              </p>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 md:p-14 text-center shadow-sm border border-slate-200 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Inbox className="text-gray-300" size={48} />
            </div>
            <h3 className="text-[28px] leading-tight font-extrabold text-slate-900 mb-2">Aucun voyage pour le moment</h3>
            <p className="text-slate-600 text-[15px] mb-8 max-w-sm">Explorez nos destinations et profitez d'un voyage premium avec Aigle Royale.</p>
            <Link href="/#search" className="inline-flex h-11 items-center px-6 bg-[#0071c2] text-white text-[15px] font-bold rounded-lg hover:bg-[#005da0] transition-colors shadow-sm">
              Explorer les trajets
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-1 gap-4">
            {bookings.map((b) => {
              const timeRemaining = getPaymentTimeRemaining(b as any)

              const badge =
                b.status === 'CONFIRMED'
                  ? 'bg-green-50 text-green-700'
                  : b.status === 'PENDING'
                    ? timeRemaining.isExpired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700 font-pulse'
                    : b.status === 'CANCELLED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-50 text-gray-600'

              const statusLabel =
                b.status === 'CONFIRMED'
                  ? 'Voyage confirmé'
                  : b.status === 'PENDING'
                    ? timeRemaining.isExpired ? 'Réservation expirée' : 'Paiement en attente'
                    : b.status === 'CANCELLED'
                      ? 'Réservation annulée'
                      : b.status

              const canPay = b.status === 'PENDING' && !timeRemaining.isExpired
              const canCancel = b.status === 'PENDING' && (!b.payment || b.payment.status !== 'PAID')

              return (
                <div key={b.id} className="group bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300 relative overflow-hidden flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Status Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${b.status === 'CONFIRMED' ? 'bg-green-500' :
                    b.status === 'PENDING' ? (timeRemaining.isExpired ? 'bg-red-500' : 'bg-amber-400') :
                      b.status === 'CANCELLED' ? 'bg-red-400' : 'bg-gray-400'
                    }`} />

                  {/* Route & Times */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="text-[22px] leading-none font-extrabold text-slate-900">{b.trip.route.origin}</span>
                        <ArrowRight size={18} className="text-gray-300" />
                        <span className="text-[22px] leading-none font-extrabold text-slate-900">{b.trip.route.destination}</span>
                      </div>
                      <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${badge}`}>
                        {statusLabel}
                      </span>

                      {b.status === 'PENDING' && !timeRemaining.isExpired && (
                        <span className="text-[12px] font-bold text-amber-700 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                          <Clock size={14} />
                          Expire dans : {timeRemaining.formatted}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={18} className="text-primary-500" />
                        <span className="text-[14px] font-semibold">{format(new Date(b.trip.departureTime), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={18} className="text-primary-500" />
                        <span className="text-[14px] font-semibold">{format(new Date(b.trip.departureTime), 'HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Bus size={18} className="text-primary-500" />
                        <span className="text-[14px] font-semibold">Siège {b.seat.seatNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <CreditCard size={18} className="text-primary-500" />
                        <span className="text-[15px] font-extrabold text-slate-900">{formatCurrency(b.totalPrice || b.trip.price, currency)}</span>
                      </div>
                    </div>

                    {/* Cancellation Reason or Expiration Note */}
                    {(b.status === 'CANCELLED' || (b.status === 'PENDING' && timeRemaining.isExpired)) && (
                      <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                        <p className="text-[13px] font-semibold text-red-900 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-600" />
                          {b.status === 'CANCELLED'
                            ? (b as any).cancellationReason || "Votre réservation a été annulée."
                            : "Délai de paiement expiré. Cette réservation n'est plus valide."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 min-w-max">
                    {b.status === 'CONFIRMED' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <PrintInvoiceButton bookingId={b.id} />
                          <Link
                            href={`/bookings/${b.id}/confirmation`}
                            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0071c2] px-5 text-[14px] font-bold text-white hover:bg-[#005da0] transition-colors"
                          >
                            <Ticket size={18} />
                            Voir billet
                          </Link>
                        </div>
                      </>
                    ) : canPay ? (
                      <Link
                        href={`/bookings/${b.id}/payment`}
                        className="inline-flex h-11 items-center rounded-lg bg-[#0071c2] px-5 text-[14px] font-bold text-white hover:bg-[#005da0] transition-colors"
                      >
                        Payer maintenant
                      </Link>
                    ) : b.status === 'CANCELLED' || timeRemaining.isExpired ? (
                      <Link
                        href="/#search"
                        className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-[14px] font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        Réserver à nouveau
                      </Link>
                    ) : null}

                    {canCancel && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CancelBookingButton bookingId={b.id} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}

