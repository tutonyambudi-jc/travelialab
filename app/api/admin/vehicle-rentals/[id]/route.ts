import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const rental = await prisma.vehicleRental.findUnique({
      where: { id: p.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        vehicle: true,
        payment: true,
        history: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!rental) return NextResponse.json({ error: 'Location introuvable' }, { status: 404 })

    return NextResponse.json({
      ...rental,
      vehicle: {
        ...rental.vehicle,
        features: rental.vehicle.features ? JSON.parse(rental.vehicle.features) : [],
      },
      extras: rental.extrasJson ? JSON.parse(rental.extrasJson) : [],
    })
  } catch (error) {
    console.error('Admin vehicle rental get error:', error)
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

    const existing = await prisma.vehicleRental.findUnique({ where: { id: p.id } })
    if (!existing) return NextResponse.json({ error: 'Location introuvable' }, { status: 404 })

    const nextStatus = typeof body?.status === 'string' ? body.status.trim().toUpperCase() : existing.status

    const updated = await prisma.$transaction(async (tx) => {
      const rental = await tx.vehicleRental.update({
        where: { id: p.id },
        data: {
          status: nextStatus,
          paymentStatus: typeof body?.paymentStatus === 'string' ? body.paymentStatus.trim().toUpperCase() : undefined,
          paymentMethod: body?.paymentMethod === null ? null : (typeof body?.paymentMethod === 'string' ? body.paymentMethod.trim().toUpperCase() : undefined),
          adminNotes: body?.adminNotes === null ? null : (typeof body?.adminNotes === 'string' ? body.adminNotes : undefined),
          rejectionReason: body?.rejectionReason === null ? null : (typeof body?.rejectionReason === 'string' ? body.rejectionReason : undefined),
          cancellationReason: body?.cancellationReason === null ? null : (typeof body?.cancellationReason === 'string' ? body.cancellationReason : undefined),
          confirmedAt: nextStatus === 'CONFIRMED' ? new Date() : undefined,
          startedAt: nextStatus === 'ACTIVE' ? new Date() : undefined,
          completedAt: nextStatus === 'COMPLETED' ? new Date() : undefined,
          cancelledAt: nextStatus === 'CANCELLED' ? new Date() : undefined,
        },
      })

      if (existing.status !== nextStatus) {
        await tx.vehicleRentalHistory.create({
          data: {
            rentalId: existing.id,
            fromStatus: existing.status,
            toStatus: nextStatus,
            changedById: session.user.id,
            reason: typeof body?.reason === 'string' ? body.reason : 'Mise à jour admin',
            notes: typeof body?.notes === 'string' ? body.notes : null,
          },
        })
      }

      return rental
    })

    return NextResponse.json({ success: true, rental: updated })
  } catch (error) {
    console.error('Admin vehicle rental update error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}
