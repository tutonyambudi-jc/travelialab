import { NextResponse } from 'next/server'
import {
  assertTraveliaErpSyncQueueAuth,
  traveliaSyncUnauthorizedResponse,
} from '@/app/modules/travelia/sync/erpSync.routes'
import {
  pullPaymentValidationFromErp,
  pullSettlementStatusFromErp,
} from '@/app/modules/travelia/sync/erpSync.service'
import {
  getSyncStatusSummary,
  querySyncLogs,
} from '@/app/modules/travelia/sync/erpSync.repository'
import { redactObjectForLog, redactSecrets } from '@/lib/travelia-erp-redact'

export async function GET(request: Request) {
  const auth = await assertTraveliaErpSyncQueueAuth(request)
  if (!auth) return traveliaSyncUnauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const refreshPaymentId = searchParams.get('refreshPaymentId')
  const refreshCommissionId = searchParams.get('refreshCommissionId')

  const tab = searchParams.get('tab') || 'all'
  const entityType = searchParams.get('entityType') || 'all'
  const q = searchParams.get('q') || ''
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))

  try {
    if (refreshPaymentId) {
      await pullPaymentValidationFromErp(refreshPaymentId)
    }
    if (refreshCommissionId) {
      await pullSettlementStatusFromErp(refreshCommissionId)
    }

    const summary = await getSyncStatusSummary(companyId || undefined)
    const { total, rows } = await querySyncLogs({
      companyId: companyId || undefined,
      statusTab: tab,
      entityType,
      search: q,
      skip: offset,
      take: limit,
    })

    const logs = rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      entityType: r.entityType,
      entityId: r.entityId,
      direction: r.direction,
      externalReference: r.externalReference,
      status: r.status,
      retryCount: r.retryCount,
      lastAttemptAt: r.lastAttemptAt,
      createdAt: r.createdAt,
      errorMessage: r.errorMessage,
      payload: r.payload ? redactSecrets(r.payload) : null,
      response: r.response ? redactSecrets(r.response) : null,
    }))

    return NextResponse.json({
      summary,
      total,
      logs,
      recent: logs,
    })
  } catch (e) {
    console.error('travelia/sync/status', redactObjectForLog(String(e)))
    return NextResponse.json(
      { error: redactObjectForLog(e instanceof Error ? e.message : String(e)) },
      { status: 502 }
    )
  }
}
