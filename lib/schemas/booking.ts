import { z } from 'zod'

/** E.164 phone number pattern */
const E164_REGEX = /^\+[1-9]\d{6,14}$/

const passengerTypeSchema = z.enum(
  ['ADULT', 'CHILD', 'INFANT', 'SENIOR', 'STUDENT', 'DISABLED'],
  { invalid_type_error: 'Type de passager invalide' }
)

const singlePassengerSchema = z.object({
  seatId: z.string().min(1, 'ID de siège requis'),
  passengerName: z
    .string({ required_error: 'Nom du passager requis' })
    .min(2, 'Nom du passager trop court')
    .max(100, 'Nom du passager trop long')
    .trim(),
  passengerGender: z.enum(['M', 'F', 'OTHER']).optional(),
  passengerAddress: z.string().max(200).optional(),
  passengerPhone: z
    .string()
    .regex(E164_REGEX, 'Numéro de téléphone invalide (format attendu: +243XXXXXXXXX)')
    .optional(),
  passengerEmail: z.string().email('Email invalide').optional(),
  passengerType: passengerTypeSchema.optional().default('ADULT'),
  passengerAge: z.number().int().min(0).max(120).optional(),
  hasDisability: z.boolean().optional().default(false),
  boardingStopId: z.string().optional(),
  alightingStopId: z.string().optional(),
  extraBaggagePieces: z.number().int().min(0).max(10).optional().default(0),
  extraBaggageOverweightKg: z.number().min(0).max(100).optional().default(0),
})

export const createBookingSchema = z.object({
  tripId: z.string({ required_error: 'ID de trajet requis' }).min(1),
  agentId: z.string().optional(),
  passengers: z.array(singlePassengerSchema).min(1, 'Au moins un passager requis').max(50),
})

/** Single-passenger shorthand schema (flattened form) */
export const createSingleBookingSchema = z
  .object({
    tripId: z.string().min(1, 'ID de trajet requis'),
    seatId: z.string().min(1, 'ID de siège requis'),
    passengerName: z.string().min(2).max(100).trim(),
    passengerGender: z.enum(['M', 'F', 'OTHER']).optional(),
    passengerAddress: z.string().max(200).optional(),
    passengerPhone: z
      .string()
      .regex(E164_REGEX, 'Numéro de téléphone invalide')
      .optional(),
    passengerEmail: z.string().email().optional(),
    passengerType: passengerTypeSchema.optional().default('ADULT'),
    passengerAge: z.number().int().min(0).max(120).optional(),
    hasDisability: z.boolean().optional().default(false),
    boardingStopId: z.string().optional(),
    alightingStopId: z.string().optional(),
    agentId: z.string().optional(),
  })
  .transform((data) => ({
    tripId: data.tripId,
    agentId: data.agentId,
    passengers: [
      {
        seatId: data.seatId,
        passengerName: data.passengerName,
        passengerGender: data.passengerGender,
        passengerAddress: data.passengerAddress,
        passengerPhone: data.passengerPhone,
        passengerEmail: data.passengerEmail,
        passengerType: data.passengerType ?? 'ADULT',
        passengerAge: data.passengerAge,
        hasDisability: data.hasDisability ?? false,
        boardingStopId: data.boardingStopId,
        alightingStopId: data.alightingStopId,
        extraBaggagePieces: 0,
        extraBaggageOverweightKg: 0,
      },
    ],
  }))
