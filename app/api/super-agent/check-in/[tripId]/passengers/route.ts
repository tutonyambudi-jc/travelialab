import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const AUTHORIZED_ROLES = new Set(['SUPER_AGENT', 'ADMINISTRATOR', 'SUPERVISOR', 'LOGISTICS'])

export async function GET(
    request: Request,
    { params }: { params: Promise<{ tripId: string }> }
) {
    // Auth guard: only privileged roles may access passenger manifests
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (!AUTHORIZED_ROLES.has(session.user.role)) {
        return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const p = await params
    try {
        const sortedBookings = await prisma.booking.findMany({
            where: {
                tripId: p.tripId,
                status: 'CONFIRMED',
            },
            include: {
                seat: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        passportOrIdNumber: true,
                        birthDate: true,
                        phone: true,
                    }
                },
            },
            orderBy: [
                { seat: { seatNumber: 'asc' } }
            ]
        })

        return NextResponse.json(sortedBookings)
    } catch (error) {
        console.error('Error fetching passengers:', error)
        return NextResponse.json({ error: 'Failed to fetch passengers' }, { status: 500 })
    }
}
