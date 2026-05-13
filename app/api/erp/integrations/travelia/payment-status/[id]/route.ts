import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateErpTraveliaRequest, requireErpTraveliaScopes } from '@/lib/erp-travelia-inbound-auth'
import { ERP_TRAVELIA_SCOPES } from '@/lib/erp-travelia-scopes'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

/**
 * ERP expose le statut de validation d’un paiement Travelia (flux 3 — lecture).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = authenticateErpTraveliaRequest(request)
    requireErpTraveliaScopes(auth, [ERP_TRAVELIA_SCOPES.STATUS_READ])

    const { id } = await params

    const row = await prisma.erpTraveliaStatusCache.findUnique({
      where: {
        entityType_entityId_statusKind: {
          entityType: 'PAYMENT',
          entityId: id,
          statusKind: 'VALIDATION',
        },
      },
    })

    const status = row?.status ?? 'PENDING'
    let validated_at: string | null = null
    if (row?.raw) {
      try {
        const parsed = JSON.parse(row.raw) as { validated_at?: string }
        if (typeof parsed.validated_at === 'string') validated_at = parsed.validated_at
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      id,
      status,
      validated_at,
    })
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500
    const message = e instanceof Error ? e.message : 'Erreur serveur'
    if (status >= 500) {
      console.error('ERP travelia payment-status', redactObjectForLog(message))
    }
    return NextResponse.json({ error: message }, { status })
  }
}
