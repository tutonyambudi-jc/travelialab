import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, type UserRole } from '@/lib/auth'
import { userRoleCanAccessErpSyncQueue } from '@/lib/travelia-erp-sync-queue-roles'

const ADMIN_SYNC_ROLES: UserRole[] = [
  'ADMINISTRATOR',
  'ACCOUNTANT',
  'SUPERVISOR',
  'PARTNER_ADMIN',
  'TRAVELIA_ADMIN',
  'TECH_ADMIN',
  'OPERATIONS_MANAGER',
]

export type TraveliaSyncAuth =
  | { kind: 'service' }
  | { kind: 'session'; userId: string; role: UserRole }

/**
 * Autorise soit une clé machine `TRAVELIA_INTERNAL_SYNC_API_KEY`,
 * soit une session admin / finance / supervision.
 */
export async function assertTraveliaErpSyncAuth(request: Request): Promise<TraveliaSyncAuth | null> {
  const secret = process.env.TRAVELIA_INTERNAL_SYNC_API_KEY?.trim()
  const authHeader = request.headers.get('authorization') || ''
  if (secret && authHeader === `Bearer ${secret}`) {
    return { kind: 'service' }
  }

  const session = await getServerSession(authOptions)
  const role = session?.user?.role as UserRole | undefined
  if (session?.user?.id && role && ADMIN_SYNC_ROLES.includes(role)) {
    return { kind: 'session', userId: session.user.id, role }
  }

  return null
}

export async function assertTraveliaErpSyncQueueAuth(
  request: Request
): Promise<TraveliaSyncAuth | null> {
  const secret = process.env.TRAVELIA_INTERNAL_SYNC_API_KEY?.trim()
  const authHeader = request.headers.get('authorization') || ''
  if (secret && authHeader === `Bearer ${secret}`) {
    return { kind: 'service' }
  }

  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (session?.user?.id && role && userRoleCanAccessErpSyncQueue(role)) {
    return { kind: 'session', userId: session.user.id, role: role as UserRole }
  }

  return null
}

export function traveliaSyncUnauthorizedResponse() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}
