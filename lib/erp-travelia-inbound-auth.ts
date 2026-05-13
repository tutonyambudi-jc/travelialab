import { ERP_TRAVELIA_SCOPES, assertErpTraveliaScopes, getErpTraveliaKeyScopes } from '@/lib/erp-travelia-scopes'

const BEARER = /^Bearer\s+(.+)$/i

export type ErpInboundAuth = {
  token: string
  scopes: Set<string>
}

/**
 * Vérifie la clé API partagée (Travelia → ERP) et retourne les scopes associés à la clé.
 * La clé attendue est `ERP_API_KEY` (même valeur configurée dans Travelia pour appeler l’ERP).
 */
export function authenticateErpTraveliaRequest(request: Request): ErpInboundAuth {
  const expected = process.env.ERP_API_KEY?.trim()
  if (!expected) {
    const err = new Error('ERP_API_KEY non configurée')
    ;(err as Error & { status?: number }).status = 503
    throw err
  }

  const header = request.headers.get('authorization') || ''
  const m = header.match(BEARER)
  const token = m?.[1]?.trim()
  if (!token || token !== expected) {
    const err = new Error('Non autorisé')
    ;(err as Error & { status?: number }).status = 401
    throw err
  }

  return { token, scopes: getErpTraveliaKeyScopes() }
}

export function requireErpTraveliaScopes(auth: ErpInboundAuth, required: string[]) {
  assertErpTraveliaScopes(required, auth.scopes)
}
