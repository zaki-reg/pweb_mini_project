import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { authRoutes } from '../../src/modules/auth/auth.routes.js'
import { settingsRoutes } from '../../src/modules/settings/settings.routes.js'
import { categoriesRoutes } from '../../src/modules/categories/categories.routes.js'
import { questionsRoutes } from '../../src/modules/questions/questions.routes.js'
import { attemptsRoutes } from '../../src/modules/attempts/attempts.routes.js'
import { statsRoutes } from '../../src/modules/stats/stats.routes.js'

export async function buildApp() {
  const app = Fastify({ logger: false })

  await app.register(cors, {
    origin: 'http://localhost:3000',
    credentials: true,
  })
  await app.register(cookie)
  await app.register(jwt, {
    secret: 'test-secret-key-for-testing',
    cookie: {
      cookieName: 'admin_token',
      signed: false,
    },
  })

  app.get('/health', async () => ({ status: 'ok' }))

  await app.register(authRoutes, { prefix: '/api/admin/auth' })
  await app.register(settingsRoutes, { prefix: '/api/admin/settings' })
  await app.register(categoriesRoutes, { prefix: '/api/admin/categories' })
  await app.register(questionsRoutes, { prefix: '/api/admin/questions' })
  await app.register(attemptsRoutes, { prefix: '/api/admin/attempts' })
  await app.register(statsRoutes, { prefix: '/api/admin/stats' })

  return app
}