import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPrisma } from '../../lib/prisma.js'

const startSessionSchema = z.object({
  username: z.string().min(2).max(50),
})

const submitAnswersSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answerIds: z.array(z.string().uuid()),
  })),
})

function generateToken(): string {
  return crypto.randomUUID()
}

export async function sessionsRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: z.infer<typeof startSessionSchema> }>(
    '/start',
    async (request, reply) => {
      const parsed = startSessionSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: parsed.error.flatten(),
        })
      }

      const { username } = parsed.data
      const prisma = getPrisma()

      const settings = await prisma.setting.findUnique({
        where: { id: 1 },
      })

      const numQuestions = settings?.numQuestions || 15

      const totalQuestions = await prisma.question.count()

      if (totalQuestions === 0) {
        return reply.status(400).send({ error: 'No questions available in the database' })
      }

      const questionsToSelect = Math.min(numQuestions, totalQuestions)

      const questions = await prisma.$queryRaw<any[]>`
        SELECT q.id, q.body, q.type, q.difficulty, q.explanation, q."categoryId", q."createdAt", q."updatedAt"
        FROM "Question" q
        ORDER BY RANDOM()
        LIMIT ${questionsToSelect}
      `

      const questionIds = questions.map((q: any) => q.id)

      const answers = await prisma.answer.findMany({
        where: { questionId: { in: questionIds } },
      })

      const answersByQuestion = answers.reduce((acc: any, answer: any) => {
        if (!acc[answer.questionId]) {
          acc[answer.questionId] = []
        }
        acc[answer.questionId].push({
          id: answer.id,
          body: answer.body,
          questionId: answer.questionId,
        })
        return acc
      }, {})

      const sessionToken = generateToken()

      const session = await prisma.quizSession.create({
        data: {
          username,
          sessionToken,
          totalQuestions: questionsToSelect,
        },
      })

      await prisma.sessionQuestion.createMany({
        data: questions.map((q: any, index: number) => ({
          sessionId: session.id,
          questionId: q.id,
          displayOrder: index + 1,
        })),
      })

      const responseQuestions = questions.map((q: any) => ({
        id: q.id,
        body: q.body,
        type: q.type,
        difficulty: q.difficulty,
        explanation: q.explanation,
        categoryId: q.categoryId,
        answers: answersByQuestion[q.id] || [],
      }))

      return {
        sessionToken,
        username,
        totalQuestions: questionsToSelect,
        questions: responseQuestions,
      }
    }
  )

  fastify.get<{ Params: { token: string } }>(
    '/:token',
    async (request, reply) => {
      const { token } = request.params

      const prisma = getPrisma()

      const session = await prisma.quizSession.findUnique({
        where: { sessionToken: token },
        include: {
          sessionQuestions: {
            include: {
              question: {
                include: {
                  answers: {
                    select: {
                      id: true,
                      body: true,
                      questionId: true,
                    },
                  },
                },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      })

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      if (session.submittedAt) {
        return reply.status(409).send({ error: 'Session already submitted' })
      }

      const questions = session.sessionQuestions.map((sq) => ({
        id: sq.question.id,
        body: sq.question.body,
        type: sq.question.type,
        difficulty: sq.question.difficulty,
        explanation: sq.question.explanation,
        categoryId: sq.question.categoryId,
        answers: sq.question.answers.map((a) => ({
          id: a.id,
          body: a.body,
          questionId: a.questionId,
        })),
      }))

      return {
        sessionToken: session.sessionToken,
        username: session.username,
        totalQuestions: session.totalQuestions,
        questions,
      }
    }
  )

  fastify.post<{ Params: { token: string }; Body: z.infer<typeof submitAnswersSchema> }>(
    '/:token/submit',
    async (request, reply) => {
      const { token } = request.params

      const parsed = submitAnswersSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid input',
          details: parsed.error.flatten(),
        })
      }

      const { answers } = parsed.data

      const prisma = getPrisma()

      const session = await prisma.quizSession.findUnique({
        where: { sessionToken: token },
        include: {
          sessionQuestions: true,
        },
      })

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      if (session.submittedAt) {
        return reply.status(409).send({ error: 'Session already submitted' })
      }

      const sessionQuestionIds = session.sessionQuestions.map((sq) => sq.questionId)

      for (const answer of answers) {
        if (!sessionQuestionIds.includes(answer.questionId)) {
          return reply.status(400).send({ error: `Question ${answer.questionId} not in this session` })
        }
      }

      await prisma.userAnswer.createMany({
        data: answers.flatMap((answer) =>
          answer.answerIds.map((answerId) => ({
            sessionId: session.id,
            questionId: answer.questionId,
            answerId,
          }))
        ),
      })

      const userAnswers = await prisma.userAnswer.findMany({
        where: { sessionId: session.id },
      })

      const userAnswerIds = userAnswers.map((ua) => ua.answerId)

      const questionsWithAnswers = await prisma.question.findMany({
        where: { id: { in: sessionQuestionIds } },
        include: {
          answers: true,
        },
      })

      let correctAnswers = 0

      for (const question of questionsWithAnswers) {
        const correctAnswerIds = question.answers.filter((a) => a.isCorrect).map((a) => a.id)
        const selectedAnswerIds = userAnswers.filter((ua) => ua.questionId === question.id).map((ua) => ua.answerId)

        if (question.type === 'SCQ') {
          if (selectedAnswerIds.length === 1 && correctAnswerIds.includes(selectedAnswerIds[0])) {
            correctAnswers++
          }
        } else {
          const correctSet = new Set(correctAnswerIds)
          const selectedSet = new Set(selectedAnswerIds)
          if (correctSet.size === selectedSet.size && [...correctSet].every((id) => selectedSet.has(id))) {
            correctAnswers++
          }
        }
      }

      const score = (correctAnswers / session.totalQuestions) * 100

      const updatedSession = await prisma.quizSession.update({
        where: { id: session.id },
        data: {
          submittedAt: new Date(),
          score,
          correctAnswers,
        },
      })

      const settings = await prisma.setting.findUnique({
        where: { id: 1 },
      })

      if (settings?.allowReview) {
        const questionResults = questionsWithAnswers.map((question) => {
          const correctAnswerIds = question.answers.filter((a) => a.isCorrect).map((a) => a.id)
          const selectedAnswerIds = userAnswers.filter((ua) => ua.questionId === question.id).map((ua) => ua.answerId)

          const userAnswerDetails = selectedAnswerIds.map((aid) => {
            const answer = question.answers.find((a) => a.id === aid)
            return answer
              ? { id: answer.id, body: answer.body, isCorrect: answer.isCorrect }
              : null
          }).filter(Boolean)

          const correctAnswerDetails = question.answers
            .filter((a) => a.isCorrect)
            .map((a) => ({ id: a.id, body: a.body }))

          return {
            questionId: question.id,
            questionBody: question.body,
            userAnswers: userAnswerDetails,
            correctAnswers: correctAnswerDetails,
            explanation: question.explanation,
          }
        })

        return {
          score: Math.round(score * 100) / 100,
          correctAnswers,
          totalQuestions: session.totalQuestions,
          questions: questionResults,
        }
      }

      return {
        score: Math.round(score * 100) / 100,
        correctAnswers,
        totalQuestions: session.totalQuestions,
      }
    }
  )
}