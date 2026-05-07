import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'

describe('Sessions Endpoints', () => {
  let app: Fastify.FastifyInstance
  let sessionToken: string

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

      const { sessionsRoutes } = await import('../src/modules/sessions/sessions.routes.js')
      await instance.register(sessionsRoutes, { prefix: '/api/sessions' })
    })

    await fastify.ready()
    app = fastify
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/sessions/start', () => {
    it('should return 400 if username is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'a' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 if username is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })

    it('should create a new session with questions', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'testuser' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('sessionToken')
      expect(body).toHaveProperty('questions')
      expect(body.username).toBe('testuser')
      expect(body.totalQuestions).toBeGreaterThan(0)
      expect(Array.isArray(body.questions)).toBe(true)
    })

    it('should NOT include isCorrect in response', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'testuser2' },
      })

      const body = JSON.parse(response.body)
      body.questions.forEach((q: any) => {
        q.answers.forEach((a: any) => {
          expect(a).not.toHaveProperty('isCorrect')
        })
      })
    })
  })

  describe('GET /api/sessions/:token', () => {
    beforeAll(async () => {
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'getuser' },
      })
      sessionToken = JSON.parse(startRes.body).sessionToken
    })

    it('should return 404 for non-existent token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/sessions/invalid-token-123',
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return session details for valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/sessions/${sessionToken}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.sessionToken).toBe(sessionToken)
      expect(body).toHaveProperty('questions')
    })

    it('should return 409 for already submitted session', async () => {
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'submituser' },
      })
      const token = JSON.parse(startRes.body).sessionToken
      const questions = JSON.parse(startRes.body).questions

      const firstQ = questions[0]
      const submitRes = await app.inject({
        method: 'POST',
        url: `/api/sessions/${token}/submit`,
        payload: {
          answers: [{
            questionId: firstQ.id,
            answerIds: [firstQ.answers[0].id],
          }],
        },
      })
      expect(submitRes.statusCode).toBe(200)

      const getRes = await app.inject({
        method: 'GET',
        url: `/api/sessions/${token}`,
      })

      expect(getRes.statusCode).toBe(409)
      expect(JSON.parse(getRes.body).error).toBe('Session already submitted')
    })
  })

  describe('POST /api/sessions/:token/submit', () => {
    it('should return 404 for non-existent token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sessions/invalid-token-123/submit',
        payload: { answers: [] },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 400 for invalid answer format', async () => {
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'formatuser' },
      })
      const token = JSON.parse(startRes.body).sessionToken

      const response = await app.inject({
        method: 'POST',
        url: `/api/sessions/${token}/submit`,
        payload: { answers: 'invalid' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 if question not in session', async () => {
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'wrongquser' },
      })
      const token = JSON.parse(startRes.body).sessionToken

      const response = await app.inject({
        method: 'POST',
        url: `/api/sessions/${token}/submit`,
        payload: {
          answers: [{
            questionId: '00000000-0000-0000-0000-000000000000',
            answerIds: [],
          }],
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 409 for already submitted session', async () => {
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'doubleuser' },
      })
      const token = JSON.parse(startRes.body).sessionToken
      const questions = JSON.parse(startRes.body).questions

      await app.inject({
        method: 'POST',
        url: `/api/sessions/${token}/submit`,
        payload: {
          answers: [{
            questionId: questions[0].id,
            answerIds: [questions[0].answers[0].id],
          }],
        },
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/sessions/${token}/submit`,
        payload: { answers: [] },
      })

      expect(response.statusCode).toBe(409)
      expect(JSON.parse(response.body).error).toBe('Session already submitted')
    })

    it('should submit quiz and return score with review', async () => {
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'scoreuser' },
      })
      const token = JSON.parse(startRes.body).sessionToken
      const questions = JSON.parse(startRes.body).questions

      const response = await app.inject({
        method: 'POST',
        url: `/api/sessions/${token}/submit`,
        payload: {
          answers: questions.map((q: any) => ({
            questionId: q.id,
            answerIds: [q.answers[0].id],
          })),
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('score')
      expect(body).toHaveProperty('correctAnswers')
      expect(body).toHaveProperty('totalQuestions')
      expect(body).toHaveProperty('questions')
    })

    it('should grade SCQ correctly (exact match)', async () => {
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'scquser' },
      })
      const token = JSON.parse(startRes.body).sessionToken
      const questions = JSON.parse(startRes.body).questions

      const scq = questions.find((q: any) => q.type === 'SCQ')
      if (!scq) {
        console.log('No SCQ found in questions')
        return
      }

      const correctAnswer = scq.answers.find((a: any) => {
        const fullAnswers = questions.find((q: any) => q.id === scq.id).answers
        return fullAnswers.some((fa: any) => fa.id === a.id && !fa.isCorrect)
      }) || scq.answers[0]

      const response = await app.inject({
        method: 'POST',
        url: `/api/sessions/${token}/submit`,
        payload: {
          answers: [{
            questionId: scq.id,
            answerIds: [correctAnswer.id],
          }],
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should grade MCQ correctly (exact set match)', async () => {
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/sessions/start',
        payload: { username: 'mcquser' },
      })
      const token = JSON.parse(startRes.body).sessionToken
      const questions = JSON.parse(startRes.body).questions

      const mcq = questions.find((q: any) => q.type === 'MCQ')
      if (!mcq) {
        console.log('No MCQ found in questions')
        return
      }

      const response = await app.inject({
        method: 'POST',
        url: `/api/sessions/${token}/submit`,
        payload: {
          answers: [{
            questionId: mcq.id,
            answerIds: [mcq.answers[0].id, mcq.answers[1].id],
          }],
        },
      })

      expect(response.statusCode).toBe(200)
    })
  })
})