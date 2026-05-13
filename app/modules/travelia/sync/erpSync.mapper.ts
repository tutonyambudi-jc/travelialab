/**
 * Mappers canoniques Travelia → ERP et ERP → Travelia.
 * `external_reference` assure l’idempotence des envois.
 */

export type ErpBookingPayload = {
  external_reference: string
  booking_id: string
  ticket_number: string
  company_id: string | null
  status: string
  total_price: number
  currency: string
  passenger_name: string
  passenger_email: string | null
  passenger_phone: string | null
  trip: {
    id: string
    departure_time: string
    arrival_time: string
    route_origin: string
    route_destination: string
  }
  created_at: string
}

export type ErpPaymentPayload = {
  external_reference: string
  payment_id: string
  booking_id: string | null
  booking_group_id: string | null
  amount: number
  method: string
  status: string
  transaction_id: string | null
  paid_at: string | null
  company_id: string | null
}

export type ErpCommissionPayload = {
  external_reference: string
  commission_id: string
  agent_id: string
  booking_id: string | null
  amount: number
  percentage: number
  status: string
  company_id: string | null
  created_at: string
}

export type TraveliaPaymentValidation = {
  erpPaymentValidationStatus: string | null
  erpPaymentValidatedAt: Date | null
}

export type TraveliaSettlement = {
  erpPartnerSettlementStatus: string | null
  erpPartnerSettledAt: Date | null
}

type BookingForErp = {
  id: string
  ticketNumber: string
  status: string
  totalPrice: number
  passengerName: string
  passengerEmail: string | null
  passengerPhone: string | null
  createdAt: Date
  trip: {
    id: string
    departureTime: Date
    arrivalTime: Date
    route: { origin: string; destination: string }
    bus: { companyId: string | null }
  }
}

export function bookingToERP(booking: BookingForErp, currency = 'XOF'): ErpBookingPayload {
  return {
    external_reference: `travelia:booking:${booking.id}`,
    booking_id: booking.id,
    ticket_number: booking.ticketNumber,
    company_id: booking.trip.bus.companyId,
    status: booking.status,
    total_price: booking.totalPrice,
    currency,
    passenger_name: booking.passengerName,
    passenger_email: booking.passengerEmail,
    passenger_phone: booking.passengerPhone,
    trip: {
      id: booking.trip.id,
      departure_time: booking.trip.departureTime.toISOString(),
      arrival_time: booking.trip.arrivalTime.toISOString(),
      route_origin: booking.trip.route.origin,
      route_destination: booking.trip.route.destination,
    },
    created_at: booking.createdAt.toISOString(),
  }
}

type PaymentForErp = {
  id: string
  amount: number
  method: string
  status: string
  transactionId: string | null
  paidAt: Date | null
  bookingId: string | null
  bookingGroupId: string | null
  booking?: {
    id: string
    trip: { bus: { companyId: string | null } }
  } | null
  bookingGroup?: {
    id: string
    bookings: { id: string; trip: { bus: { companyId: string | null } } }[]
  } | null
}

export function paymentToERP(payment: PaymentForErp): ErpPaymentPayload {
  let companyId: string | null = null
  if (payment.booking?.trip?.bus?.companyId) {
    companyId = payment.booking.trip.bus.companyId
  } else if (payment.bookingGroup?.bookings?.[0]?.trip?.bus?.companyId) {
    companyId = payment.bookingGroup.bookings[0].trip.bus.companyId
  }

  const bookingId =
    payment.bookingId ||
    (payment.bookingGroup?.bookings?.length ? payment.bookingGroup.bookings[0].id : null)

  return {
    external_reference: `travelia:payment:${payment.id}`,
    payment_id: payment.id,
    booking_id: bookingId,
    booking_group_id: payment.bookingGroupId,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    transaction_id: payment.transactionId,
    paid_at: payment.paidAt ? payment.paidAt.toISOString() : null,
    company_id: companyId,
  }
}

type CommissionForErp = {
  id: string
  agentId: string
  bookingId: string | null
  amount: number
  percentage: number
  status: string
  createdAt: Date
  companyId: string | null
}

export function commissionToERP(commission: CommissionForErp): ErpCommissionPayload {
  return {
    external_reference: `travelia:commission:${commission.id}`,
    commission_id: commission.id,
    agent_id: commission.agentId,
    booking_id: commission.bookingId,
    amount: commission.amount,
    percentage: commission.percentage,
    status: commission.status,
    company_id: commission.companyId,
    created_at: commission.createdAt.toISOString(),
  }
}

/** Normalise la réponse GET validation paiement ERP → champs Travelia */
export function erpPaymentStatusToTravelia(body: Record<string, unknown>): TraveliaPaymentValidation {
  const status = typeof body.status === 'string' ? body.status : null
  const validatedAtRaw = body.validated_at ?? body.validatedAt
  let erpPaymentValidatedAt: Date | null = null
  if (typeof validatedAtRaw === 'string') {
    const d = new Date(validatedAtRaw)
    if (!Number.isNaN(d.getTime())) erpPaymentValidatedAt = d
  }
  return {
    erpPaymentValidationStatus: status,
    erpPaymentValidatedAt,
  }
}

/** Normalise la réponse GET reversement partenaire ERP → champs Travelia */
export function erpSettlementStatusToTravelia(body: Record<string, unknown>): TraveliaSettlement {
  const status = typeof body.status === 'string' ? body.status : null
  const settledAtRaw = body.settled_at ?? body.settledAt
  let erpPartnerSettledAt: Date | null = null
  if (typeof settledAtRaw === 'string') {
    const d = new Date(settledAtRaw)
    if (!Number.isNaN(d.getTime())) erpPartnerSettledAt = d
  }
  return {
    erpPartnerSettlementStatus: status,
    erpPartnerSettledAt,
  }
}
