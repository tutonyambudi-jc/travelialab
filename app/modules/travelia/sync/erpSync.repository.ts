import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

export type SyncEntityType = 'BOOKING' | 'PAYMENT' | 'COMMISSION'
export type SyncDirection = 'OUTBOUND_TO_ERP' | 'INBOUND_FROM_ERP'
export type SyncLogStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export async function findSuccessfulSyncLog(externalReference: string) {
  const row = await prisma.traveliaSyncLog.findUnique({
    where: { externalReference },
  })
  if (row?.status === 'SUCCESS') return row
  return null
}

export async function upsertSyncLogStart(params: {
  companyId: string | null
  entityType: SyncEntityType
  entityId: string
  direction: SyncDirection
  externalReference: string
  payload: unknown
}) {
  const payloadStr = redactObjectForLog(params.payload)
  const existing = await prisma.traveliaSyncLog.findUnique({
    where: { externalReference: params.externalReference },
  })

  if (!existing) {
    return prisma.traveliaSyncLog.create({
      data: {
        companyId: params.companyId,
        entityType: params.entityType,
        entityId: params.entityId,
        direction: params.direction,
        externalReference: params.externalReference,
        payload: payloadStr,
        status: 'PENDING',
        lastAttemptAt: new Date(),
      },
    })
  }

  return prisma.traveliaSyncLog.update({
    where: { externalReference: params.externalReference },
    data: {
      payload: payloadStr,
      status: 'PENDING',
      errorMessage: null,
      lastAttemptAt: new Date(),
      retryCount: { increment: 1 },
    },
  })
}

export async function finalizeSyncLog(
  externalReference: string,
  data: {
    status: SyncLogStatus
    response?: unknown
    errorMessage?: string | null
  }
) {
  return prisma.traveliaSyncLog.update({
    where: { externalReference },
    data: {
      status: data.status,
      response: data.response != null ? redactObjectForLog(data.response) : null,
      errorMessage: data.errorMessage ?? null,
      lastAttemptAt: new Date(),
    },
  })
}

export async function listFailedSyncLogs(limit: number) {
  return prisma.traveliaSyncLog.findMany({
    where: { status: 'FAILED', direction: 'OUTBOUND_TO_ERP' },
    orderBy: { lastAttemptAt: 'desc' },
    take: limit,
  })
}

export async function getSyncStatusSummary(companyId?: string | null) {
  const where = companyId ? { companyId } : {}
  const [pending, failed, success] = await Promise.all([
    prisma.traveliaSyncLog.count({ where: { ...where, status: 'PENDING' } }),
    prisma.traveliaSyncLog.count({ where: { ...where, status: 'FAILED' } }),
    prisma.traveliaSyncLog.count({ where: { ...where, status: 'SUCCESS' } }),
  ])
  return { pending, failed, success }
}

export async function recentSyncLogs(take: number, companyId?: string | null) {
  return prisma.traveliaSyncLog.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { createdAt: 'desc' },
    take,
  })
}

export type SyncLogQueryFilters = {
  companyId?: string | null
  /** all | pending | success | failed | retried */
  statusTab?: string
  entityType?: string
  search?: string
  skip?: number
  take?: number
}

export async function querySyncLogs(filters: SyncLogQueryFilters) {
  const take = Math.min(Math.max(filters.take ?? 50, 1), 200)
  const skip = Math.max(filters.skip ?? 0, 0)
  const tab = (filters.statusTab || 'all').toLowerCase()

  const where: Prisma.TraveliaSyncLogWhereInput = {}

  if (filters.companyId) {
    where.companyId = filters.companyId
  }

  if (filters.entityType && filters.entityType !== 'all') {
    where.entityType = filters.entityType
  }

  if (filters.search?.trim()) {
    where.externalReference = { contains: filters.search.trim() }
  }

  if (tab === 'pending') {
    where.status = 'PENDING'
  } else if (tab === 'success' || tab === 'synced') {
    where.status = 'SUCCESS'
  } else if (tab === 'failed') {
    where.status = 'FAILED'
  } else if (tab === 'retried') {
    where.retryCount = { gt: 0 }
  }

  const [total, rows] = await Promise.all([
    prisma.traveliaSyncLog.count({ where }),
    prisma.traveliaSyncLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ])

  return { total, rows }
}
