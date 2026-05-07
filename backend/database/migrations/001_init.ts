import { runQuery } from '../client'

export async function up(): Promise<void> {
  const now = new Date().toISOString()
  
  // Create Admin table
  await runQuery(`
    CREATE TABLE "Admin" (
      "id" varchar(36) PRIMARY KEY,
      "name" varchar(100) NOT NULL,
      "email" varchar(150) NOT NULL UNIQUE,
      "passwordHash" text NOT NULL,
      "createdAt" timestamp NOT NULL DEFAULT '${now}',
      "updatedAt" timestamp NOT NULL DEFAULT '${now}'
    )
  `)

  // Create Category table
  await runQuery(`
    CREATE TABLE "Category" (
      "id" varchar(36) PRIMARY KEY,
      "name" varchar(100) NOT NULL,
      "slug" varchar(120) NOT NULL UNIQUE,
      "createdAt" timestamp NOT NULL DEFAULT '${now}',
      "updatedAt" timestamp NOT NULL DEFAULT '${now}'
    )
  `)

  // Create Question table
  await runQuery(`
    CREATE TABLE "Question" (
      "id" varchar(36) PRIMARY KEY,
      "body" text NOT NULL,
      "type" varchar(10) NOT NULL,
      "difficulty" varchar(20) NOT NULL DEFAULT 'MEDIUM',
      "explanation" text,
      "categoryId" varchar(36) REFERENCES "Category"("id"),
      "createdAt" timestamp NOT NULL DEFAULT '${now}',
      "updatedAt" timestamp NOT NULL DEFAULT '${now}'
    )
  `)

  // Create Answer table
  await runQuery(`
    CREATE TABLE "Answer" (
      "id" varchar(36) PRIMARY KEY,
      "body" text NOT NULL,
      "isCorrect" boolean NOT NULL DEFAULT false,
      "questionId" varchar(36) NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
      "createdAt" timestamp NOT NULL DEFAULT '${now}',
      "updatedAt" timestamp NOT NULL DEFAULT '${now}'
    )
  `)

  // Create QuizSession table
  await runQuery(`
    CREATE TABLE "QuizSession" (
      "id" varchar(36) PRIMARY KEY,
      "username" varchar(100) NOT NULL,
      "sessionToken" varchar(36) NOT NULL UNIQUE,
      "startedAt" timestamp NOT NULL DEFAULT '${now}',
      "submittedAt" timestamp,
      "score" decimal(5,2),
      "totalQuestions" integer NOT NULL,
      "correctAnswers" integer,
      "timeTakenSeconds" integer
    )
  `)

  // Create SessionQuestion table
  await runQuery(`
    CREATE TABLE "SessionQuestion" (
      "id" varchar(36) PRIMARY KEY,
      "sessionId" varchar(36) NOT NULL REFERENCES "QuizSession"("id") ON DELETE CASCADE,
      "questionId" varchar(36) NOT NULL REFERENCES "Question"("id"),
      "displayOrder" integer NOT NULL
    )
  `)

  // Create UserAnswer table
  await runQuery(`
    CREATE TABLE "UserAnswer" (
      "id" varchar(36) PRIMARY KEY,
      "sessionId" varchar(36) NOT NULL REFERENCES "QuizSession"("id") ON DELETE CASCADE,
      "questionId" varchar(36) NOT NULL REFERENCES "Question"("id"),
      "answerId" varchar(36) NOT NULL REFERENCES "Answer"("id")
    )
  `)

  // Create Setting table
  await runQuery(`
    CREATE TABLE "Setting" (
      "id" integer PRIMARY KEY,
      "numQuestions" integer NOT NULL DEFAULT 15,
      "timerEnabled" boolean NOT NULL DEFAULT false,
      "timerSeconds" integer NOT NULL DEFAULT 1200,
      "allowReview" boolean NOT NULL DEFAULT true,
      "updatedAt" timestamp NOT NULL DEFAULT '${now}'
    )
  `)

  // Create _prisma_migrations table
  await runQuery(`
    CREATE TABLE "_prisma_migrations" (
      "id" varchar(36) PRIMARY KEY,
      "checksum" varchar(64) NOT NULL,
      "finished_at" timestamp,
      "migration_name" varchar(255) NOT NULL UNIQUE,
      "logs" text,
      "rolled_back_at" timestamp,
      "started_at" timestamp NOT NULL,
      "applied_steps_count" integer NOT NULL DEFAULT 0
    )
  `)

  // Create indexes
  await runQuery(`CREATE INDEX "Question_categoryId" ON "Question"("categoryId")`)
  await runQuery(`CREATE INDEX "Answer_questionId" ON "Answer"("questionId")`)
  await runQuery(`CREATE INDEX "SessionQuestion_sessionId" ON "SessionQuestion"("sessionId")`)
  await runQuery(`CREATE INDEX "SessionQuestion_questionId" ON "SessionQuestion"("questionId")`)
  await runQuery(`CREATE INDEX "UserAnswer_sessionId" ON "UserAnswer"("sessionId")`)
  await runQuery(`CREATE INDEX "UserAnswer_questionId" ON "UserAnswer"("questionId")`)
}