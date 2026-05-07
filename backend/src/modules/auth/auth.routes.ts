import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { getPrisma } from '../../lib/prisma.js'
import { adminAuthMiddleware, AdminJwtPayload } from '../../middleware/auth.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const adminReturnSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
})

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { email: string; password: string } }>(
    '/login',
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: parsed.error.flatten(),
        })
      }

      const { email, password } = parsed.data

      const admin = await getPrisma().admin.findUnique({
        where: { email },
      })

      if (!admin) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }

      const validPassword = await bcrypt.compare(password, admin.passwordHash)
      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }

      const payload: AdminJwtPayload = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      }

      const token = fastify.jwt.sign(payload, {
        expiresIn: '7d',
      })

      reply
        .setCookie('admin_token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        })
        .send(adminReturnSchema.parse(payload))
    }
  )

  fastify.post('/logout', async (request, reply) => {
    reply
      .clearCookie('admin_token', {
        path: '/',
      })
      .send({ message: 'Logged out successfully' })
  })

  fastify.get(
    '/me',
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      return adminReturnSchema.parse(request.admin)
    }
  )
}
