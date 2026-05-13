import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateErpTraveliaRequest, requireErpTraveliaScopes } from '@/lib/erp-travelia-inbound-auth'
import { ERP_TRAVELIA_SCOPES } from '@/lib/erp-travelia-scopes'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

/**
 * Point d’entrée ERP (BBS) : réception idempotente des réservations Travelia.
 */
export async function POST(request: Request) {
  try {
    const auth = authenticateErpTraveliaRequest(request)
    requireErpTraveliaScopes(auth, [ERP_TRAVELIA_SCOPES.BOOKINGS_WRITE])

    const body = await request.json()
    const external_reference =
      typeof body.external_reference === 'string' ? body.external_reference : null
    if (!external_reference) {
      return NextResponse.json({ error: 'external_reference requis' }, { status: 400 })
    }

    const dup = await prisma.erpTraveliaInboundEvent.findUnique({
      where: { externalReference: external_reference },
    })
    if (dup) {
      return NextResponse.json({ ok: true, duplicate: true, external_reference })
    }

    await prisma.erpTraveliaInboundEvent.create({
      data: {
        externalReference: external_reference,
        eventType: 'BOOKING',
        payload: redactObjectForLog(body),
      },
    })

    return NextResponse.json({ ok: true, external_reference })
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500
    const message = e instanceof Error ? e.message : 'Erreur serveur'
    if (status >= 500) {
      console.error('ERP travelia bookings', redactObjectForLog(message))
    }
    return NextResponse.json({ error: message }, { status })
  }
}
