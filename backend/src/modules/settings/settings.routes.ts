import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import { adminAuthMiddleware } from '../../middleware/auth.js'

const settingsUpdateSchema = z.object({
  numQuestions: z.number().int().min(1).max(50).optional(),
  timerEnabled: z.boolean().optional(),
  timerSeconds: z.number().int().min(60).max(3600).optional(),
  allowReview: z.boolean().optional(),
})

const settingsResponseSchema = z.object({
  id: z.number(),
  numQuestions: z.number(),
  timerEnabled: z.boolean(),
  timerSeconds: z.number(),
  allowReview: z.boolean(),
  updatedAt: z.string().or(z.date()),
})

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const settings = await prisma.setting.findUnique({
        where: { id: 1 },
      })

      if (!settings) {
        return reply.status(404).send({ error: 'Settings not found' })
      }

      return settingsResponseSchema.parse(settings)
    }
  )

  fastify.put<{ Body: z.infer<typeof settingsUpdateSchema> }>(
    '/',
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const parsed = settingsUpdateSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: parsed.error.flatten(),
        })
      }

      const updated = await prisma.setting.upsert({
        where: { id: 1 },
        update: parsed.data,
        create: {
          id: 1,
          numQuestions: parsed.data.numQuestions ?? 15,
          timerEnabled: parsed.data.timerEnabled ?? false,
          timerSeconds: parsed.data.timerSeconds ?? 1200,
          allowReview: parsed.data.allowReview ?? true,
        },
      })

      return settingsResponseSchema.parse(updated)
    }
  )
}