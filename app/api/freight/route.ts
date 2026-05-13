import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTrackingCode } from '@/lib/utils'
import * as QRCode from 'qrcode'
import { Prisma } from '@prisma/client'
import { createFreightSchema } from '@/lib/schemas/freight'
import { apiUnauthorized, apiValidationError, apiServerError } from '@/lib/api-response'

/** Price per kilogram in FC (configurable via admin settings in future) */
const FREIGHT_PRICE_PER_KG_FC = 10_000

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return apiUnauthorized()
    }

    const body = await request.json()

    const parsed = createFreightSchema.safeParse(body)
    if (!parsed.success) {
      return apiValidationError(parsed.error)
    }

    const {
      tripId,
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      weight: weightNum,
      type,
      value,
      notes,
      agentId,
      originStopId,
      destinationStopId,
    } = parsed.data

    // Verify trip exists and is active
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if (!trip || !trip.isActive) {
      return NextResponse.json({ error: 'Trajet non disponible' }, { status: 400 })
    }

    const priceValue = weightNum * FREIGHT_PRICE_PER_KG_FC
    const trackingCode = generateTrackingCode()

    // Create freight order and QR code in sequence (QR depends on the created record)
    const freightOrder = await prisma.freightOrder.create({
      data: {
        tripId,
        userId: session.user.role === 'CLIENT' ? session.user.id : undefined,
        agentId:
          agentId ||
          (session.user.role === 'AGENT' || session.user.role === 'SUPER_AGENT'
            ? session.user.id
            : null),
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        weight: weightNum,
        type: type || null,
        value: value ? parseFloat(String(value)) : null,
        price: priceValue,
        trackingCode,
        notes: notes || null,
        status: 'RECEIVED',
        originStopId: originStopId || null,
        destinationStopId: destinationStopId || null,
      },
      select: { id: true, trackingCode: true, price: true, receiverName: true, receiverPhone: true, createdAt: true },
    })

    // Generate QR code and update the record (awaited — failures are caught)
    const qrData = JSON.stringify({
      code: freightOrder.trackingCode,
      name: freightOrder.receiverName,
      phone: freightOrder.receiverPhone,
      date: freightOrder.createdAt,
    })
    const qrCode = await QRCode.toDataURL(qrData)

    await prisma.freightOrder.update({
      where: { id: freightOrder.id },
      data: { qrCode },
    })

    return NextResponse.json(
      {
        freightOrderId: freightOrder.id,
        trackingCode: freightOrder.trackingCode,
        price: freightOrder.price,
        qrCode,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Freight order creation error:', error)
    return apiServerError(error)
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const trackingCode = searchParams.get('trackingCode')

    if (trackingCode) {
      const freightOrder = await prisma.freightOrder.findUnique({
        where: { trackingCode },
        include: {
          trip: {
            include: {
              route: true,
              bus: {
                select: {
                  name: true,
                  plateNumber: true,
                },
              },
            },
          },
          payment: true,
        },
      })

      if (!freightOrder) {
        return NextResponse.json(
          { error: 'Commande introuvable' },
          { status: 404 }
        )
      }

      return NextResponse.json(freightOrder)
    }

    // Build query based on role
    const where: Prisma.FreightOrderWhereInput = {}
    if (session.user.role === 'CLIENT') {
      where.userId = session.user.id
    } else if (session.user.role === 'AGENT' || session.user.role === 'SUPER_AGENT') {
      where.agentId = session.user.id
    }

    const freightOrders = await prisma.freightOrder.findMany({
      where,
      include: {
        trip: {
          include: {
            route: true,
            bus: {
              select: {
                name: true,
                plateNumber: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(freightOrders)
  } catch (error) {
    console.error('Freight orders fetch error:', error)
    return NextResponse.json(
      { error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` },
      { status: 500 }
    )
  }
}
