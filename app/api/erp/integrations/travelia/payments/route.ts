import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateErpTraveliaRequest, requireErpTraveliaScopes } from '@/lib/erp-travelia-inbound-auth'
import { ERP_TRAVELIA_SCOPES } from '@/lib/erp-travelia-scopes'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

/**
 * Point d’entrée ERP : réception idempotente des paiements Travelia.
 * Initialise le cache de statut de validation (`GET .../payment-status/:id`).
 */
export async function POST(request: Request) {
  try {
    const auth = authenticateErpTraveliaRequest(request)
    requireErpTraveliaScopes(auth, [ERP_TRAVELIA_SCOPES.PAYMENTS_WRITE])

    const body = await request.json()
    const external_reference =
      typeof body.external_reference === 'string' ? body.external_reference : null
    const payment_id = typeof body.payment_id === 'string' ? body.payment_id : null
    if (!external_reference || !payment_id) {
      return NextResponse.json(
        { error: 'external_reference et payment_id requis' },
        { status: 400 }
      )
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
        eventType: 'PAYMENT',
        payload: redactObjectForLog(body),
      },
    })

    await prisma.erpTraveliaStatusCache.upsert({
      where: {
        entityType_entityId_statusKind: {
          entityType: 'PAYMENT',
          entityId: payment_id,
          statusKind: 'VALIDATION',
        },
      },
      create: {
        entityType: 'PAYMENT',
        entityId: payment_id,
        statusKind: 'VALIDATION',
        status: 'PENDING',
        raw: redactObjectForLog(body),
      },
      update: {
        status: 'PENDING',
        raw: redactObjectForLog(body),
      },
    })

    return NextResponse.json({ ok: true, external_reference, payment_id })
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500
    const message = e instanceof Error ? e.message : 'Erreur serveur'
    if (status >= 500) {
      console.error('ERP travelia payments', redactObjectForLog(message))
    }
    return NextResponse.json({ error: message }, { status })
  }
}
