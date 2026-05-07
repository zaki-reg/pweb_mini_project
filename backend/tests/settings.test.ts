import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'

describe('Settings Endpoints', () => {
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
      const { settingsRoutes } = await import('../src/modules/settings/settings.routes.js')
      await instance.register(authRoutes, { prefix: '/api/admin/auth' })
      await instance.register(settingsRoutes, { prefix: '/api/admin/settings' })
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

  describe('GET /api/admin/settings', () => {
    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/settings',
      })
      expect(response.statusCode).toBe(401)
    })

    it('should return current settings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/settings',
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('numQuestions')
      expect(body).toHaveProperty('timerEnabled')
      expect(body).toHaveProperty('allowReview')
    })
  })

  describe('PUT /api/admin/settings', () => {
    it('should update settings', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/admin/settings',
        cookies: { admin_token: token },
        payload: {
          numQuestions: 20,
          timerEnabled: true,
          timerSeconds: 1800,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.numQuestions).toBe(20)
      expect(body.timerEnabled).toBe(true)
      expect(body.timerSeconds).toBe(1800)
    })

    it('should validate numQuestions range', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/admin/settings',
        cookies: { admin_token: token },
        payload: { numQuestions: 100 },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})