import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../src/app.js'

// Evita instanciar o PrismaClient: estes testes não tocam no banco.
vi.mock('../src/lib/prisma.js', () => ({ prisma: {} }))

// Testes que não dependem de banco: healthcheck, proteção de rotas e validação de entrada.
let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})
afterAll(() => app.close())

describe('API', () => {
  it('GET /health responde ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('rotas protegidas exigem JWT', async () => {
    for (const [method, url] of [
      ['GET', '/vehicles'],
      ['POST', '/vehicles'],
      ['GET', '/me'],
      ['POST', '/crlv/scan'],
    ] as const) {
      const res = await app.inject({ method, url })
      expect(res.statusCode, `${method} ${url}`).toBe(401)
    }
  })

  it('register valida o corpo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { name: 'A', email: 'invalido', password: '1' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().code).toBe('VALIDATION_ERROR')
  })

  it('valida criação de veículo com token válido', async () => {
    const token = app.jwt.sign({ sub: 'user-1', email: 'a@a.com' })
    const res = await app.inject({
      method: 'POST',
      url: '/vehicles',
      headers: { authorization: `Bearer ${token}` },
      payload: { plate: 'xx', brand: '', model: '' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('expõe o documento OpenAPI', async () => {
    const res = await app.inject({ method: 'GET', url: '/docs/json' })
    expect(res.statusCode).toBe(200)
    expect(Object.keys(res.json().paths)).toContain('/crlv/scan')
  })
})
