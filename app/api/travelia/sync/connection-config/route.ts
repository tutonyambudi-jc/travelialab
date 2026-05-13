import { NextResponse } from 'next/server'
import {
  assertTraveliaErpSyncQueueAuth,
  traveliaSyncUnauthorizedResponse,
} from '@/app/modules/travelia/sync/erpSync.routes'
import { prisma } from '@/lib/prisma'
import {
  getTraveliaErpCredentials,
  probeTraveliaErpConnection,
  TRAVELIA_ERP_SETTING_API_KEY,
  TRAVELIA_ERP_SETTING_BASE_URL,
} from '@/lib/travelia-erp-runtime-config'

export async function GET(request: Request) {
  const auth = await assertTraveliaErpSyncQueueAuth(request)
  if (!auth) return traveliaSyncUnauthorizedResponse()

  const [dbBase, dbKey] = await Promise.all([
    prisma.setting.findUnique({ where: { key: TRAVELIA_ERP_SETTING_BASE_URL } }),
    prisma.setting.findUnique({ where: { key: TRAVELIA_ERP_SETTING_API_KEY } }),
  ])

  const envBase = process.env.ERP_BASE_URL?.trim() ?? ''
  const envHasKey = Boolean(process.env.ERP_API_KEY?.trim())
  const baseUrlForForm = dbBase !== null ? (dbBase.value?.trim() ?? '') : envBase
  const hasDatabaseApiKey = Boolean(dbKey?.value?.trim())
  const creds = await getTraveliaErpCredentials()

  return NextResponse.json({
    baseUrl: baseUrlForForm,
    hasDatabaseApiKey,
    hasEnvironmentApiKey: envHasKey,
    hasEffectiveCredentials: Boolean(creds.baseUrl && creds.apiKey),
  })
}

type Body = {
  baseUrl?: string
  /** Si absent ou vide : ne pas modifier la clé en base (sauf clearApiKey). */
  apiKey?: string
  /** true : supprimer la clé API en base pour réutiliser .env. */
  clearApiKey?: boolean
  /** true : tester avec baseUrl + apiKey du corps (apiKey optionnelle → clé actuelle). */
  test?: boolean
}

export async function POST(request: Request) {
  const auth = await assertTraveliaErpSyncQueueAuth(request)
  if (!auth) return traveliaSyncUnauthorizedResponse()

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  if (body.test === true) {
    const baseInput = typeof body.baseUrl === 'string' ? body.baseUrl.trim() : ''
    let keyInput = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
    if (!keyInput) {
      const creds = await getTraveliaErpCredentials()
      keyInput = creds.apiKey ?? ''
    }
    const result = await probeTraveliaErpConnection(baseInput, keyInput)
    return NextResponse.json(result)
  }

  if (body.clearApiKey === true) {
    await prisma.setting.deleteMany({ where: { key: TRAVELIA_ERP_SETTING_API_KEY } })
  }

  const baseUrl = typeof body.baseUrl === 'string' ? body.baseUrl.trim() : ''
  await prisma.setting.upsert({
    where: { key: TRAVELIA_ERP_SETTING_BASE_URL },
    create: { key: TRAVELIA_ERP_SETTING_BASE_URL, value: baseUrl },
    update: { value: baseUrl },
  })

  if (body.clearApiKey !== true && typeof body.apiKey === 'string') {
    const trimmed = body.apiKey.trim()
    if (trimmed.length > 0) {
      await prisma.setting.upsert({
        where: { key: TRAVELIA_ERP_SETTING_API_KEY },
        create: { key: TRAVELIA_ERP_SETTING_API_KEY, value: trimmed },
        update: { value: trimmed },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
