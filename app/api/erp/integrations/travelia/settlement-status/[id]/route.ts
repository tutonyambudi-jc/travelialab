import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateErpTraveliaRequest, requireErpTraveliaScopes } from '@/lib/erp-travelia-inbound-auth'
import { ERP_TRAVELIA_SCOPES } from '@/lib/erp-travelia-scopes'
import { redactObjectForLog } from '@/lib/travelia-erp-redact'

/**
 * ERP expose le statut de reversement partenaire pour une commission Travelia (flux 5).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = authenticateErpTraveliaRequest(request)
    requireErpTraveliaScopes(auth, [ERP_TRAVELIA_SCOPES.STATUS_READ])

    const { id } = await params

    const row = await prisma.erpTraveliaStatusCache.findUnique({
      where: {
        entityType_entityId_statusKind: {
          entityType: 'COMMISSION',
          entityId: id,
          statusKind: 'SETTLEMENT',
        },
      },
    })

    const status = row?.status ?? 'PENDING'
    let settled_at: string | null = null
    if (row?.raw) {
      try {
        const parsed = JSON.parse(row.raw) as { settled_at?: string }
        if (typeof parsed.settled_at === 'string') settled_at = parsed.settled_at
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      id,
      status,
      settled_at,
    })
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500
    const message = e instanceof Error ? e.message : 'Erreur serveur'
    if (status >= 500) {
      console.error('ERP travelia settlement-status', redactObjectForLog(message))
    }
    return NextResponse.json({ error: message }, { status })
  }
}
