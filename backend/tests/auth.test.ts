import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'

describe('Auth Endpoints', () => {
  let app: Fastify.FastifyInstance

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

      instance.get('/health', async () => ({ status: 'ok' }))

      const { authRoutes } = await import('../src/modules/auth/auth.routes.js')
      await instance.register(authRoutes, { prefix: '/api/admin/auth' })
    })

    await fastify.ready()
    app = fastify
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/admin/auth/login', () => {
    it('should return 400 if email is invalid format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/auth/login',
        payload: {
          email: 'invalid-email',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Invalid input')
    })

    it('should return 401 if email does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Invalid credentials')
    })

    it('should return 401 if password is incorrect', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/auth/login',
        payload: {
          email: 'admin@quiz.com',
          password: 'wrong-password',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Invalid credentials')
    })

    it('should return admin info and set cookie on successful login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/auth/login',
        payload: {
          email: 'admin@quiz.com',
          password: 'admin1234',
        },
      })

      expect(response.statusCode).toBe(200)

      const cookies = response.cookies
      const adminTokenCookie = cookies.find(c => c.name === 'admin_token')
      expect(adminTokenCookie).toBeDefined()
      expect(adminTokenCookie?.httpOnly).toBe(true)
      expect(adminTokenCookie?.sameSite?.toLowerCase()).toBe('lax')

      const body = JSON.parse(response.body)
      expect(body.email).toBe('admin@quiz.com')
      expect(body.id).toBeDefined()
      expect(body.name).toBeDefined()
    })
  })

  describe('GET /api/admin/auth/me', () => {
    it('should return 401 if no cookie is present', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/auth/me',
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Authentication required')
    })

    it('should return 401 for invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/auth/me',
        cookies: {
          admin_token: 'invalid-token',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /api/admin/auth/logout', () => {
    it('should clear the admin_token cookie', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/auth/logout',
        cookies: {
          admin_token: 'some-token',
        },
      })

      expect(response.statusCode).toBe(200)

      const cookies = response.cookies
      const clearedCookie = cookies.find(c => c.name === 'admin_token')
      expect(clearedCookie).toBeDefined()
      expect(clearedCookie?.value).toBe('')
    })
  })
})