import { prisma } from '@/lib/prisma'

export const TRAVELIA_ERP_SETTING_BASE_URL = 'travelia_erp_base_url'
export const TRAVELIA_ERP_SETTING_API_KEY = 'travelia_erp_api_key'

function normalizeBase(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  return t.replace(/\/$/, '')
}

/** URL + clé utilisés par les appels ERP : base de données si renseignés, sinon `.env`. */
export async function getTraveliaErpCredentials(): Promise<{ baseUrl: string | null; apiKey: string | null }> {
  const [dbBase, dbKey] = await Promise.all([
    prisma.setting.findUnique({ where: { key: TRAVELIA_ERP_SETTING_BASE_URL } }),
    prisma.setting.findUnique({ where: { key: TRAVELIA_ERP_SETTING_API_KEY } }),
  ])
  const baseFromDb = dbBase?.value?.trim()
  const keyFromDb = dbKey?.value?.trim()
  const baseUrl =
    normalizeBase(baseFromDb ?? '') ?? normalizeBase(process.env.ERP_BASE_URL?.trim() ?? '') ?? null
  const apiKey = (keyFromDb || process.env.ERP_API_KEY?.trim() || '') || null
  return { baseUrl, apiKey }
}

export async function probeTraveliaErpConnection(
  baseUrl: string,
  apiKey: string
): Promise<{ ok: boolean; detail: string; httpStatus?: number }> {
  const base = normalizeBase(baseUrl)
  if (!base) return { ok: false, detail: 'URL de base invalide ou vide' }
  const key = apiKey.trim()
  if (!key) return { ok: false, detail: 'Clé API requise pour le test' }

  const url = `${base}/api/erp/integrations/travelia/bookings`
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12_000),
    })
    const httpStatus = res.status
    if (httpStatus === 404) {
      return {
        ok: false,
        httpStatus,
        detail: 'URL de base incorrecte ou route ERP introuvable (HTTP 404).',
      }
    }
    if (httpStatus === 405 || httpStatus === 400 || httpStatus === 401 || httpStatus === 403) {
      return {
        ok: true,
        httpStatus,
        detail:
          httpStatus === 401 || httpStatus === 403
            ? `Serveur joignable mais accès refusé (HTTP ${httpStatus}) — vérifiez la clé API.`
            : `Serveur joignable (HTTP ${httpStatus}).`,
      }
    }
    if (httpStatus >= 200 && httpStatus < 500) {
      return { ok: true, httpStatus, detail: `Réponse HTTP ${httpStatus}.` }
    }
    return { ok: false, httpStatus, detail: `Erreur serveur ERP (HTTP ${httpStatus}).` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, detail: msg.includes('aborted') ? 'Délai dépassé' : msg }
  }
}
