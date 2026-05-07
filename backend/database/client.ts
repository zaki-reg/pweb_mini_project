import { Pool } from 'pg'

export interface Database {
  Admin: {
    id: string
    name: string
    email: string
    passwordHash: string
    createdAt: Date
    updatedAt: Date
  }
  Category: {
    id: string
    name: string
    slug: string
    createdAt: Date
    updatedAt: Date
  }
  Question: {
    id: string
    body: string
    type: 'SCQ' | 'MCQ'
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    explanation: string | null
    categoryId: string | null
    createdAt: Date
    updatedAt: Date
  }
  Answer: {
    id: string
    body: string
    isCorrect: boolean
    questionId: string
    createdAt: Date
    updatedAt: Date
  }
  QuizSession: {
    id: string
    username: string
    sessionToken: string
    startedAt: Date
    submittedAt: Date | null
    score: number | null
    totalQuestions: number
    correctAnswers: number | null
    timeTakenSeconds: number | null
  }
  SessionQuestion: {
    id: string
    sessionId: string
    questionId: string
    displayOrder: number
  }
  UserAnswer: {
    id: string
    sessionId: string
    questionId: string
    answerId: string
  }
  Setting: {
    id: number
    numQuestions: number
    timerEnabled: boolean
    timerSeconds: number
    allowReview: boolean
    updatedAt: Date
  }
  _prisma_migrations: {
    id: string
    checksum: string
    finished_at: Date | null
    migration_name: string
    logs: string | null
    rolled_back_at: Date | null
    started_at: Date
    applied_steps_count: number
  }
}

let pool: Pool | undefined

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/quiz_platform',
    })
  }
  return pool
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = undefined
  }
}

// Helper to run raw queries
export async function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  const result = await getPool().query(sql, params)
  return result.rows
}