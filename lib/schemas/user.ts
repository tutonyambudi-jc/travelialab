import { z } from 'zod'
import { emailSchema, phoneE164Schema } from './common'

export const registerSchema = z.object({
  firstName: z
    .string({ required_error: 'Prénom requis' })
    .min(2, 'Prénom trop court')
    .max(50, 'Prénom trop long')
    .trim(),
  lastName: z
    .string({ required_error: 'Nom requis' })
    .min(2, 'Nom trop court')
    .max(50, 'Nom trop long')
    .trim(),
  email: emailSchema,
  password: z
    .string({ required_error: 'Mot de passe requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long'),
  phone: z.string().max(20).optional(),
  referralCode: z.string().max(20).optional(),
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim().optional(),
  phone: phoneE164Schema,
  gender: z.enum(['M', 'F', 'OTHER']).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional(),
  city: z.string().max(100).optional(),
  passportOrIdNumber: z.string().max(50).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long'),
})

const ALLOWED_ROLES = [
  'CLIENT',
  'AGENT',
  'AGENCY_STAFF',
  'SUPER_AGENT',
  'PARTNER_ADMIN',
  'ADMINISTRATOR',
  'ACCOUNTANT',
  'SUPERVISOR',
  'LOGISTICS',
] as const

export const createUserSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  email: emailSchema,
  password: z.string().min(8).max(128),
  phone: z.string().max(20).optional(),
  role: z.enum(ALLOWED_ROLES).default('CLIENT'),
})

export const updateUserSchema = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim().optional(),
  gender: z.enum(['M', 'F', 'OTHER']).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide')
    .optional(),
  city: z.string().max(100).optional(),
  passportOrIdNumber: z.string().max(50).optional(),
  passportPhotoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
})
