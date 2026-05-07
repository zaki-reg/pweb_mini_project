import { FastifyInstance } from "fastify";
import { z } from "zod";
import prisma, { getPrisma } from "../../lib/prisma.js";
import { adminAuthMiddleware } from "../../middleware/auth.js";

const attemptsFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const attemptResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  sessionToken: z.string(),
  startedAt: z.string().or(z.date()),
  submittedAt: z.string().or(z.date()).nullable(),
  score: z.number().nullable(),
  totalQuestions: z.number(),
  correctAnswers: z.number().nullable(),
  timeTakenSeconds: z.number().nullable(),
});

const questionResultSchema = z.object({
  questionId: z.string(),
  questionBody: z.string(),
  questionType: z.string(),
  userAnswers: z.array(
    z.object({
      answerId: z.string(),
      answerBody: z.string(),
      isCorrect: z.boolean(),
    }),
  ),
  correctAnswers: z.array(
    z.object({
      answerId: z.string(),
      answerBody: z.string(),
    }),
  ),
  explanation: z.string().nullable(),
});

const attemptDetailSchema = z.object({
  id: z.string(),
  username: z.string(),
  startedAt: z.string().or(z.date()),
  submittedAt: z.string().or(z.date()).nullable(),
  score: z.number().nullable(),
  totalQuestions: z.number(),
  correctAnswers: z.number().nullable(),
  timeTakenSeconds: z.number().nullable(),
  questions: z.array(questionResultSchema),
});

export async function attemptsRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const parsed = attemptsFilterSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid query parameters",
          details: parsed.error.flatten(),
        });
      }

      const { page, limit } = parsed.data;
      const skip = (page - 1) * limit;

      const [attempts, total] = await Promise.all([
        getPrisma().quizSession.findMany({
          where: { submittedAt: { not: null } },
          skip,
          take: limit,
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            username: true,
            sessionToken: true,
            startedAt: true,
            submittedAt: true,
            score: true,
            totalQuestions: true,
            correctAnswers: true,
            timeTakenSeconds: true,
          },
        }),
        getPrisma().quizSession.count({
          where: { submittedAt: { not: null } },
        }),
      ]);

      return {
        data: attempts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [adminAuthMiddleware] },
    async (request, reply) => {
      const { id } = request.params;

      const session = await prisma.quizSession.findUnique({
        where: { id },
        include: {
          userAnswers: {
            include: {
              answer: true,
            },
          },
          sessionQuestions: {
            include: {
              question: {
                include: {
                  answers: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        return reply.status(404).send({ error: "Attempt not found" });
      }

      const questionResults = session.sessionQuestions.map((sq) => {
        const question = sq.question;
        const userAnswerIds = session.userAnswers
          .filter((ua) => ua.questionId === question.id)
          .map((ua) => ua.answerId);

        const correctAnswers = question.answers.filter((a) => a.isCorrect);

        const userAnswers = userAnswerIds
          .map((aid) => {
            const answer = question.answers.find((a) => a.id === aid);
            return answer
              ? {
                  answerId: answer.id,
                  answerBody: answer.body,
                  isCorrect: answer.isCorrect,
                }
              : null;
          })
          .filter(Boolean);

        return {
          questionId: question.id,
          questionBody: question.body,
          questionType: question.type,
          userAnswers,
          correctAnswers: correctAnswers.map((ca) => ({
            answerId: ca.id,
            answerBody: ca.body,
          })),
          explanation: question.explanation,
        };
      });

      return {
        id: session.id,
        username: session.username,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        score: session.score,
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        timeTakenSeconds: session.timeTakenSeconds,
        questions: questionResults,
      };
    },
  );
}
