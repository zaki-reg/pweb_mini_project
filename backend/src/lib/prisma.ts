import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const { Pool } = pg

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  testPrisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/quiz_platform'
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export function setTestPrisma(client: PrismaClient) {
  globalForPrisma.testPrisma = client
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.testPrisma) {
    return globalForPrisma.testPrisma
  }
  return prisma
}

export default prisma