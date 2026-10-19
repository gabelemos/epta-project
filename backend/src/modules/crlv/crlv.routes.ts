import type { FastifyInstance } from 'fastify'
import { AppError } from '../../lib/errors.js'
import { ACCEPTED_MIME_TYPES, extractCrlv } from './gemini.service.js'

export async function crlvRoutes(app: FastifyInstance) {
  app.post(
    '/crlv/scan',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['CRLV'],
        summary: 'Envia um CRLV (PDF/imagem) e devolve os dados extraídos pelo Gemini',
        description:
          'Multipart com o campo `file` (PDF, JPG, PNG ou WEBP, até 8MB). Não grava nada: devolve os dados para o usuário revisar antes de criar o veículo.',
        consumes: ['multipart/form-data'],
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const file = await req.file()
      if (!file) throw new AppError(400, 'Envie o arquivo no campo "file"', 'FILE_REQUIRED')
      if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
        throw new AppError(415, 'Formato não suportado. Envie PDF, JPG, PNG ou WEBP.', 'UNSUPPORTED_MEDIA')
      }

      const buffer = await file.toBuffer() // lança erro se passar do limite configurado
      return { data: await extractCrlv(buffer, file.mimetype) }
    },
  )
}
