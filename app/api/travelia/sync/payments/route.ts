import { NextResponse } from 'next/server'
import {
  assertTraveliaErpSyncAuth,
  traveliaSyncUnauthorizedResponse,
} from '@/app/modules/travelia/sync/erpSync.routes'
import { pushPaymentToErp } from '@/app/modules/travelia/sync/erpSync.service'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

export async function POST(request: Request) {
  const auth = await assertTraveliaErpSyncAuth(request)
  if (!auth) return traveliaSyncUnauthorizedResponse()

  try {
    const body = await request.json()
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId : null
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId requis' }, { status: 400 })
    }

    try {
      const r = await pushPaymentToErp(paymentId)
      return NextResponse.json({ ok: true, paymentId, idempotent: 'idempotent' in r ? r.idempotent : false })
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          paymentId,
          error: redactObjectForLog(e instanceof Error ? e.message : String(e)),
        },
        { status: 502 }
      )
    }
  } catch (e) {
    console.error('travelia/sync/payments', redactObjectForLog(String(e)))
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
}
