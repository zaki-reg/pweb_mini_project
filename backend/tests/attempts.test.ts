import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'

describe('Attempts Endpoints', () => {
  let app: Fastify.FastifyInstance
  let token: string

  beforeAll(async () => {
    const fastify = Fastify({ logger: false })

    await fastify.register(async (instance) => {
      await instance.register(await import('@fastify/cors'), {
        origin: 'http://localhost:3000',
        credentials: true,
      })
      await instance.register(await import('@fastify/cookie'))
      await instance.register(await import('@fastify/jwt'), {
        secret: 'test-secret-key-for-testing',
        cookie: {
          cookieName: 'admin_token',
          signed: false,
        },
      })

      const { authRoutes } = await import('../src/modules/auth/auth.routes.js')
      const { attemptsRoutes } = await import('../src/modules/attempts/attempts.routes.js')
      await instance.register(authRoutes, { prefix: '/api/admin/auth' })
      await instance.register(attemptsRoutes, { prefix: '/api/admin/attempts' })
    })

    await fastify.ready()
    app = fastify

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/login',
      payload: { email: 'admin@quiz.com', password: 'admin1234' },
    })
    const cookie = loginRes.cookies.find(c => c.name === 'admin_token')
    token = cookie?.value || ''
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /api/admin/attempts', () => {
    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/attempts',
      })
      expect(response.statusCode).toBe(401)
    })

    it('should return paginated list of attempts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/attempts?page=1&limit=10',
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('page')
    })

    it('should return empty array when no submitted sessions exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/attempts',
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body.data)).toBe(true)
    })
  })

  describe('GET /api/admin/attempts/:id', () => {
    it('should return 404 for non-existent attempt', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/attempts/non-existent-id',
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(404)
    })
  })
})