import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { authRoutes } from './modules/auth/auth.routes.js'
import { settingsRoutes } from './modules/settings/settings.routes.js'
import { categoriesRoutes } from './modules/categories/categories.routes.js'
import { questionsRoutes } from './modules/questions/questions.routes.js'
import { attemptsRoutes } from './modules/attempts/attempts.routes.js'
import { statsRoutes } from './modules/stats/stats.routes.js'
import { sessionsRoutes } from './modules/sessions/sessions.routes.js'

const app = Fastify({ logger: true })

// Register plugins
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
app.register(cors, {
  origin: frontendUrl.split(',').map(url => url.trim()),
  credentials: true,
})
app.register(cookie)
app.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecretkey_change_in_prod',
  cookie: {
    cookieName: 'admin_token',
    signed: false,
  },
})

// Health check route
app.get('/health', async () => {
  return { status: 'ok' }
})

// Register auth routes
app.register(authRoutes, { prefix: '/api/admin/auth' })

// Register admin resource routes
app.register(settingsRoutes, { prefix: '/api/admin/settings' })
app.register(categoriesRoutes, { prefix: '/api/admin/categories' })
app.register(questionsRoutes, { prefix: '/api/admin/questions' })
app.register(attemptsRoutes, { prefix: '/api/admin/attempts' })
app.register(statsRoutes, { prefix: '/api/admin/stats' })

// Register public session routes
app.register(sessionsRoutes, { prefix: '/api/sessions' })

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000
    await app.listen({ port, host: '0.0.0.0' })
    app.log.info(`Server listening on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

export { app }