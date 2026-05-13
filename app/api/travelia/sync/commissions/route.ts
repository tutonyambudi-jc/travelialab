import { NextResponse } from 'next/server'
import {
  assertTraveliaErpSyncAuth,
  traveliaSyncUnauthorizedResponse,
} from '@/app/modules/travelia/sync/erpSync.routes'
import { pushCommissionToErp } from '@/app/modules/travelia/sync/erpSync.service'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

export async function POST(request: Request) {
  const auth = await assertTraveliaErpSyncAuth(request)
  if (!auth) return traveliaSyncUnauthorizedResponse()

  try {
    const body = await request.json()
    const commissionId = typeof body.commissionId === 'string' ? body.commissionId : null
    if (!commissionId) {
      return NextResponse.json({ error: 'commissionId requis' }, { status: 400 })
    }

    try {
      const r = await pushCommissionToErp(commissionId)
      return NextResponse.json({
        ok: true,
        commissionId,
        idempotent: 'idempotent' in r ? r.idempotent : false,
      })
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          commissionId,
          error: redactObjectForLog(e instanceof Error ? e.message : String(e)),
        },
        { status: 502 }
      )
    }
  } catch (e) {
    console.error('travelia/sync/commissions', redactObjectForLog(String(e)))
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
}
