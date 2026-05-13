import { NextResponse } from 'next/server'
import {
  assertTraveliaErpSyncQueueAuth,
  traveliaSyncUnauthorizedResponse,
} from '@/app/modules/travelia/sync/erpSync.routes'
import {
  retryFailedSyncs,
  retryOneOutboundSync,
} from '@/app/modules/travelia/sync/erpSync.service'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

export async function POST(request: Request) {
  const auth = await assertTraveliaErpSyncQueueAuth(request)
  if (!auth) return traveliaSyncUnauthorizedResponse()

  try {
    const body = await request.json().catch(() => ({}))
    const externalRef =
      typeof body.externalReference === 'string' ? body.externalReference.trim() : ''

    if (externalRef) {
      try {
        const r = await retryOneOutboundSync(externalRef)
        if (r.skipped) {
          const msg =
            r.reason === 'not_outbound'
              ? 'Retry disponible uniquement pour les envois vers l’ERP'
              : r.reason === 'not_failed'
                ? 'Réessayer uniquement pour les lignes en échec'
                : 'Action impossible'
          return NextResponse.json({ ok: false, skipped: true, reason: r.reason, error: msg }, { status: 400 })
        }
        return NextResponse.json({ ok: true, externalReference: externalRef })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg === 'SYNC_LOG_NOT_FOUND') {
          return NextResponse.json({ error: 'Journal introuvable' }, { status: 404 })
        }
        return NextResponse.json(
          { ok: false, error: redactObjectForLog(msg) },
          { status: 502 }
        )
      }
    }

    const limit =
      typeof body.limit === 'number' && body.limit > 0 ? Math.min(body.limit, 200) : 25

    const results = await retryFailedSyncs(limit)
    return NextResponse.json({ ok: true, results })
  } catch (e) {
    console.error('travelia/sync/retry-failed', redactObjectForLog(String(e)))
    return NextResponse.json({ error: 'Échec du retry' }, { status: 500 })
  }
}
