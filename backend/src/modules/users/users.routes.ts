import bcrypt from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { AppError, conflict, notFound } from '../../lib/errors.js'
import { userResponseSchema } from '../auth/auth.schemas.js'

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().toLowerCase().email('E-mail inválido').optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'A nova senha deve ter ao menos 6 caracteres').max(72).optional(),
  })
  .refine((v) => !v.newPassword || !!v.currentPassword, {
    message: 'Informe a senha atual para definir uma nova',
    path: ['currentPassword'],
  })

export async function usersRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const common = { tags: ['Usuário'], security: [{ bearerAuth: [] }] }

  r.get(
    '/me',
    { onRequest: [app.authenticate], schema: { ...common, summary: 'Dados do usuário logado', response: { 200: userResponseSchema } } },
    async (req) => {
      const user = await prisma.user.findUnique({ where: { id: req.user.sub } })
      if (!user) throw notFound('Usuário')
      return { id: user.id, name: user.name, email: user.email }
    },
  )

  r.patch(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: { ...common, summary: 'Altera dados cadastrais', body: updateProfileSchema, response: { 200: userResponseSchema } },
    },
    async (req) => {
      const { name, email, currentPassword, newPassword } = req.body
      const user = await prisma.user.findUnique({ where: { id: req.user.sub } })
      if (!user) throw notFound('Usuário')

      const data: { name?: string; email?: string; passwordHash?: string } = {}
      if (name) data.name = name

      if (email && email !== user.email) {
        const taken = await prisma.user.findUnique({ where: { email } })
        if (taken) throw conflict('E-mail já cadastrado')
        data.email = email
      }

      if (newPassword) {
        const ok = await bcrypt.compare(currentPassword!, user.passwordHash)
        if (!ok) throw new AppError(400, 'Senha atual incorreta', 'INVALID_PASSWORD')
        data.passwordHash = await bcrypt.hash(newPassword, 10)
      }

      const updated = await prisma.user.update({ where: { id: user.id }, data })
      return { id: updated.id, name: updated.name, email: updated.email }
    },
  )
}
