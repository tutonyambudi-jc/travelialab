import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RentalExtra = {
  label: string
  price: number
}

function parseExtras(input: unknown): RentalExtra[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      const label = typeof item?.label === 'string' ? item.label.trim() : ''
      const price = Number(item?.price)
      if (!label || !Number.isFinite(price) || price < 0) return null
      return { label, price }
    })
    .filter((item): item is RentalExtra => item !== null)
}

function parseJsonArray(value: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const rentals = await prisma.vehicleRental.findMany({
      where: { userId: session.user.id },
      include: {
        vehicle: true,
        payment: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            changedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      total: rentals.length,
      data: rentals.map((row) => ({
        ...row,
        extras: parseJsonArray(row.extrasJson),
        vehicle: {
          ...row.vehicle,
          features: parseJsonArray(row.vehicle.features),
        },
      })),
    })
  } catch (error) {
    console.error('Vehicle rentals list error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const vehicleId = typeof body?.vehicleId === 'string' ? body.vehicleId : ''
    const startDate = new Date(body?.startDate)
    const endDate = new Date(body?.endDate)
    const contactName = typeof body?.contactName === 'string' ? body.contactName.trim() : ''
    const contactPhone = typeof body?.contactPhone === 'string' ? body.contactPhone.trim() : ''
    const contactEmail = typeof body?.contactEmail === 'string' ? body.contactEmail.trim() : null
    const pickupLocation = typeof body?.pickupLocation === 'string' ? body.pickupLocation.trim() : null
    const returnLocation = typeof body?.returnLocation === 'string' ? body.returnLocation.trim() : null
    const driverName = typeof body?.driverName === 'string' ? body.driverName.trim() : null
    const driverLicenseNo = typeof body?.driverLicenseNo === 'string' ? body.driverLicenseNo.trim() : null
    const discountAmount = Number(body?.discountAmount || 0)
    const paymentMethod = typeof body?.paymentMethod === 'string' ? body.paymentMethod.trim().toUpperCase() : null

    if (!vehicleId || !contactName || !contactPhone || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Données invalides ou incomplètes' }, { status: 400 })
    }

    if (endDate < startDate) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 })
    }

    const now = new Date()
    if (startDate < now) {
      return NextResponse.json({ error: 'La date de départ doit être dans le futur' }, { status: 400 })
    }

    const extras = parseExtras(body?.extras)
    const extrasAmount = extras.reduce((sum, item) => sum + item.price, 0)

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, isActive: true, isAvailable: true },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Véhicule introuvable ou indisponible' }, { status: 404 })
    }

    const overlap = await prisma.vehicleRental.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { id: true },
    })

    if (overlap) {
      return NextResponse.json({ error: 'Ce véhicule est déjà réservé sur la période demandée' }, { status: 409 })
    }

    const dayMs = 24 * 60 * 60 * 1000
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs))
    const baseAmount = vehicle.dailyRate * totalDays
    const discount = Number.isFinite(discountAmount) && discountAmount > 0 ? discountAmount : 0
    const totalAmount = Math.max(0, baseAmount + extrasAmount - discount)

    const created = await prisma.$transaction(async (tx) => {
      const rental = await tx.vehicleRental.create({
        data: {
          vehicleId,
          userId: session.user.id,
          contactName,
          contactPhone,
          contactEmail,
          driverName,
          driverLicenseNo,
          startDate,
          endDate,
          pickupLocation,
          returnLocation,
          dailyRate: vehicle.dailyRate,
          totalDays,
          baseAmount,
          extrasJson: extras.length ? JSON.stringify(extras) : null,
          extrasAmount,
          discountAmount: discount,
          totalAmount,
          paymentMethod,
        },
      })

      await tx.vehicleRentalHistory.create({
        data: {
          rentalId: rental.id,
          fromStatus: null,
          toStatus: rental.status,
          changedById: session.user.id,
          reason: 'Création de la demande',
        },
      })

      return rental
    })

    return NextResponse.json({
      success: true,
      rental: {
        ...created,
        extras,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Vehicle rental creation error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}