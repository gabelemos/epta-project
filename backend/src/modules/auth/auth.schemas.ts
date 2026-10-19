import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(100),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres').max(72),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

export const authResponseSchema = z.object({
  token: z.string(),
  user: userResponseSchema,
})
