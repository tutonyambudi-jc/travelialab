import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const STAFF_ROLES = new Set(['ADMINISTRATOR', 'SUPERVISOR'])

function parseJsonArray(value: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const rental = await prisma.vehicleRental.findUnique({
      where: { id: p.id },
      include: {
        vehicle: true,
        payment: true,
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
    })

    if (!rental) return NextResponse.json({ error: 'Location introuvable' }, { status: 404 })

    const canAccess = rental.userId === session.user.id || STAFF_ROLES.has(session.user.role)
    if (!canAccess) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    return NextResponse.json({
      ...rental,
      extras: parseJsonArray(rental.extrasJson),
      vehicle: {
        ...rental.vehicle,
        features: parseJsonArray(rental.vehicle.features),
      },
    })
  } catch (error) {
    console.error('Vehicle rental detail error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const action = typeof body?.action === 'string' ? body.action.toLowerCase() : ''
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : null

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Action non supportée. Utilisez action="cancel"' }, { status: 400 })
    }

    const existing = await prisma.vehicleRental.findUnique({ where: { id: p.id } })
    if (!existing) return NextResponse.json({ error: 'Location introuvable' }, { status: 404 })

    const isOwner = existing.userId === session.user.id
    const isStaff = STAFF_ROLES.has(session.user.role)
    if (!isOwner && !isStaff) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cette location ne peut plus être annulée' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const rental = await tx.vehicleRental.update({
        where: { id: existing.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      })

      await tx.vehicleRentalHistory.create({
        data: {
          rentalId: existing.id,
          fromStatus: existing.status,
          toStatus: 'CANCELLED',
          changedById: session.user.id,
          reason: reason || 'Annulation utilisateur',
        },
      })

      return rental
    })

    return NextResponse.json({ success: true, rental: updated })
  } catch (error) {
    console.error('Vehicle rental cancel error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}