import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

function parseFeatures(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean)
  }
  return [] as string[]
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const row = await prisma.vehicle.findUnique({
      where: { id: p.id },
      include: {
        _count: { select: { rentals: true } },
      },
    })

    if (!row) return NextResponse.json({ error: 'Véhicule introuvable' }, { status: 404 })

    return NextResponse.json({
      ...row,
      features: row.features ? JSON.parse(row.features) : [],
    })
  } catch (error) {
    console.error('Admin vehicle get error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const features = parseFeatures(body?.features)

    const updated = await prisma.vehicle.update({
      where: { id: p.id },
      data: {
        plateNumber: typeof body?.plateNumber === 'string' ? body.plateNumber.trim() : undefined,
        brand: typeof body?.brand === 'string' ? body.brand.trim() : undefined,
        model: typeof body?.model === 'string' ? body.model.trim() : undefined,
        type: typeof body?.type === 'string' ? body.type.trim().toUpperCase() : undefined,
        fuelType: typeof body?.fuelType === 'string' ? body.fuelType.trim().toUpperCase() : undefined,
        transmission: typeof body?.transmission === 'string' ? body.transmission.trim().toUpperCase() : undefined,
        seats: Number.isFinite(Number(body?.seats)) ? Number(body.seats) : undefined,
        dailyRate: Number.isFinite(Number(body?.dailyRate)) ? Number(body.dailyRate) : undefined,
        year: body?.year === null ? null : (Number.isFinite(Number(body?.year)) ? Number(body.year) : undefined),
        color: body?.color === null ? null : (typeof body?.color === 'string' ? body.color.trim() : undefined),
        mileage: body?.mileage === null ? null : (Number.isFinite(Number(body?.mileage)) ? Number(body.mileage) : undefined),
        imageUrl: body?.imageUrl === null ? null : (typeof body?.imageUrl === 'string' ? body.imageUrl : undefined),
        description: body?.description === null ? null : (typeof body?.description === 'string' ? body.description : undefined),
        features: body?.features !== undefined ? (features.length ? JSON.stringify(features) : null) : undefined,
        isAvailable: typeof body?.isAvailable === 'boolean' ? body.isAvailable : undefined,
        isActive: typeof body?.isActive === 'boolean' ? body.isActive : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      vehicle: {
        ...updated,
        features: updated.features ? JSON.parse(updated.features) : [],
      },
    })
  } catch (error) {
    console.error('Admin vehicle update error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const activeRentalsCount = await prisma.vehicleRental.count({
      where: {
        vehicleId: p.id,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      },
    })
    if (activeRentalsCount > 0) {
      return NextResponse.json({ error: 'Suppression impossible: ce véhicule a des locations actives' }, { status: 409 })
    }

    await prisma.vehicle.delete({ where: { id: p.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin vehicle delete error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}
