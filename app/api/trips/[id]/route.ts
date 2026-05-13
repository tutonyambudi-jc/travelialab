import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Roles that may see full booking details attached to a trip */
const STAFF_ROLES = new Set(['SUPER_AGENT', 'ADMINISTRATOR', 'SUPERVISOR', 'LOGISTICS', 'ACCOUNTANT', 'AGENCY_STAFF', 'AGENT', 'PARTNER_ADMIN'])

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  const session = await getServerSession(authOptions)
  const isStaff = session && STAFF_ROLES.has(session.user.role)

  try {
    const trip = await prisma.trip.findUnique({
      where: { id: p.id },
      include: {
        bus: {
          include: {
            seats: {
              include: {
                bookings: {
                  where: {
                    status: { in: ['CONFIRMED', 'PENDING'] },
                  },
                  // Only expose booking IDs and seat occupation to unauthenticated users
                  select: isStaff
                    ? undefined
                    : { id: true, seatId: true, status: true },
                },
              },
            },
          },
        },
        route: true,
        // Full booking list is only returned to authenticated staff
        bookings: isStaff
          ? { where: { status: { in: ['CONFIRMED', 'PENDING'] } } }
          : false,
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trajet introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Trip fetch error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
