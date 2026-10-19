import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from './config/env.js'
import { AppError } from './lib/errors.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { crlvRoutes } from './modules/crlv/crlv.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { vehiclesRoutes } from './modules/vehicles/vehicles.routes.js'

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export async function buildApp() {
  const app = Fastify({ logger: env.NODE_ENV === 'development' })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: env.JWT_EXPIRES_IN } })
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } })

  await app.register(swagger, {
    openapi: {
      info: { title: 'Drivo API', description: 'API da garagem inteligente Drivo', version: '1.0.0' },
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  app.decorate('authenticate', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Token ausente ou inválido' })
    }
  })

  app.setErrorHandler((error, _req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        issues: error.validation.map((v) => ({
          field: v.instancePath.replace(/^\//, '').replace(/\//g, '.'),
          message: v.message,
        })),
      })
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ code: error.code, message: error.message })
    }
    const e = error as { code?: string; statusCode?: number }
    if (e.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({ code: 'FILE_TOO_LARGE', message: 'Arquivo maior que 8MB' })
    }
    if (e.statusCode && e.statusCode < 500) {
      return reply.status(e.statusCode).send({ code: 'BAD_REQUEST', message: (error as Error).message })
    }
    app.log.error(error)
    return reply.status(500).send({ code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' })
  })

  app.get('/health', { schema: { tags: ['Infra'], summary: 'Healthcheck' } }, async () => ({ status: 'ok' }))

  await app.register(authRoutes)
  await app.register(usersRoutes)
  await app.register(vehiclesRoutes)
  await app.register(crlvRoutes)

  return app
}
