import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { registerSchema } from '@/lib/schemas/user'
import { apiValidationError, apiError, apiServerError } from '@/lib/api-response'

function makeReferralCode(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  return `AR-${timestamp}-${random}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate with Zod
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return apiValidationError(parsed.error)
    }

    const { firstName, lastName, email, phone, password, referralCode } = parsed.data
    const referralCodeInput =
      typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : ''

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return apiError('Cet email est déjà utilisé', 400)
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 10)

    // Parrainage (optionnel)
    const REFERRER_BONUS_FC = 500
    const NEW_USER_BONUS_FC = 500

    const created = await prisma.$transaction(async (tx) => {
      let referrerId: string | undefined

      if (referralCodeInput) {
        const referrer = await tx.user.findFirst({
          where: { referralCode: referralCodeInput },
          select: { id: true },
        })
        if (!referrer) {
          return { error: 'Code de parrainage invalide' as const }
        }
        referrerId = referrer.id
      }

      const newUserReferralCode = await (async () => {
        for (let i = 0; i < 10; i++) {
          const code = makeReferralCode()
          const exists = await tx.user.findFirst({
            where: { referralCode: code },
            select: { id: true },
          })
          if (!exists) return code
        }
        return `AR-${crypto.randomUUID().split('-')[0].toUpperCase()}`
      })()

      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          password: hashedPassword,
          role: 'CLIENT',
          referralCode: newUserReferralCode,
          referredById: referrerId ?? null,
          referralCredits: referralCodeInput ? NEW_USER_BONUS_FC : 0,
        },
        select: { id: true },
      })

      if (referrerId) {
        await tx.user.update({
          where: { id: referrerId },
          data: {
            referralCredits: { increment: REFERRER_BONUS_FC },
            referralCount: { increment: 1 },
          },
        })
      }

      return { userId: user.id }
    })

    if ('error' in created) {
      return apiError(created.error || 'Code de parrainage invalide', 400)
    }

    return NextResponse.json(
      { message: 'Compte créé avec succès', userId: created.userId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return apiServerError(error)
  }
}
