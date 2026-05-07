import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../../lib/prisma.js'
import { adminAuthMiddleware } from '../../middleware/auth.js'

const categoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
})

const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(100),
})

const categoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  _count: z.object({ questions: z.number() }).optional(),
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function categoriesRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { name: 'asc' },
      })

      return categories.map((cat) => ({
        ...cat,
        _count: cat._count.questions,
      }))
    }
  )

  fastify.post<{ Body: z.infer<typeof categoryCreateSchema> }>(
    '/',
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const parsed = categoryCreateSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: parsed.error.flatten(),
        })
      }

      const { name } = parsed.data
      const slug = generateSlug(name)

      const existing = await prisma.category.findUnique({
        where: { slug },
      })

      if (existing) {
        return reply.status(409).send({ error: 'Category with this name already exists' })
      }

      const category = await prisma.category.create({
        data: { name, slug },
      })

      return categoryResponseSchema.parse(category)
    }
  )

  fastify.put<{ Params: { id: string }; Body: z.infer<typeof categoryUpdateSchema> }>(
    '/:id',
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const { id } = request.params
      const parsed = categoryUpdateSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: parsed.error.flatten(),
        })
      }

      const { name } = parsed.data
      const slug = generateSlug(name)

      const existing = await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      })

      if (existing) {
        return reply.status(409).send({ error: 'Category with this name already exists' })
      }

      const category = await prisma.category.update({
        where: { id },
        data: { name, slug },
      })

      return categoryResponseSchema.parse(category)
    }
  )

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const { id } = request.params

      const questionCount = await prisma.question.count({
        where: { categoryId: id },
      })

      if (questionCount > 0) {
        return reply.status(409).send({
          error: 'Cannot delete category with existing questions',
        })
      }

      await prisma.category.delete({
        where: { id },
      })

      return reply.status(204).send()
    }
  )
}