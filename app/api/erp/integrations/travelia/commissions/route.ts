import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateErpTraveliaRequest, requireErpTraveliaScopes } from '@/lib/erp-travelia-inbound-auth'
import { ERP_TRAVELIA_SCOPES } from '@/lib/erp-travelia-scopes'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

/**
 * Point d’entrée ERP : réception idempotente des commissions Travelia.
 * Initialise le cache de reversement (`GET .../settlement-status/:id`).
 */
export async function POST(request: Request) {
  try {
    const auth = authenticateErpTraveliaRequest(request)
    requireErpTraveliaScopes(auth, [ERP_TRAVELIA_SCOPES.COMMISSIONS_WRITE])

    const body = await request.json()
    const external_reference =
      typeof body.external_reference === 'string' ? body.external_reference : null
    const commission_id = typeof body.commission_id === 'string' ? body.commission_id : null
    if (!external_reference || !commission_id) {
      return NextResponse.json(
        { error: 'external_reference et commission_id requis' },
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
        eventType: 'COMMISSION',
        payload: redactObjectForLog(body),
      },
    })

    await prisma.erpTraveliaStatusCache.upsert({
      where: {
        entityType_entityId_statusKind: {
          entityType: 'COMMISSION',
          entityId: commission_id,
          statusKind: 'SETTLEMENT',
        },
      },
      create: {
        entityType: 'COMMISSION',
        entityId: commission_id,
        statusKind: 'SETTLEMENT',
        status: 'PENDING',
        raw: redactObjectForLog(body),
      },
      update: {
        status: 'PENDING',
        raw: redactObjectForLog(body),
      },
    })

    return NextResponse.json({ ok: true, external_reference, commission_id })
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500
    const message = e instanceof Error ? e.message : 'Erreur serveur'
    if (status >= 500) {
      console.error('ERP travelia commissions', redactObjectForLog(message))
    }
    return NextResponse.json({ error: message }, { status })
  }
}
