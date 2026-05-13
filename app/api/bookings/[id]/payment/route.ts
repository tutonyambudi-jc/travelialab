import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { regenerateBookingQrForId } from '@/lib/booking-qr-server'
import { processPaymentSchema } from '@/lib/schemas/payment'
import { apiUnauthorized, apiForbidden, apiValidationError, apiServerError } from '@/lib/api-response'



function calculatePointsFromAmount(amountXof: number): number {
  // Règle simple: 1 point par tranche de 1000 FC payés
  return Math.max(0, Math.floor(amountXof / 1000))
}

function getTier(points: number): string {
  if (points >= 500) return 'PLATINUM'
  if (points >= 250) return 'GOLD'
  if (points >= 100) return 'SILVER'
  return 'BRONZE'
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return apiUnauthorized()
    }

    const body = await request.json()
    const parsed = processPaymentSchema.safeParse(body)
    if (!parsed.success) return apiValidationError(parsed.error)

    const { method } = parsed.data

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const booking = await prisma.booking.findUnique({
      where: { id: p.id },
      include: {
        trip: true,
        payment: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      )
    }

    // Autoriser le propriétaire OU l'agent vendeur OU le vendeur en agence
    if (
      booking.userId !== session.user.id &&
      booking.agentId !== session.user.id &&
      booking.agencyStaffId !== session.user.id
    ) {
      return apiForbidden()
    }

    if (booking.payment && booking.payment.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà payée' },
        { status: 400 }
      )
    }

    const isStaffActor = ['AGENT', 'SUPER_AGENT', 'AGENCY_STAFF', 'ADMINISTRATOR', 'SUPERVISOR'].includes(
      session.user.role
    )
    const cashIsPaidNow = method === 'CASH' && isStaffActor

    const paymentDeadline = (method === 'CASH' && !isStaffActor)
      ? new Date(Date.now() + 2 * 60 * 60 * 1000)
      : null

    // Wrap all mutations in a single atomic transaction
    const { payment, updatedBooking } = await prisma.$transaction(async (tx) => {
      const paymentData = {
        bookingId: booking.id,
        amount: booking.totalPrice || booking.trip.price,
        method,
        status: method === 'CASH' ? (cashIsPaidNow ? 'PAID' : 'PENDING') : 'PAID',
        paidAt: method === 'CASH' ? (cashIsPaidNow ? new Date() : null) : new Date(),
        paymentDeadline,
      }

      let payment
      if (booking.payment) {
        payment = await tx.payment.update({
          where: { id: booking.payment.id },
          data: paymentData,
        })
      } else {
        payment = await tx.payment.create({ data: paymentData })
      }

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: payment.status === 'PAID' ? 'CONFIRMED' : 'PENDING' },
      })

      if (booking.status !== updatedBooking.status) {
        await tx.bookingHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: booking.status,
            toStatus: updatedBooking.status,
            changedById: session.user.id,
            reason: 'Mise à jour après paiement',
            metadata: JSON.stringify({ method }),
          },
        })
      }

      // Commission: create idempotently inside the same transaction
      if (payment.status === 'PAID' && booking.agentId) {
        const agent = await tx.user.findUnique({
          where: { id: booking.agentId },
          select: { commissionRate: true },
        })
        const agentCommissionRate = agent?.commissionRate || 10
        const commissionAmount = (payment.amount * agentCommissionRate) / 100

        if (commissionAmount > 0) {
          try {
            await tx.commission.create({
              data: {
                agentId: booking.agentId,
                bookingId: booking.id,
                amount: commissionAmount,
                percentage: agentCommissionRate,
                status: 'PENDING',
              },
            })
          } catch {
            // Unique constraint violation — commission already exists, skip silently
          }
        }
      }

      // Optionally add cash transaction ID
      if (method === 'CASH') {
        const transactionId = `CASH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        await tx.payment.update({ where: { id: payment.id }, data: { transactionId } })
      }

      return { payment, updatedBooking }
    })

    // Post-transaction side effects (loyalty, QR, notifications)
    // These run after the DB is committed and failures are logged but not fatal

    // Award loyalty points for CLIENT purchases
    if (payment.status === 'PAID' && session.user.role === 'CLIENT') {
      const points = calculatePointsFromAmount(payment.amount)

      if (points > 0) {
        const existingLoyalty = await prisma.loyaltyTransaction.findUnique({
          where: { bookingId: booking.id },
          select: { id: true },
        })

        if (!existingLoyalty) {
          try {
            await prisma.$transaction(async (tx) => {
              await tx.loyaltyTransaction.create({
                data: {
                  userId: session.user.id,
                  bookingId: booking.id,
                  points,
                  type: 'EARN',
                  reason: 'Paiement de réservation',
                },
              })

              const updatedUser = await tx.user.update({
                where: { id: session.user.id },
                data: { loyaltyPoints: { increment: points } },
                select: { loyaltyPoints: true },
              })

              await tx.user.update({
                where: { id: session.user.id },
                data: { loyaltyTier: getTier(updatedUser.loyaltyPoints) },
              })
            })
          } catch (e) {
            console.error('Loyalty points error:', e)
          }
        }
      }
    }

    // Regenerate QR code (non-blocking)
    try {
      await regenerateBookingQrForId(booking.id)
    } catch (e) {
      console.error('QR regen error:', e)
    }

    // Send confirmation notifications (non-blocking)
    if (updatedBooking.status === 'CONFIRMED') {
      try {
        const { NotificationService } = await import('@/lib/notifications')
        const templates = NotificationService.templates.paymentConfirmation(updatedBooking, updatedBooking.ticketNumber)

        if (updatedBooking.passengerEmail) {
          await NotificationService.sendEmail({
            to: updatedBooking.passengerEmail,
            subject: templates.subject,
            html: templates.html,
          })
        }
        if (updatedBooking.passengerPhone) {
          await NotificationService.sendSMS({
            to: updatedBooking.passengerPhone,
            message: templates.sms,
          })
        }
      } catch (e) {
        console.error('Notification error:', e)
      }
    }

    void (async () => {
      try {
        const { schedulePaymentErpSync, scheduleCommissionErpSync } = await import(
          '@/app/modules/travelia/sync/erpSync.service'
        )
        schedulePaymentErpSync(payment.id)
        const commission = await prisma.commission.findFirst({
          where: { bookingId: booking.id },
          select: { id: true },
        })
        if (commission) {
          scheduleCommissionErpSync(commission.id)
        }
      } catch (e) {
        console.error('ERP sync schedule (payment):', e)
      }
    })()

    return NextResponse.json(
      { success: true, paymentId: payment.id, bookingStatus: updatedBooking.status },
      { status: 200 }
    )
  } catch (error) {
    console.error('Payment error:', error)
    return apiServerError(error)
  }
}
