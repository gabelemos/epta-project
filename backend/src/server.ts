import { buildApp } from './app.js'
import { env } from './config/env.js'

const app = await buildApp()

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`Drivo API rodando em http://localhost:${env.PORT} (docs em /docs)`)
} catch (error) {
  console.error(error)
  process.exit(1)
}
