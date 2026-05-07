import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'

describe('Stats Endpoints', () => {
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
      const { statsRoutes } = await import('../src/modules/stats/stats.routes.js')
      await instance.register(authRoutes, { prefix: '/api/admin/auth' })
      await instance.register(statsRoutes, { prefix: '/api/admin/stats' })
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

  describe('GET /api/admin/stats', () => {
    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/stats',
      })
      expect(response.statusCode).toBe(401)
    })

    it('should return stats with totalQuestions, totalAttempts, averageScore, recentAttempts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/stats',
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('totalQuestions')
      expect(body).toHaveProperty('totalAttempts')
      expect(body).toHaveProperty('averageScore')
      expect(body).toHaveProperty('recentAttempts')
      expect(Array.isArray(body.recentAttempts)).toBe(true)
    })

    it('should have positive totalQuestions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/stats',
        cookies: { admin_token: token },
      })

      const body = JSON.parse(response.body)
      expect(body.totalQuestions).toBeGreaterThan(0)
    })
  })
})