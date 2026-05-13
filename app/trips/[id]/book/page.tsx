import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { BookingForm } from '@/components/client/BookingForm'
import { DashboardBackButton } from '@/components/layout/DashboardBackButton'
import { cookies } from 'next/headers'
import type { DisplayCurrency } from '@/lib/utils'

async function getTrip(id: string) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      bus: {
        include: {
          seats: {
            where: {
              isHidden: false, // Exclure les sièges cachés
            },
            include: {
              bookings: {
                where: {
                  status: { in: ['CONFIRMED', 'PENDING'] },
                },
              },
            },
          },
        },
      },
      route: {
        include: {
          stops: {
            orderBy: { order: 'asc' },
            include: {
              stop: {
                include: {
                  city: true
                }
              }
            }
          }
        }
      },
      bookings: {
        where: {
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
        include: {
          seat: true,
        },
      },
    },
  })

  return trip
}

export default async function BookTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    adults?: string
    children?: string
    babies?: string
    seniors?: string
  }>
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await getServerSession(authOptions)

  // Build the full callback URL with passenger params
  const passengerParams = new URLSearchParams({
    adults: sp.adults || '1',
    children: sp.children || '0',
    babies: sp.babies || '0',
    seniors: sp.seniors || '0'
  }).toString()

  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/trips/${id}/book?${passengerParams}`)}`)
  }

  // Get passenger counts from search params
  const passengerCounts = {
    adults: parseInt(sp.adults || '1'),
    children: parseInt(sp.children || '0'),
    babies: parseInt(sp.babies || '0'),
    seniors: parseInt(sp.seniors || '0')
  }
  
  console.log('BookTripPage searchParams:', sp)
  console.log('BookTripPage passengerCounts:', passengerCounts)

  // On récupère la devise
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  let user = null
  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    })
  }

  const trip = await getTrip(id)

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trajet introuvable</h1>
          <p className="text-gray-600">Le trajet demandé n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    )
  }

  // Déterminer les sièges occupés
  const occupiedSeatIds = trip.bookings.map((booking) => booking.seatId)
  const availableSeats = trip.bus.seats.filter(
    (seat) => !occupiedSeatIds.includes(seat.id) && seat.isAvailable
  )
  const totalPassengers =
    passengerCounts.adults +
    passengerCounts.children +
    passengerCounts.babies +
    passengerCounts.seniors

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_42%,#eef2ff_100%)]">

      <div className="container mx-auto px-4 py-6">
        <DashboardBackButton />
      </div>

      {/* tips content new design */}

      <div className="py-8">
        <div className="container mx-auto px-4 relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_1px_1px,rgba(30,41,59,0.08)_1px,transparent_0)] [background-size:22px_22px]"
          />

          <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold mb-2">
            Module Booking
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-2">
            Réserver votre billet
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mb-8 max-w-2xl">
            Vérifiez les informations du trajet, choisissez les sièges et complétez les profils passagers avant le paiement.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-6 lg:gap-8 items-start">
            <aside className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:sticky lg:top-6">
              <h2 className="text-lg font-bold tracking-tight text-gray-900 mb-4">Informations du trajet</h2>

              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 font-semibold">Itineraire</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 tracking-tight">
                    {trip.route.origin} → {trip.route.destination}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 font-semibold">Depart</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 tracking-tight">
                    {new Date(trip.departureTime).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 font-semibold">Sieges libres</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 tracking-tight">{availableSeats.length}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 font-semibold">Passagers</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 tracking-tight">{totalPassengers}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">Avant de continuer</p>
                  <ul className="mt-2 text-sm text-amber-900 space-y-1">
                    <li>- Selectionnez exactement un siege par passager.</li>
                    <li>- Verifiez les informations de chaque passager avant paiement.</li>
                  </ul>
                </div>
              </div>
            </aside>

            <div>
              {/* component use */}
              <BookingForm
                trip={trip}
                availableSeats={availableSeats}
                displayCurrency={currency}
                user={user}
                passengerCounts={passengerCounts}
              />
            </div>
          </div>
        </div>
      </div>
      {/* tips content new design */}
    </div>
  )
}
