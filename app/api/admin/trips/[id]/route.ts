import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function isAdminRole(role?: string) {
    return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

// DELETE /api/admin/trips/[id] -> Soft delete trip
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || !isAdminRole(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await prisma.trip.update({
            where: { id: p.id },
            data: { isActive: false },
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: `Erreur suppression: ${error.message || 'Erreur inconnue'}` },
            { status: 500 }
        )
    }
}

// PUT /api/admin/trips/[id] -> Update trip
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const p = await params
    const session = await getServerSession(authOptions)
    if (!session || !isAdminRole(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const departureTime = new Date(body.departureTime)
        const arrivalTime = new Date(body.arrivalTime)
        const price = Number(body.price)
        const boardingMinutesBefore = Number(body.boardingMinutesBefore)
        const promotionPercentage = Number(body.promotionPercentage) || 0
        const promoPrice = body.promoPrice != null ? Number(body.promoPrice) : null

        if (Number.isNaN(departureTime.getTime()) || Number.isNaN(arrivalTime.getTime())) {
            return NextResponse.json({ error: 'Dates invalides' }, { status: 400 })
        }
        if (!Number.isFinite(price) || price < 0) {
            return NextResponse.json({ error: 'Prix invalide' }, { status: 400 })
        }
        if (!Number.isFinite(boardingMinutesBefore) || boardingMinutesBefore < 0) {
            return NextResponse.json({ error: 'Délai d\'embarquement invalide' }, { status: 400 })
        }
        if (!Number.isFinite(promotionPercentage) || promotionPercentage < 0 || promotionPercentage > 100) {
            return NextResponse.json({ error: 'Pourcentage de promotion invalide' }, { status: 400 })
        }
        if (promoPrice != null && (!Number.isFinite(promoPrice) || promoPrice < 0)) {
            return NextResponse.json({ error: 'Prix promotionnel invalide' }, { status: 400 })
        }

        const [bus, route] = await Promise.all([
            prisma.bus.findUnique({ where: { id: body.busId }, select: { id: true } }),
            prisma.route.findUnique({ where: { id: body.routeId }, select: { id: true } }),
        ])
        if (!bus) return NextResponse.json({ error: 'Bus introuvable' }, { status: 400 })
        if (!route) return NextResponse.json({ error: 'Route introuvable' }, { status: 400 })

        const trip = await prisma.trip.update({
            where: { id: p.id },
            data: {
                busId: body.busId,
                routeId: body.routeId,
                departureTime,
                arrivalTime,
                price,
                promoActive: body.promoActive === true,
                promoMode: typeof body.promoMode === 'string' ? body.promoMode : null,
                promoPrice,
                promoDays: body.promoDays ? JSON.stringify(body.promoDays) : null,
                boardingMinutesBefore,
                promotionPercentage,
            },
        })
        return NextResponse.json(trip)
    } catch (error: any) {
        return NextResponse.json(
            { error: `Erreur mise à jour: ${error.message || 'Erreur inconnue'}` },
            { status: 500 }
        )
    }
}
