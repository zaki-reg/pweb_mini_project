import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma, { getPrisma } from "../../lib/prisma.js";
import { adminAuthMiddleware } from "../../middleware/auth.js";

const answerSchema = z.object({
  body: z.string().min(1),
  isCorrect: z.boolean(),
});

const questionCreateSchema = z
  .object({
    body: z.string().min(1),
    type: z.enum(["SCQ", "MCQ"]),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
    explanation: z.string().nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    answers: z.array(answerSchema).min(2).max(6),
  })
  .refine(
    (data) => {
      const correctCount = data.answers.filter((a) => a.isCorrect).length;
      if (data.type === "SCQ") return correctCount === 1;
      return correctCount >= 1;
    },
    {
      message:
        "SCQ must have exactly 1 correct answer, MCQ must have at least 1 correct answer",
    },
  );

const questionUpdateSchema = questionCreateSchema;

const questionFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.enum(["SCQ", "MCQ"]).optional(),
  categoryId: z.string().uuid().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});

const answerResponseSchema = z.object({
  id: z.string(),
  body: z.string(),
  isCorrect: z.boolean(),
  questionId: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

const questionResponseSchema = z.object({
  id: z.string(),
  body: z.string(),
  type: z.string(),
  difficulty: z.string(),
  explanation: z.string().nullable(),
  categoryId: z.string().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  answers: z.array(answerResponseSchema),
  category: z.object({ id: z.string(), name: z.string() }).nullable(),
});

const paginatedQuestionsSchema = z.object({
  data: z.array(questionResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export async function questionsRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const parsed = questionFilterSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid query parameters",
          details: parsed.error.flatten(),
        });
      }

      const { page, limit, search, type, categoryId, difficulty } = parsed.data;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) where.body = { contains: search, mode: "insensitive" };
      if (type) where.type = type;
      if (categoryId) where.categoryId = categoryId;
      if (difficulty) where.difficulty = difficulty;

      const [questions, total] = await Promise.all([
        prisma.question.findMany({
          where,
          skip,
          take: limit,
          include: {
            answers: true,
            category: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.question.count({ where }),
      ]);

      return {
        questions,
        total,
        page,
        limit,
      };
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const { id } = request.params;

      const question = await getPrisma().question.findUnique({
        where: { id },
        include: {
          answers: true,
          category: { select: { id: true, name: true } },
        },
      });

      if (!question) {
        return reply.status(404).send({ error: "Question not found" });
      }

      return questionResponseSchema.parse(question);
    },
  );

  fastify.post<{ Body: z.infer<typeof questionCreateSchema> }>(
    "/",
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const parsed = questionCreateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid input",
          details: parsed.error.flatten(),
        });
      }

      const { body, type, difficulty, explanation, categoryId, answers } =
        parsed.data;

      const question = await getPrisma().$transaction(async (tx) => {
        const q = await tx.question.create({
          data: {
            body,
            type,
            difficulty,
            explanation,
            categoryId: categoryId ?? undefined,
            answers: {
              create: answers,
            },
          },
          include: {
            answers: true,
            category: { select: { id: true, name: true } },
          },
        });
        return q;
      });

      return questionResponseSchema.parse(question);
    },
  );

  fastify.put<{
    Params: { id: string };
    Body: z.infer<typeof questionUpdateSchema>;
  }>("/:id", { preHandler: [adminAuthMiddleware] }, async (request, reply) => {
    const { id } = request.params;
    const parsed = questionUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid input",
        details: parsed.error.flatten(),
      });
    }

    const { body, type, difficulty, explanation, categoryId, answers } =
      parsed.data;

    const existing = await getPrisma().question.findUnique({
      where: { id },
    });

    if (!existing) {
      return reply.status(404).send({ error: "Question not found" });
    }

    const question = await getPrisma().$transaction(async (tx) => {
      await tx.answer.deleteMany({ where: { questionId: id } });

      const q = await tx.question.update({
        where: { id },
        data: {
          body,
          type,
          difficulty,
          explanation,
          categoryId: categoryId ?? null,
          answers: {
            create: answers,
          },
        },
        include: {
          answers: true,
          category: { select: { id: true, name: true } },
        },
      });
      return q;
    });

    return questionResponseSchema.parse(question);
  });

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const { id } = request.params;

      const existing = await getPrisma().question.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ error: "Question not found" });
      }

      await getPrisma().question.delete({
        where: { id },
      });

      return reply.status(204).send();
    },
  );
}
