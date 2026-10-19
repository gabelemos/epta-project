import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  idParamsSchema,
  listQuerySchema,
  vehicleInputSchema,
  vehicleResponseSchema,
  vehicleUpdateSchema,
} from './vehicles.schemas.js'
import * as service from './vehicles.service.js'

export async function vehiclesRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>()
  const common = { tags: ['Veículos'], security: [{ bearerAuth: [] }], onRequest: [app.authenticate] }

  r.get(
    '/vehicles',
    {
      ...common,
      schema: {
        ...common,
        summary: 'Lista (e pesquisa) os veículos do usuário',
        querystring: listQuerySchema,
        response: {
          200: z.object({
            items: z.array(vehicleResponseSchema),
            total: z.number(),
            page: z.number(),
            pageSize: z.number(),
          }),
        },
      },
    },
    (req) => service.listVehicles(req.user.sub, req.query),
  )

  r.get(
    '/vehicles/:id',
    {
      ...common,
      schema: { ...common, summary: 'Detalha um veículo', params: idParamsSchema, response: { 200: vehicleResponseSchema } },
    },
    (req) => service.getVehicle(req.user.sub, req.params.id),
  )

  r.post(
    '/vehicles',
    {
      ...common,
      schema: { ...common, summary: 'Cria um veículo', body: vehicleInputSchema, response: { 201: vehicleResponseSchema } },
    },
    async (req, reply) => reply.status(201).send(await service.createVehicle(req.user.sub, req.body)),
  )

  r.put(
    '/vehicles/:id',
    {
      ...common,
      schema: {
        ...common,
        summary: 'Edita um veículo',
        params: idParamsSchema,
        body: vehicleUpdateSchema,
        response: { 200: vehicleResponseSchema },
      },
    },
    (req) => service.updateVehicle(req.user.sub, req.params.id, req.body),
  )

  r.delete(
    '/vehicles/:id',
    { ...common, schema: { ...common, summary: 'Exclui um veículo', params: idParamsSchema } },
    async (req, reply) => {
      await service.deleteVehicle(req.user.sub, req.params.id)
      return reply.status(204).send()
    },
  )
}
