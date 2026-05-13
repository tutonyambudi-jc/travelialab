import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseJsonArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : []
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const minSeats = Number(searchParams.get('minSeats') || '0')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      isActive: true,
      isAvailable: true,
    }

    if (type) {
      where.type = type.toUpperCase()
    }

    if (Number.isFinite(minSeats) && minSeats > 0) {
      where.seats = { gte: minSeats }
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      where.rentals = {
        none: {
          status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      }
    }

    const rows = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      total: rows.length,
      data: rows.map((row) => ({
        ...row,
        features: parseJsonArray(row.features),
      })),
    })
  } catch (error) {
    console.error('Vehicle list error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}