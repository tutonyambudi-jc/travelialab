import { prisma } from '@/lib/prisma'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'
import {
  bookingToERP,
  commissionToERP,
  erpPaymentStatusToTravelia,
  erpSettlementStatusToTravelia,
  paymentToERP,
} from '@/app/modules/travelia/sync/erpSync.mapper'
import {
  finalizeSyncLog,
  findSuccessfulSyncLog,
  listFailedSyncLogs,
  upsertSyncLogStart,
} from '@/app/modules/travelia/sync/erpSync.repository'
import { getTraveliaErpCredentials } from '@/lib/travelia-erp-runtime-config'

async function postToErp(path: string, body: unknown): Promise<unknown> {
  const { baseUrl: base, apiKey: key } = await getTraveliaErpCredentials()
  if (!base || !key) {
    throw new Error('ERP_BASE_URL ou ERP_API_KEY non configurés')
  }
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`ERP ${res.status}: ${redactObjectForLog(json)}`)
  }
  return json
}

async function getFromErp(path: string): Promise<unknown> {
  const { baseUrl: base, apiKey: key } = await getTraveliaErpCredentials()
  if (!base || !key) {
    throw new Error('ERP_BASE_URL ou ERP_API_KEY non configurés')
  }
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${key}` },
  })
  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`ERP ${res.status}: ${redactObjectForLog(json)}`)
  }
  return json
}

async function auditBookingErpSync(
  bookingId: string,
  success: boolean,
  meta: Record<string, unknown>
) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true },
  })
  if (!b) return
  await prisma.bookingHistory.create({
    data: {
      bookingId,
      fromStatus: b.status,
      toStatus: b.status,
      reason: 'ERP_SYNC',
      notes: success ? 'Synchronisation ERP réussie' : 'Synchronisation ERP échouée',
      metadata: JSON.stringify(meta),
    },
  })
}

const PATH_BOOKING = '/api/erp/integrations/travelia/bookings'
const PATH_PAYMENT = '/api/erp/integrations/travelia/payments'
const PATH_COMMISSION = '/api/erp/integrations/travelia/commissions'

export async function pushBookingToErp(bookingId: string) {
  const externalReference = `travelia:booking:${bookingId}`

  const existingOk = await findSuccessfulSyncLog(externalReference)
  if (existingOk) {
    await prisma.booking.updateMany({
      where: { id: bookingId, NOT: { erpSyncStatus: 'SYNCED' } },
      data: { erpSyncStatus: 'SYNCED' },
    })
    return { ok: true as const, idempotent: true }
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip: {
        include: {
          route: true,
          bus: { select: { companyId: true } },
        },
      },
    },
  })

  if (!booking) {
    throw new Error('Réservation introuvable')
  }

  const companyId = booking.trip.bus.companyId
  const payload = bookingToERP({
    id: booking.id,
    ticketNumber: booking.ticketNumber,
    status: booking.status,
    totalPrice: booking.totalPrice,
    passengerName: booking.passengerName,
    passengerEmail: booking.passengerEmail,
    passengerPhone: booking.passengerPhone,
    createdAt: booking.createdAt,
    trip: {
      id: booking.trip.id,
      departureTime: booking.trip.departureTime,
      arrivalTime: booking.trip.arrivalTime,
      route: booking.trip.route,
      bus: booking.trip.bus,
    },
  })

  await upsertSyncLogStart({
    companyId,
    entityType: 'BOOKING',
    entityId: bookingId,
    direction: 'OUTBOUND_TO_ERP',
    externalReference,
    payload,
  })

  try {
    const response = await postToErp(PATH_BOOKING, payload)
    await finalizeSyncLog(externalReference, { status: 'SUCCESS', response })
    await prisma.booking.update({
      where: { id: bookingId },
      data: { erpSyncStatus: 'SYNCED' },
    })
    await auditBookingErpSync(bookingId, true, {
      externalReference,
      http: 'SUCCESS',
    })
    return { ok: true as const, response }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await finalizeSyncLog(externalReference, {
      status: 'FAILED',
      errorMessage: msg,
      response: { error: redactObjectForLog(msg) },
    })
    await prisma.booking.updateMany({
      where: { id: bookingId },
      data: { erpSyncStatus: 'PENDING_SYNC' },
    })
    await auditBookingErpSync(bookingId, false, {
      externalReference,
      error: redactObjectForLog(msg),
    })
    throw e
  }
}

export async function pushPaymentToErp(paymentId: string) {
  const externalReference = `travelia:payment:${paymentId}`

  const existingOk = await findSuccessfulSyncLog(externalReference)
  if (existingOk) {
    await prisma.payment.updateMany({
      where: { id: paymentId, NOT: { erpSyncStatus: 'SYNCED' } },
      data: { erpSyncStatus: 'SYNCED' },
    })
    return { ok: true as const, idempotent: true }
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: { trip: { include: { bus: { select: { companyId: true } } } } },
      },
      bookingGroup: {
        include: {
          bookings: {
            take: 1,
            select: {
              id: true,
              trip: { include: { bus: { select: { companyId: true } } } },
            },
          },
        },
      },
    },
  })

  if (!payment) throw new Error('Paiement introuvable')

  const payload = paymentToERP(payment)
  const companyId = payload.company_id

  await upsertSyncLogStart({
    companyId,
    entityType: 'PAYMENT',
    entityId: paymentId,
    direction: 'OUTBOUND_TO_ERP',
    externalReference,
    payload,
  })

  try {
    const response = await postToErp(PATH_PAYMENT, payload)
    await finalizeSyncLog(externalReference, { status: 'SUCCESS', response })
    await prisma.payment.update({
      where: { id: paymentId },
      data: { erpSyncStatus: 'SYNCED' },
    })
    return { ok: true as const, response }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await finalizeSyncLog(externalReference, {
      status: 'FAILED',
      errorMessage: msg,
      response: { error: redactObjectForLog(msg) },
    })
    await prisma.payment.updateMany({
      where: { id: paymentId },
      data: { erpSyncStatus: 'PENDING_SYNC' },
    })
    throw e
  }
}

export async function pushCommissionToErp(commissionId: string) {
  const externalReference = `travelia:commission:${commissionId}`

  const existingOk = await findSuccessfulSyncLog(externalReference)
  if (existingOk) {
    await prisma.commission.updateMany({
      where: { id: commissionId, NOT: { erpSyncStatus: 'SYNCED' } },
      data: { erpSyncStatus: 'SYNCED' },
    })
    return { ok: true as const, idempotent: true }
  }

  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
  })
  if (!commission) throw new Error('Commission introuvable')

  let companyId: string | null = null
  if (commission.bookingId) {
    const b = await prisma.booking.findUnique({
      where: { id: commission.bookingId },
      include: { trip: { include: { bus: { select: { companyId: true } } } } },
    })
    companyId = b?.trip?.bus?.companyId ?? null
  }

  const payload = commissionToERP({
    id: commission.id,
    agentId: commission.agentId,
    bookingId: commission.bookingId,
    amount: commission.amount,
    percentage: commission.percentage,
    status: commission.status,
    createdAt: commission.createdAt,
    companyId,
  })

  await upsertSyncLogStart({
    companyId,
    entityType: 'COMMISSION',
    entityId: commissionId,
    direction: 'OUTBOUND_TO_ERP',
    externalReference,
    payload,
  })

  try {
    const response = await postToErp(PATH_COMMISSION, payload)
    await finalizeSyncLog(externalReference, { status: 'SUCCESS', response })
    await prisma.commission.update({
      where: { id: commissionId },
      data: { erpSyncStatus: 'SYNCED' },
    })
    return { ok: true as const, response }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await finalizeSyncLog(externalReference, {
      status: 'FAILED',
      errorMessage: msg,
      response: { error: redactObjectForLog(msg) },
    })
    await prisma.commission.updateMany({
      where: { id: commissionId },
      data: { erpSyncStatus: 'PENDING_SYNC' },
    })
    throw e
  }
}

export async function pullPaymentValidationFromErp(paymentId: string) {
  const raw = await getFromErp(`/api/erp/integrations/travelia/payment-status/${paymentId}`)
  const body = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const mapped = erpPaymentStatusToTravelia(body)
  await prisma.payment.updateMany({
    where: { id: paymentId },
    data: {
      erpPaymentValidationStatus: mapped.erpPaymentValidationStatus,
      erpPaymentValidatedAt: mapped.erpPaymentValidatedAt,
    },
  })

  const externalReference = `travelia:inbound:payment-status:${paymentId}`
  await prisma.traveliaSyncLog.upsert({
    where: { externalReference },
    create: {
      companyId: null,
      entityType: 'PAYMENT',
      entityId: paymentId,
      direction: 'INBOUND_FROM_ERP',
      externalReference,
      payload: redactObjectForLog(body),
      status: 'SUCCESS',
      response: redactObjectForLog(mapped),
      lastAttemptAt: new Date(),
    },
    update: {
      payload: redactObjectForLog(body),
      response: redactObjectForLog(mapped),
      status: 'SUCCESS',
      lastAttemptAt: new Date(),
    },
  })

  return mapped
}

export async function pullSettlementStatusFromErp(commissionId: string) {
  const raw = await getFromErp(`/api/erp/integrations/travelia/settlement-status/${commissionId}`)
  const body = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const mapped = erpSettlementStatusToTravelia(body)
  await prisma.commission.updateMany({
    where: { id: commissionId },
    data: {
      erpPartnerSettlementStatus: mapped.erpPartnerSettlementStatus,
      erpPartnerSettledAt: mapped.erpPartnerSettledAt,
    },
  })

  const externalReference = `travelia:inbound:settlement:${commissionId}`
  await prisma.traveliaSyncLog.upsert({
    where: { externalReference },
    create: {
      companyId: null,
      entityType: 'COMMISSION',
      entityId: commissionId,
      direction: 'INBOUND_FROM_ERP',
      externalReference,
      payload: redactObjectForLog(body),
      status: 'SUCCESS',
      response: redactObjectForLog(mapped),
      lastAttemptAt: new Date(),
    },
    update: {
      payload: redactObjectForLog(body),
      response: redactObjectForLog(mapped),
      status: 'SUCCESS',
      lastAttemptAt: new Date(),
    },
  })

  return mapped
}

/** Ne bloque pas : marque PENDING_SYNC et tente l’envoi en arrière-plan. */
export function scheduleBookingsErpSync(bookingIds: string[]) {
  if (!bookingIds.length) return
  void (async () => {
    try {
      await prisma.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { erpSyncStatus: 'PENDING_SYNC' },
      })
      for (const id of bookingIds) {
        try {
          await pushBookingToErp(id)
        } catch (e) {
          console.error('[ERP sync] booking', id, redactObjectForLog(String(e)))
        }
      }
    } catch (e) {
      console.error('[ERP sync] schedule bookings', redactObjectForLog(String(e)))
    }
  })()
}

export function schedulePaymentErpSync(paymentId: string) {
  void (async () => {
    try {
      await prisma.payment.updateMany({
        where: { id: paymentId },
        data: { erpSyncStatus: 'PENDING_SYNC' },
      })
      await pushPaymentToErp(paymentId)
    } catch (e) {
      console.error('[ERP sync] payment', paymentId, redactObjectForLog(String(e)))
    }
  })()
}

export function scheduleCommissionErpSync(commissionId: string) {
  void (async () => {
    try {
      await prisma.commission.updateMany({
        where: { id: commissionId },
        data: { erpSyncStatus: 'PENDING_SYNC' },
      })
      await pushCommissionToErp(commissionId)
    } catch (e) {
      console.error('[ERP sync] commission', commissionId, redactObjectForLog(String(e)))
    }
  })()
}

export async function retryOneOutboundSync(externalReference: string) {
  const row = await prisma.traveliaSyncLog.findUnique({
    where: { externalReference },
  })
  if (!row) {
    throw new Error('SYNC_LOG_NOT_FOUND')
  }
  if (row.direction !== 'OUTBOUND_TO_ERP') {
    return { ok: false as const, skipped: true as const, reason: 'not_outbound' }
  }
  if (row.status !== 'FAILED') {
    return { ok: false as const, skipped: true as const, reason: 'not_failed' }
  }
  if (row.entityType === 'BOOKING') {
    await pushBookingToErp(row.entityId)
  } else if (row.entityType === 'PAYMENT') {
    await pushPaymentToErp(row.entityId)
  } else if (row.entityType === 'COMMISSION') {
    await pushCommissionToErp(row.entityId)
  } else {
    throw new Error('UNKNOWN_ENTITY_TYPE')
  }
  return { ok: true as const }
}

export async function retryFailedSyncs(limit = 25) {
  const rows = await listFailedSyncLogs(limit)
  const results: { externalReference: string; ok: boolean; error?: string }[] = []

  for (const row of rows) {
    try {
      if (row.entityType === 'BOOKING') {
        await pushBookingToErp(row.entityId)
      } else if (row.entityType === 'PAYMENT') {
        await pushPaymentToErp(row.entityId)
      } else if (row.entityType === 'COMMISSION') {
        await pushCommissionToErp(row.entityId)
      }
      results.push({ externalReference: row.externalReference, ok: true })
    } catch (e) {
      results.push({
        externalReference: row.externalReference,
        ok: false,
        error: redactObjectForLog(e instanceof Error ? e.message : String(e)),
      })
    }
  }

  return results
}
