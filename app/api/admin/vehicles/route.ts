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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (type) where.type = type
    if (isActive === 'true' || isActive === 'false') where.isActive = isActive === 'true'

    const rows = await prisma.vehicle.findMany({
      where,
      include: {
        _count: { select: { rentals: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = rows.map((row) => ({
      ...row,
      features: row.features ? JSON.parse(row.features) : [],
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin vehicles list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const plateNumber = typeof body?.plateNumber === 'string' ? body.plateNumber.trim() : ''
    const brand = typeof body?.brand === 'string' ? body.brand.trim() : ''
    const model = typeof body?.model === 'string' ? body.model.trim() : ''
    const type = typeof body?.type === 'string' ? body.type.trim().toUpperCase() : 'CAR'
    const fuelType = typeof body?.fuelType === 'string' ? body.fuelType.trim().toUpperCase() : 'PETROL'
    const transmission = typeof body?.transmission === 'string' ? body.transmission.trim().toUpperCase() : 'MANUAL'
    const seats = Number(body?.seats)
    const dailyRate = Number(body?.dailyRate)

    if (!plateNumber || !brand || !model) {
      return NextResponse.json({ error: 'plateNumber, brand et model sont requis' }, { status: 400 })
    }
    if (!Number.isFinite(seats) || seats < 1 || seats > 30) {
      return NextResponse.json({ error: 'Nombre de places invalide (1..30)' }, { status: 400 })
    }
    if (!Number.isFinite(dailyRate) || dailyRate < 0) {
      return NextResponse.json({ error: 'Tarif journalier invalide' }, { status: 400 })
    }

    const features = parseFeatures(body?.features)

    const created = await prisma.vehicle.create({
      data: {
        plateNumber,
        brand,
        model,
        type,
        fuelType,
        transmission,
        seats,
        dailyRate,
        year: Number.isFinite(Number(body?.year)) ? Number(body.year) : null,
        color: typeof body?.color === 'string' ? body.color.trim() : null,
        mileage: Number.isFinite(Number(body?.mileage)) ? Number(body.mileage) : null,
        imageUrl: typeof body?.imageUrl === 'string' ? body.imageUrl : null,
        description: typeof body?.description === 'string' ? body.description : null,
        features: features.length ? JSON.stringify(features) : null,
        isAvailable: body?.isAvailable === false ? false : true,
        isActive: body?.isActive === false ? false : true,
      },
    })

    return NextResponse.json({
      success: true,
      vehicle: {
        ...created,
        features,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Admin vehicle create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}
