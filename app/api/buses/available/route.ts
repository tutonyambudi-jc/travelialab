import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeSearchText } from '@/lib/search'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')

    if (!date) {
      return NextResponse.json({ error: 'Le paramètre date est requis' }, { status: 400 })
    }

    const searchDate = new Date(date)
    const startOfDay = new Date(searchDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(searchDate)
    endOfDay.setHours(23, 59, 59, 999)

    const trips = await prisma.trip.findMany({
      where: {
        isActive: true,
        departureTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        route: {
          isActive: true,
        },
      },
      include: {
        bus: true,
        route: true,
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          select: { id: true },
        },
      },
      orderBy: {
        departureTime: 'asc',
      },
    })

    const normalizedOrigin = origin ? normalizeSearchText(origin) : null
    const normalizedDestination = destination ? normalizeSearchText(destination) : null

    const filtered = trips
      .filter((trip) => {
        const routeOrigin = normalizeSearchText(trip.route.origin)
        const routeDestination = normalizeSearchText(trip.route.destination)

        const originMatch = normalizedOrigin ? routeOrigin.includes(normalizedOrigin) : true
        const destinationMatch = normalizedDestination ? routeDestination.includes(normalizedDestination) : true

        return originMatch && destinationMatch
      })
      .map((trip) => {
        const availableSeats = Math.max(0, trip.bus.capacity - trip.bookings.length)
        return {
          tripId: trip.id,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          price: trip.price,
          route: {
            id: trip.route.id,
            origin: trip.route.origin,
            destination: trip.route.destination,
          },
          bus: {
            id: trip.bus.id,
            name: trip.bus.name,
            plateNumber: trip.bus.plateNumber,
            capacity: trip.bus.capacity,
            seatType: trip.bus.seatType,
            imageUrl: trip.bus.imageUrl,
          },
          occupancy: {
            bookedSeats: trip.bookings.length,
            availableSeats,
            isAvailable: availableSeats > 0,
          },
        }
      })
      .filter((row) => row.occupancy.isAvailable)

    return NextResponse.json({
      date,
      total: filtered.length,
      data: filtered,
    })
  } catch (error) {
    console.error('Buses available list error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}