import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { createUserSchema, updateUserSchema } from '@/lib/schemas/user'
import { apiUnauthorized, apiForbidden, apiValidationError, apiServerError } from '@/lib/api-response'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

function normalizeRole(input: unknown): string {
  const r = typeof input === 'string' ? input.trim().toUpperCase() : ''
  const allowed = new Set([
    'CLIENT',
    'AGENT',
    'AGENCY_STAFF',
    'SUPER_AGENT',
    'PARTNER_ADMIN',
    'ADMINISTRATOR',
    'ACCOUNTANT',
    'SUPERVISOR',
    'LOGISTICS',
  ])
  return allowed.has(r) ? r : 'CLIENT'
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return apiUnauthorized()
    if (!isAdminRole(session.user.role)) return apiForbidden()

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const role = (searchParams.get('role') || '').trim().toUpperCase()
    const active = (searchParams.get('active') || '').trim().toLowerCase()
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') || 200)))

    // Build Prisma where clause directly — avoids JS-side N+1 filtering
    const where: Prisma.UserWhereInput = {}
    if (role && role !== 'ALL') where.role = normalizeRole(role)
    if (active === 'true') where.isActive = true
    if (active === 'false') where.isActive = false

    // SQLite has no case-insensitive mode, so we use OR across fields with contains
    if (q) {
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        referralCount: true,
        referralCredits: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        gender: true,
        birthDate: true,
        passportOrIdNumber: true,
        passportPhotoUrl: true,
        city: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { bookings: true, freightOrders: true } },
      },
    })

    const usersWithExtras = users.map((u) => ({
      ...u,
      partnerCompanyId: null,
      partnerCompany: null,
    }))

    return NextResponse.json({ users: usersWithExtras })
  } catch (error) {
    console.error('Admin users list error:', error)
    return apiServerError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return apiUnauthorized()
    if (!isAdminRole(session.user.role)) return apiForbidden()

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) return apiValidationError(parsed.error)

    const { firstName, lastName, email, phone, password, role } = parsed.data

    // Supplemental fields not in core schema
    const gender = typeof body?.gender === 'string' ? body.gender : null
    const birthDate =
      typeof body?.birthDate === 'string' && body.birthDate
        ? new Date(body.birthDate)
        : null
    const passportOrIdNumber =
      typeof body?.passportOrIdNumber === 'string' ? body.passportOrIdNumber : null
    const passportPhotoUrl =
      typeof body?.passportPhotoUrl === 'string' ? body.passportPhotoUrl : null
    const city = typeof body?.city === 'string' ? body.city : null

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role,
        isActive: true,
        gender,
        birthDate,
        passportOrIdNumber,
        passportPhotoUrl,
        city,
      },
      select: { id: true },
    })

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (error) {
    console.error('Admin user create error:', error)
    return apiServerError(error)
  }
}

