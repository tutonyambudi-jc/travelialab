export const ERP_TRAVELIA_SCOPES = {
  BOOKINGS_WRITE: 'erp.travelia.bookings.write',
  PAYMENTS_WRITE: 'erp.travelia.payments.write',
  COMMISSIONS_WRITE: 'erp.travelia.commissions.write',
  STATUS_READ: 'erp.travelia.status.read',
} as const

const ALL_SCOPES = Object.values(ERP_TRAVELIA_SCOPES)

export function getErpTraveliaKeyScopes(): Set<string> {
  const raw = process.env.ERP_TRAVELIA_KEY_SCOPES?.trim()
  if (!raw || raw === '*') {
    return new Set(ALL_SCOPES)
  }
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

export function assertErpTraveliaScopes(required: string[], granted: Set<string>): void {
  const missing = required.filter((s) => !granted.has(s))
  if (missing.length > 0) {
    const err = new Error(`Scopes ERP manquants: ${missing.join(', ')}`)
    ;(err as Error & { status?: number }).status = 403
    throw err
  }
}
