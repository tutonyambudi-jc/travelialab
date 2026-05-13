import type { UserRole } from '@/lib/auth'

/**
 * Rôles autorisés pour la file d’attente sync ERP (UI + routes status / retry).
 * Inclut les rôles « admin général » déjà autorisés sur `/admin` pour éviter un menu vide
 * pour les comptes ADMINISTRATOR / SUPERVISOR.
 */
export const TRAVELIA_ERP_SYNC_QUEUE_ROLES: UserRole[] = [
  'ADMINISTRATOR',
  'SUPERVISOR',
  'TRAVELIA_ADMIN',
  'TECH_ADMIN',
  'OPERATIONS_MANAGER',
]

const ROLE_SET = new Set(TRAVELIA_ERP_SYNC_QUEUE_ROLES.map((r) => r.toUpperCase()))

/** Compare au catalogue en majuscules (tolère la casse en base). */
export function userRoleCanAccessErpSyncQueue(role: string | undefined | null): boolean {
  if (!role || typeof role !== 'string') return false
  return ROLE_SET.has(role.trim().toUpperCase())
}
