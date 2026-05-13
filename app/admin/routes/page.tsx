import { prisma } from '@/lib/prisma'
import { RoutesTripsManager } from '@/components/admin/RoutesTripsManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export default async function AdminRoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const requestedLimit = Number(sp.limit) || 20
  const limit = Math.min(100, Math.max(10, requestedLimit))
  const skip = (page - 1) * limit

  const [cities, routes, buses, trips, totalTrips] = await Promise.all([
    prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        stops: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            cityId: true,
            name: true,
            type: true,
            address: true,
            city: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.route.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        origin: true,
        destination: true,
        originCityId: true,
        destinationCityId: true,
        distance: true,
        duration: true,
        stops: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            routeId: true,
            stopId: true,
            order: true,
            role: true,
            stop: {
              select: {
                id: true,
                cityId: true,
                name: true,
                type: true,
                address: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.bus.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        plateNumber: true,
        capacity: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.trip.findMany({
      where: { isActive: true },
      orderBy: { departureTime: 'desc' },
      select: {
        id: true,
        departureTime: true,
        arrivalTime: true,
        price: true,
        promoActive: true,
        promoMode: true,
        promoPrice: true,
        promoDays: true,
        boardingMinutesBefore: true,
        promotionPercentage: true,
        bus: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            capacity: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        route: {
          select: {
            id: true,
            origin: true,
            destination: true,
          },
        },
        stopovers: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            dwellMinutes: true,
            arrivalTime: true,
            departureTime: true,
            stop: {
              select: {
                id: true,
                cityId: true,
                name: true,
                type: true,
                address: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      take: limit,
      skip: skip,
    }),
    prisma.trip.count({ where: { isActive: true } }),
  ])

  return (
    <>
      <AdminPageHeader
        kicker="Exploitation reseau"
        title="Gerer les trajets"
        subtitle="Villes, arrets d'embarquement et de debarquement, horaires, bus et escales dans une interface admin inspiree booking."
        backHref="/admin"
      />

      <RoutesTripsManager
        initialCities={cities as any}
        initialRoutes={routes as any}
        initialBuses={buses as any}
        initialTrips={trips as any}
        totalTrips={totalTrips}
        currentPage={page}
        currentLimit={limit}
      />
    </>
  )
}
