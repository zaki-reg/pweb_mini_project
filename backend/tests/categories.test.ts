import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'

describe('Categories Endpoints', () => {
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
      const { categoriesRoutes } = await import('../src/modules/categories/categories.routes.js')
      await instance.register(authRoutes, { prefix: '/api/admin/auth' })
      await instance.register(categoriesRoutes, { prefix: '/api/admin/categories' })
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

  describe('GET /api/admin/categories', () => {
    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/categories',
      })
      expect(response.statusCode).toBe(401)
    })

    it('should return list of categories with question counts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/categories',
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body[0]).toHaveProperty('_count')
    })
  })

  describe('POST /api/admin/categories', () => {
    it('should create a new category', async () => {
      const uniqueName = `Test Category ${Date.now()}`
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/categories',
        cookies: { admin_token: token },
        payload: { name: uniqueName },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe(uniqueName)
      expect(body.slug).toBe(uniqueName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    })

    it('should return 409 for duplicate category name', async () => {
      const uniqueName = `Test Category Duplicate ${Date.now()}`
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/admin/categories',
        cookies: { admin_token: token },
        payload: { name: uniqueName },
      })
      expect(createRes.statusCode).toBe(200)

      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/categories',
        cookies: { admin_token: token },
        payload: { name: uniqueName },
      })
    })
  })

describe('PUT /api/admin/categories/:id', () => {
    it('should update a category', async () => {
      const uniqueName = `Update Test Category ${Date.now()}`
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/admin/categories',
        cookies: { admin_token: token },
        payload: { name: uniqueName },
      })
      const categoryId = JSON.parse(createRes.body).id

      const newName = `Updated ${Date.now()}`
      const response = await app.inject({
        method: 'PUT',
        url: `/api/admin/categories/${categoryId}`,
        cookies: { admin_token: token },
        payload: { name: newName },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe(newName)
    })
  })

  describe('DELETE /api/admin/categories/:id', () => {
    it('should return 409 if category has questions', async () => {
      const categoriesRes = await app.inject({
        method: 'GET',
        url: '/api/admin/categories',
        cookies: { admin_token: token },
      })
      const categories = JSON.parse(categoriesRes.body)
      const catWithQuestions = categories.find((c: any) => c._count > 0)

      if (catWithQuestions) {
        const response = await app.inject({
          method: 'DELETE',
          url: `/api/admin/categories/${catWithQuestions.id}`,
          cookies: { admin_token: token },
        })
        expect(response.statusCode).toBe(409)
        expect(JSON.parse(response.body).error).toBe('Cannot delete category with existing questions')
      }
    })

    it('should delete category with no questions', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/admin/categories',
        cookies: { admin_token: token },
        payload: { name: 'Delete Me Category' },
      })
      const categoryId = JSON.parse(createRes.body).id

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/admin/categories/${categoryId}`,
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(204)
    })
  })
})