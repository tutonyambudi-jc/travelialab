import { z } from 'zod'

export const createFreightSchema = z.object({
  tripId: z.string({ required_error: 'ID de trajet requis' }).min(1),
  senderName: z
    .string({ required_error: 'Nom de l\'expéditeur requis' })
    .min(2, 'Nom de l\'expéditeur trop court')
    .max(100)
    .trim(),
  senderPhone: z
    .string({ required_error: 'Téléphone de l\'expéditeur requis' })
    .min(8)
    .max(20),
  receiverName: z
    .string({ required_error: 'Nom du destinataire requis' })
    .min(2, 'Nom du destinataire trop court')
    .max(100)
    .trim(),
  receiverPhone: z
    .string({ required_error: 'Téléphone du destinataire requis' })
    .min(8)
    .max(20),
  weight: z.coerce
    .number({ required_error: 'Poids requis', invalid_type_error: 'Le poids doit être un nombre' })
    .positive('Le poids doit être supérieur à 0')
    .max(10_000, 'Poids maximum: 10 000 kg'),
  type: z.string().max(50).optional(),
  value: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  agentId: z.string().optional(),
  originStopId: z.string().optional(),
  destinationStopId: z.string().optional(),
})

export const freightStatusSchema = z.object({
  status: z.enum(
    ['RECEIVED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'RETURNED', 'LOST'],
    { invalid_type_error: 'Statut invalide' }
  ),
  notes: z.string().max(500).optional(),
})
