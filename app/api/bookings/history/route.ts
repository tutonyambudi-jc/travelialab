import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || 'ALL').toUpperCase()
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
    }
    if (status !== 'ALL') {
      where.status = status
    }

    const [total, rows] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          trip: { include: { route: true, bus: true } },
          seat: true,
          payment: true,
          history: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              changedBy: {
                select: { id: true, firstName: true, lastName: true, role: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    return NextResponse.json({
      data: rows,
      total,
      page,
      limit,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error('Booking history list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}
