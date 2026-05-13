import { z } from 'zod'

export const processPaymentSchema = z.object({
  method: z.enum(['CASH', 'ONLINE', 'MOBILE_MONEY'], {
    required_error: 'Méthode de paiement requise',
    invalid_type_error: 'Méthode de paiement invalide',
  }),
  currency: z.enum(['FC', 'USD']).optional().default('FC'),
  notes: z.string().max(500).optional(),
})

export const groupPaymentSchema = z.object({
  method: z.enum(['CASH', 'ONLINE', 'MOBILE_MONEY'], {
    required_error: 'Méthode de paiement requise',
  }),
  currency: z.enum(['FC', 'USD']).optional().default('FC'),
})
