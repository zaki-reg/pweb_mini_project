import { vi } from 'vitest'
import bcrypt from 'bcrypt'

const hashedPassword = await bcrypt.hash('admin1234', 12)

export const mockPrisma = {
  admin: {
    findUnique: vi.fn().mockImplementation(({ where }) => {
      if (where.email === 'admin@quiz.com') {
        return Promise.resolve({
          id: 'test-admin-id',
          name: 'Test Admin',
          email: 'admin@quiz.com',
          passwordHash: hashedPassword,
        })
      }
      return Promise.resolve(null)
    }),
  },
  setting: {
    findUnique: vi.fn().mockResolvedValue({
      id: 1,
      numQuestions: 15,
      timerEnabled: false,
      timerSeconds: 1200,
      allowReview: true,
    }),
    upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve(create)),
  },
  category: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: 'new-category-id',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: 'category-id',
      ...data,
      updatedAt: new Date(),
    })),
    delete: vi.fn().mockResolvedValue(undefined),
    findFirst: vi.fn().mockResolvedValue(null),
  },
  question: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: 'new-question-id',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({
      id: 'question-id',
      ...data,
      updatedAt: new Date(),
    })),
    delete: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
  },
  answer: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  quizSession: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _avg: { score: null } }),
  },
  _transaction: vi.fn().mockImplementation(async (fn) => fn()),
}

export async function mockPrismaTransaction(fn: any) {
  return fn(mockPrisma)
}