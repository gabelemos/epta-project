import { z } from 'zod'

export const normalizePlate = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

const currentYear = new Date().getFullYear()
const year = z.coerce.number().int().min(1900).max(currentYear + 1)

const optionalText = (max = 120) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

export const vehicleInputSchema = z.object({
  // Aceita placa antiga (ABC1234) e Mercosul (ABC1D23)
  plate: z
    .string()
    .transform(normalizePlate)
    .refine((v) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(v), 'Placa inválida'),
  renavam: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v.replace(/\D/g, '') : null))
    .refine((v) => v === null || /^\d{9,11}$/.test(v), 'RENAVAM inválido'),
  chassis: optionalText(17).transform((v) => (v ? v.toUpperCase() : null)),
  brand: z.string().trim().min(1, 'Marca é obrigatória').max(60),
  model: z.string().trim().min(1, 'Modelo é obrigatório').max(80),
  manufactureYear: year.optional().nullable().or(z.literal('').transform(() => null)),
  modelYear: year.optional().nullable().or(z.literal('').transform(() => null)),
  color: optionalText(40),
  fuel: optionalText(40),
  ownerName: optionalText(120),
  city: optionalText(80),
  state: optionalText(2).transform((v) => (v ? v.toUpperCase() : null)),
})

export type VehicleInput = z.infer<typeof vehicleInputSchema>

export const vehicleUpdateSchema = vehicleInputSchema
export const idParamsSchema = z.object({ id: z.string().uuid() })
export const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
})

export const vehicleResponseSchema = z.object({
  id: z.string(),
  plate: z.string(),
  renavam: z.string().nullable(),
  chassis: z.string().nullable(),
  brand: z.string(),
  model: z.string(),
  manufactureYear: z.number().nullable(),
  modelYear: z.number().nullable(),
  color: z.string().nullable(),
  fuel: z.string().nullable(),
  ownerName: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
