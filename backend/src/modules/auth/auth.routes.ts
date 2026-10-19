import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authResponseSchema, loginSchema, registerSchema } from './auth.schemas.js'
import { registerUser, validateCredentials } from './auth.service.js'

export async function authRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>()

  r.post(
    '/auth/register',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Cadastra um usuário',
        body: registerSchema,
        response: { 201: authResponseSchema },
      },
    },
    async (req, reply) => {
      const user = await registerUser(req.body)
      const token = app.jwt.sign({ sub: user.id, email: user.email })
      return reply.status(201).send({ token, user })
    },
  )

  r.post(
    '/auth/login',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Autentica e devolve o JWT',
        body: loginSchema,
        response: { 200: authResponseSchema },
      },
    },
    async (req) => {
      const user = await validateCredentials(req.body.email, req.body.password)
      const token = app.jwt.sign({ sub: user.id, email: user.email })
      return { token, user }
    },
  )
}
