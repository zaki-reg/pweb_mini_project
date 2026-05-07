import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { authRoutes } from './modules/auth/auth.routes.js'

const app = Fastify({ logger: true })

// Register plugins
app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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