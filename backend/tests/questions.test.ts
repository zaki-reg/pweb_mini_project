import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'

describe('Questions Endpoints', () => {
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
      const { questionsRoutes } = await import('../src/modules/questions/questions.routes.js')
      await instance.register(authRoutes, { prefix: '/api/admin/auth' })
      await instance.register(questionsRoutes, { prefix: '/api/admin/questions' })
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

  describe('GET /api/admin/questions', () => {
    it('should return 401 without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/questions',
      })
      expect(response.statusCode).toBe(401)
    })

    it('should return paginated list of questions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/questions?page=1&limit=5',
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('page')
      expect(body).toHaveProperty('limit')
    })

    it('should filter by type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/questions?type=SCQ',
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      body.data.forEach((q: any) => expect(q.type).toBe('SCQ'))
    })
  })

  describe('GET /api/admin/questions/:id', () => {
    it('should return a single question with answers', async () => {
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/admin/questions?limit=1',
        cookies: { admin_token: token },
      })
      const questions = JSON.parse(listRes.body).data
      const questionId = questions[0].id

      const response = await app.inject({
        method: 'GET',
        url: `/api/admin/questions/${questionId}`,
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('answers')
      expect(Array.isArray(body.answers)).toBe(true)
    })
  })

  describe('POST /api/admin/questions', () => {
    it('should create a SCQ with exactly 1 correct answer', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/questions',
        cookies: { admin_token: token },
        payload: {
          body: 'What is the capital of Germany?',
          type: 'SCQ',
          difficulty: 'EASY',
          answers: [
            { body: 'Berlin', isCorrect: true },
            { body: 'Munich', isCorrect: false },
            { body: 'Hamburg', isCorrect: false },
          ],
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.type).toBe('SCQ')
    })

    it('should create an MCQ with at least 1 correct answer', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/questions',
        cookies: { admin_token: token },
        payload: {
          body: 'Which are European countries?',
          type: 'MCQ',
          difficulty: 'MEDIUM',
          answers: [
            { body: 'France', isCorrect: true },
            { body: 'Japan', isCorrect: false },
            { body: 'Germany', isCorrect: true },
          ],
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.type).toBe('MCQ')
    })

    it('should reject SCQ with 0 correct answers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/questions',
        cookies: { admin_token: token },
        payload: {
          body: 'Test question',
          type: 'SCQ',
          answers: [
            { body: 'Answer 1', isCorrect: false },
            { body: 'Answer 2', isCorrect: false },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject SCQ with 2 correct answers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/questions',
        cookies: { admin_token: token },
        payload: {
          body: 'Test question',
          type: 'SCQ',
          answers: [
            { body: 'Answer 1', isCorrect: true },
            { body: 'Answer 2', isCorrect: true },
          ],
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('DELETE /api/admin/questions/:id', () => {
    it('should delete a question', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/admin/questions',
        cookies: { admin_token: token },
        payload: {
          body: 'Delete me test question',
          type: 'SCQ',
          answers: [
            { body: 'Yes', isCorrect: true },
            { body: 'No', isCorrect: false },
          ],
        },
      })
      const questionId = JSON.parse(createRes.body).id

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/admin/questions/${questionId}`,
        cookies: { admin_token: token },
      })

      expect(response.statusCode).toBe(204)
    })
  })
})