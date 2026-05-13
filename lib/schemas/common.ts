import { z } from 'zod'

/** RFC 5322-compatible email format */
export const emailSchema = z
  .string({ required_error: 'Email requis' })
  .email('Adresse email invalide')
  .max(254, 'Adresse email trop longue')

/** E.164 international phone number */
export const phoneE164Schema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Numéro de téléphone invalide (format attendu: +243XXXXXXXXX)')
  .optional()

/** Optional phone that may need normalizing before validation */
export const rawPhoneSchema = z
  .string()
  .max(20, 'Numéro de téléphone trop long')
  .optional()

/** Pagination query params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
})

/** Generic MongoDB/Prisma-style cuid/uuid id */
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID requis'),
})

/** Date string in YYYY-MM-DD format */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')

/** ISO 8601 datetime string */
export const isoDateTimeSchema = z
  .string()
  .datetime({ message: 'Format de date/heure invalide (ISO 8601 requis)' })
