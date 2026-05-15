import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Diagnostic prod (Dokploy) : DB + variables critiques. Ne pas exposer de secrets. */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {
    databaseUrl: {
      ok: Boolean(process.env.DATABASE_URL?.trim()),
      detail: process.env.DATABASE_URL ? 'définie' : 'manquante',
    },
    nextAuthUrl: {
      ok: Boolean(process.env.NEXTAUTH_URL?.trim()),
      detail: process.env.NEXTAUTH_URL ?? 'manquante',
    },
    nextAuthSecret: {
      ok: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
      detail: process.env.NEXTAUTH_SECRET ? 'définie' : 'manquante (sessions impossibles)',
    },
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { ok: true, detail: 'connexion OK' }

    const users = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `
    const hasUsersTable = Number(users[0]?.count ?? 0) > 0
    checks.usersTable = {
      ok: hasUsersTable,
      detail: hasUsersTable ? 'table public.users présente' : 'table public.users absente — lancer prisma db push',
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    checks.database = { ok: false, detail: msg.slice(0, 500) }
  }

  const ok = Object.values(checks).every((c) => c.ok)

  return NextResponse.json(
    { ok, checks, at: new Date().toISOString() },
    { status: ok ? 200 : 503 }
  )
}
