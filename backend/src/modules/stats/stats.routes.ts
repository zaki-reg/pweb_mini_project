import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import { adminAuthMiddleware } from '../../middleware/auth.js'

const statsSchema = z.object({
  totalQuestions: z.number(),
  totalAttempts: z.number(),
  averageScore: z.number().nullable(),
  recentAttempts: z.array(z.object({
    id: z.string(),
    username: z.string(),
    score: z.number().nullable(),
    submittedAt: z.string().or(z.date()).nullable(),
  })),
})

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const [totalQuestions, totalAttempts, recentAttempts] = await Promise.all([
        prisma.question.count(),
        prisma.quizSession.count({ where: { submittedAt: { not: null } } }),
        prisma.quizSession.findMany({
          where: { submittedAt: { not: null } },
          take: 10,
          orderBy: { submittedAt: 'desc' },
          select: {
            id: true,
            username: true,
            score: true,
            submittedAt: true,
          },
        }),
      ])

      const avgResult = await prisma.quizSession.aggregate({
        where: { submittedAt: { not: null } },
        _avg: { score: true },
      })

      return {
        totalQuestions,
        totalAttempts,
        averageScore: avgResult._avg.score ? Math.round(avgResult._avg.score * 100) / 100 : null,
        recentAttempts,
      }
    }
  )
}