import { NextResponse } from 'next/server'
import {
  assertTraveliaErpSyncAuth,
  traveliaSyncUnauthorizedResponse,
} from '@/app/modules/travelia/sync/erpSync.routes'
import { pushBookingToErp } from '@/app/modules/travelia/sync/erpSync.service'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

export async function POST(request: Request) {
  const auth = await assertTraveliaErpSyncAuth(request)
  if (!auth) return traveliaSyncUnauthorizedResponse()

  try {
    const body = await request.json()
    const ids: string[] = Array.isArray(body.bookingIds)
      ? body.bookingIds
      : body.bookingId
        ? [body.bookingId]
        : []

    if (!ids.length) {
      return NextResponse.json({ error: 'bookingId ou bookingIds requis' }, { status: 400 })
    }

    const results: { bookingId: string; ok: boolean; idempotent?: boolean; error?: string }[] = []
    for (const bookingId of ids) {
      try {
        const r = await pushBookingToErp(bookingId)
        results.push({
          bookingId,
          ok: true,
          idempotent: 'idempotent' in r ? r.idempotent : false,
        })
      } catch (e) {
        results.push({
          bookingId,
          ok: false,
          error: redactObjectForLog(e instanceof Error ? e.message : String(e)),
        })
      }
    }

    return NextResponse.json({ results })
  } catch (e) {
    console.error('travelia/sync/bookings', redactObjectForLog(String(e)))
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
}
