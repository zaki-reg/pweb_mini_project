# Claude Code — Implementation Plan
## Online Quiz Platform (SCQ/MCQ Bank)

> This document is a step-by-step execution guide for Claude Code.
> Follow each phase in order. Complete all tasks within a phase before moving to the next.
> Do not skip steps. Each phase builds on the previous one.

---

## Ground Rules for Claude Code

- Use **TypeScript strict mode** everywhere — both frontend and backend.
- Never use `any`. Use Zod-inferred types and Prisma-generated types.
- All secrets go in `.env` files. Never hardcode them.
- Run `npx prisma generate` after every schema change.
- After every backend route is added, verify it responds correctly.
- After every frontend page is wired, verify it loads without runtime errors.
- Commit logically after each phase.

---

## Phase 0 — Monorepo & Docker Scaffold

### Goal
Set up the root project structure, Docker Compose services, and base configs before writing any application code.

### Tasks

**0.1 Create root directory**
```
quiz-platform/
├── frontend/
├── backend/
├── docker-compose.yml
├── .env
├── .env.example
└── README.md
```

**0.2 Write `docker-compose.yml`**
```yaml
version: "3.9"

services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: quiz_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/quiz_platform
      JWT_SECRET: supersecretkey_change_in_prod
      PORT: 4000
      FRONTEND_URL: http://localhost:3000
    ports:
      - "4000:4000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  pgdata:
```

**0.3 Write `.env.example`**
```env
# Backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quiz_platform
JWT_SECRET=your_jwt_secret_here
PORT=4000
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**0.4 Copy `.env.example` to `.env` and fill values for local dev.**

### Checkpoint
- `docker compose up db` starts PostgreSQL with no errors.
- `docker compose ps` shows db healthy.

---

## Phase 1 — Backend: Project Init

### Goal
Bootstrap the Fastify TypeScript project, connect Prisma to PostgreSQL, and validate the database connection.

### Tasks

**1.1 Init Node project**
```bash
cd backend
npm init -y
npm install fastify @fastify/cors @fastify/cookie @fastify/jwt
npm install prisma @prisma/client zod bcrypt
npm install -D typescript ts-node tsx @types/node @types/bcrypt nodemon
npx tsc --init
npx prisma init
```

**1.2 Configure `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

**1.3 Write `src/server.ts`**
```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'

const app = Fastify({ logger: true })

app.register(cors, { origin: process.env.FRONTEND_URL, credentials: true })
app.register(cookie)
app.register(jwt, { secret: process.env.JWT_SECRET! })

app.get('/health', async () => ({ status: 'ok' }))

const start = async () => {
  await app.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' })
}
start()
```

**1.4 Write `package.json` scripts**
```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio"
}
```

**1.5 Write `Dockerfile.dev` for backend**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

### Checkpoint
- `docker compose up backend` starts without errors.
- `GET http://localhost:4000/health` returns `{ "status": "ok" }`.

---

## Phase 2 — Database: Prisma Schema

### Goal
Define the full database schema in Prisma and run migrations.

### Tasks

**2.1 Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Admin {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Category {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  questions Question[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Question {
  id               String            @id @default(cuid())
  body             String
  type             QuestionType
  difficulty       Difficulty        @default(MEDIUM)
  explanation      String?
  category         Category?         @relation(fields: [categoryId], references: [id])
  categoryId       String?
  answers          Answer[]
  sessionQuestions SessionQuestion[]
  userAnswers      UserAnswer[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}

enum QuestionType {
  SCQ
  MCQ
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

model Answer {
  id          String     @id @default(cuid())
  body        String
  isCorrect   Boolean    @default(false)
  question    Question   @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionId  String
  userAnswers UserAnswer[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model QuizSession {
  id               String            @id @default(cuid())
  username         String
  sessionToken     String            @unique @default(cuid())
  startedAt        DateTime          @default(now())
  submittedAt      DateTime?
  score            Float?
  totalQuestions   Int
  correctAnswers   Int?
  timeTakenSeconds Int?
  sessionQuestions SessionQuestion[]
  userAnswers      UserAnswer[]
}

model SessionQuestion {
  id           String      @id @default(cuid())
  session      QuizSession @relation(fields: [sessionId], references: [id])
  sessionId    String
  question     Question    @relation(fields: [questionId], references: [id])
  questionId   String
  displayOrder Int
}

model UserAnswer {
  id         String      @id @default(cuid())
  session    QuizSession @relation(fields: [sessionId], references: [id])
  sessionId  String
  question   Question    @relation(fields: [questionId], references: [id])
  questionId String
  answer     Answer      @relation(fields: [answerId], references: [id])
  answerId   String
}

model Setting {
  id            Int      @id @default(1)
  numQuestions  Int      @default(15)
  timerEnabled  Boolean  @default(false)
  timerSeconds  Int      @default(1200)
  allowReview   Boolean  @default(true)
  updatedAt     DateTime @updatedAt
}
```

**2.2 Run migration**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**2.3 Write `prisma/seed.ts`**

Create a seed file that inserts:
- One admin user: `admin@quiz.com` / `admin1234` (hashed with bcrypt)
- One `Setting` row with defaults: `id=1, numQuestions=15`
- 3 sample categories: `General`, `Science`, `Technology`
- At least 20 sample questions (mix of SCQ and MCQ) spread across categories with correct answers marked

Example seeding pattern:
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Upsert admin
  await prisma.admin.upsert({
    where: { email: 'admin@quiz.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@quiz.com',
      passwordHash: await bcrypt.hash('admin1234', 12),
    }
  })

  // Upsert settings
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, numQuestions: 15 }
  })

  // Create categories + questions with answers...
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

**2.4 Run seed**
```bash
npx prisma db seed
```

### Checkpoint
- `npx prisma studio` shows all tables populated.
- Admin row exists with hashed password.
- Settings row with id=1 exists.
- At least 20 questions exist with answers.

---

## Phase 3 — Backend: Auth Module

### Goal
Implement JWT-based admin authentication.

### Tasks

**3.1 Create `src/lib/prisma.ts`**
```typescript
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

**3.2 Create `src/modules/auth/auth.routes.ts`**

Implement these three routes:

```
POST /api/admin/auth/login
  - Body: { email: string, password: string }
  - Validates with Zod
  - Finds admin by email
  - Compares password with bcrypt.compare
  - Signs JWT with { adminId, email }
  - Sets httpOnly cookie `admin_token` with the JWT
  - Returns { success: true, admin: { id, name, email } }

POST /api/admin/auth/logout
  - Clears the `admin_token` cookie
  - Returns { success: true }

GET /api/admin/auth/me
  - Requires auth middleware
  - Returns current admin info from JWT payload
```

**3.3 Create `src/middleware/auth.ts`**
```typescript
import { FastifyRequest, FastifyReply } from 'fastify'

export async function adminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const token = request.cookies.admin_token
    if (!token) throw new Error('No token')
    await request.jwtVerify()  // or manually verify cookie token
  } catch {
    reply.status(401).send({ success: false, message: 'Unauthorized' })
  }
}
```

**3.4 Register auth routes on the Fastify app**

```typescript
app.register(authRoutes, { prefix: '/api/admin/auth' })
```

### Checkpoint
- `POST /api/admin/auth/login` with correct credentials returns 200 and sets cookie.
- `POST /api/admin/auth/login` with wrong password returns 401.
- `GET /api/admin/auth/me` without cookie returns 401.
- `GET /api/admin/auth/me` with valid cookie returns admin info.

---

## Phase 4 — Backend: Admin Resource Modules

### Goal
Build all admin CRUD endpoints for questions, categories, settings, and attempts.

### Tasks

**4.1 Settings module — `src/modules/settings/`**

```
GET  /api/admin/settings       → return settings row id=1
PUT  /api/admin/settings       → update numQuestions, timerEnabled, timerSeconds, allowReview
```

Both routes require `adminAuthMiddleware`.

**4.2 Categories module — `src/modules/categories/`**

```
GET    /api/admin/categories         → list all categories
POST   /api/admin/categories         → create { name } → auto-generate slug from name
PUT    /api/admin/categories/:id     → rename category
DELETE /api/admin/categories/:id     → delete (guard: reject if category has questions)
```

All routes require `adminAuthMiddleware`.

**4.3 Questions module — `src/modules/questions/`**

```
GET    /api/admin/questions          → paginated list, supports ?page, ?limit, ?search, ?type, ?categoryId, ?difficulty
POST   /api/admin/questions          → create question + answers in one transaction
GET    /api/admin/questions/:id      → single question with all answers
PUT    /api/admin/questions/:id      → update question + replace answers in one transaction
DELETE /api/admin/questions/:id      → delete question (cascade answers via Prisma)
```

Create question body shape (Zod schema):
```typescript
const CreateQuestionSchema = z.object({
  body: z.string().min(5).max(1000),
  type: z.enum(['SCQ', 'MCQ']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  explanation: z.string().optional(),
  categoryId: z.string().optional(),
  answers: z.array(z.object({
    body: z.string().min(1),
    isCorrect: z.boolean()
  })).min(2).max(6)
}).refine((data) => {
  const correctCount = data.answers.filter(a => a.isCorrect).length
  if (data.type === 'SCQ') return correctCount === 1
  if (data.type === 'MCQ') return correctCount >= 1
  return false
}, { message: 'Invalid correct answer configuration' })
```

All routes require `adminAuthMiddleware`.

**4.4 Attempts module — `src/modules/attempts/`**

```
GET  /api/admin/attempts           → paginated list of quiz_sessions (submitted only)
                                     include: username, startedAt, submittedAt, score, totalQuestions, correctAnswers
GET  /api/admin/attempts/:id       → detail view: session + per-question breakdown
                                     (question body, user selected answers, correct answers, isCorrect per question)
```

**4.5 Stats module — `src/modules/stats/`**

```
GET /api/admin/stats   → {
  totalQuestions: number,
  totalAttempts: number,
  averageScore: number,
  recentAttempts: last 10 sessions[]
}
```

### Checkpoint
- All CRUD routes return proper responses.
- Attempt detail correctly shows correct vs incorrect answers per question.
- Stats endpoint returns accurate aggregates.

---

## Phase 5 — Backend: Public Quiz Module

### Goal
Implement the public-facing quiz session flow: start → quiz → submit → grade.

### Tasks

**5.1 Session start — `POST /api/sessions/start`**

```typescript
Body: { username: string }  // min 2, max 50 chars

Logic:
1. Validate username
2. Fetch settings (numQuestions)
3. Count available questions — if less than numQuestions, use all available
4. Randomly select numQuestions questions using:
   SELECT * FROM questions ORDER BY RANDOM() LIMIT n
   In Prisma: await prisma.$queryRaw`SELECT id FROM questions ORDER BY RANDOM() LIMIT ${n}`
5. Create QuizSession row
6. Create SessionQuestion rows with displayOrder 1..n
7. Return: {
     sessionToken: string,
     questions: Array<{
       id, body, type, difficulty, displayOrder,
       answers: Array<{ id, body }>  // ← NO isCorrect exposed here!
     }>
   }
```

**CRITICAL**: Never expose `isCorrect` to the public session endpoint.

**5.2 Session resume — `GET /api/sessions/:token`**

```
Returns same shape as start response if session exists and is not yet submitted.
Returns 404 if token not found.
Returns 409 if already submitted.
```

**5.3 Session submit — `POST /api/sessions/:token/submit`**

```typescript
Body: {
  answers: Array<{
    questionId: string,
    answerIds: string[]  // array for MCQ, single-element for SCQ
  }>
}

Logic:
1. Find session by token
2. Return 409 if already submitted
3. Validate all questionIds belong to this session
4. Insert UserAnswer rows for each selection
5. Grade each question:
   - SCQ: fetch correct answer for question. answerIds[0] === correctAnswer.id → 1 point
   - MCQ: fetch all correct answers for question. Sort both sets and compare → 1 point if exact match
6. Compute: correctAnswers = sum of correct, score = (correct/total)*100
7. Update session: submittedAt=NOW(), score, correctAnswers
8. If settings.allowReview:
   Return full breakdown: per question { question body, userAnswers, correctAnswers, isCorrect, explanation }
   Else:
   Return only: { score, correctAnswers, totalQuestions }
```

### Checkpoint
- `POST /api/sessions/start` with valid username returns session + questions (no isCorrect in answers).
- `POST /api/sessions/:token/submit` grades correctly for SCQ and MCQ.
- Submitting twice on same token returns 409.
- Score and correctAnswers are correctly stored in DB.

---

## Phase 6 — Frontend: Project Init

### Goal
Bootstrap the Next.js 16 project with Tailwind CSS and shadcn/ui.

### Tasks

**6.1 Create Next.js app**
```bash
cd frontend
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**6.2 Install and init shadcn/ui**
```bash
npx shadcn@latest init
```

Select during init:
- Style: Default
- Base color: Neutral or Slate
- CSS variables: Yes

**6.3 Install required shadcn components**
```bash
npx shadcn@latest add button input textarea card dialog alert-dialog \
  table badge dropdown-menu tabs select checkbox radio-group progress \
  toast separator label form
```

Also install:
```bash
npm install sonner         # toast notifications
npm install lucide-react   # icons (already included via shadcn)
npm install axios          # or use native fetch
```

**6.4 Write `src/lib/api.ts`**

Central API client:
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Request failed')
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
}
```

**6.5 Write `src/types/index.ts`**

Define all shared TypeScript types:
```typescript
export type QuestionType = 'SCQ' | 'MCQ'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface Answer { id: string; body: string }
export interface AnswerWithCorrect extends Answer { isCorrect: boolean }

export interface Question {
  id: string; body: string; type: QuestionType
  difficulty: Difficulty; displayOrder: number
  answers: Answer[]
}

export interface QuizSession {
  sessionToken: string
  questions: Question[]
}

export interface QuestionResult {
  questionId: string; body: string; type: QuestionType
  userAnswerIds: string[]
  correctAnswerIds: string[]
  isCorrect: boolean
  explanation?: string
  answers: AnswerWithCorrect[]
}

export interface SubmitResult {
  score: number; correctAnswers: number; totalQuestions: number
  review?: QuestionResult[]
}

// Admin types
export interface AdminQuestion {
  id: string; body: string; type: QuestionType; difficulty: Difficulty
  categoryId?: string; explanation?: string; answers: AnswerWithCorrect[]
  createdAt: string
}

export interface Attempt {
  id: string; username: string; score: number
  totalQuestions: number; correctAnswers: number
  startedAt: string; submittedAt: string
}
```

**6.6 Write `Dockerfile.dev` for frontend**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

### Checkpoint
- `docker compose up frontend` starts Next.js without errors.
- `http://localhost:3000` loads the default Next.js page.
- shadcn/ui components are importable.

---

## Phase 7 — Frontend: Shared Layout & Admin Shell

### Goal
Build the shared layout components and the admin sidebar navigation shell.

### Tasks

**7.1 Create `src/components/admin/AdminSidebar.tsx`**

Sidebar with links to:
- Dashboard `/admin/dashboard`
- Questions `/admin/questions`
- Categories `/admin/categories`
- Attempts `/admin/attempts`
- Settings `/admin/settings`
- Logout button

Use `usePathname()` to highlight the active link. Collapsible to icon-only on narrow screens.

**7.2 Create `src/app/admin/layout.tsx`**

Wrap all `/admin/**` pages in a layout that:
- Checks for admin auth (cookie or context)
- Renders `<AdminSidebar />` + `<main>` area
- Redirects to `/admin/login` if not authenticated

**7.3 Create `src/components/ui/PageHeader.tsx`**

Reusable header with `title` prop and optional action button slot.

**7.4 Create `src/components/ui/StatCard.tsx`**

KPI card component:
```typescript
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
}
```

**7.5 Create `src/contexts/AdminAuthContext.tsx`**

Context to track admin auth state across the admin section:
```typescript
interface AdminAuthContextValue {
  admin: { id: string; name: string; email: string } | null
  isLoading: boolean
  logout: () => Promise<void>
}
```

### Checkpoint
- Admin layout renders correctly.
- Sidebar shows active state.
- Navigating to `/admin/dashboard` without auth redirects to `/admin/login`.

---

## Phase 8 — Frontend: Admin Pages

### Goal
Build all admin interface pages.

### Tasks

**8.1 Admin Login Page — `/admin/login`**

- Email + password form using shadcn `Input`, `Button`, `Form`.
- Submit calls `POST /api/admin/auth/login`.
- On success → redirect to `/admin/dashboard`.
- On failure → show inline error below form.
- Show loading spinner on submit.

**8.2 Admin Dashboard — `/admin/dashboard`**

- 4 `StatCard` components in a grid: Total Questions, Total Attempts, Average Score, Recent Activity.
- Recent attempts table (last 10 rows): username, date, score, questions.
- Data fetched from `GET /api/admin/stats`.
- Show skeleton loaders while loading.

**8.3 Question List Page — `/admin/questions`**

- Table with columns: Body (truncated), Type badge, Category, Difficulty badge, Actions.
- Search input (debounced, 300ms) filters by question body.
- Filter dropdowns for Type and Difficulty.
- Pagination controls.
- "New Question" button opens question form.
- Edit and Delete action buttons per row.
- Delete triggers `AlertDialog` confirmation.

**8.4 Question Form (Create & Edit)**

Build as a `Dialog` or dedicated page. Fields:
- Question body (Textarea)
- Type: SCQ / MCQ (RadioGroup — changing type resets correct answer selection)
- Category (Select with "None" option)
- Difficulty (Select: Easy / Medium / Hard)
- Explanation (Textarea, optional)
- Answers section:
  - Dynamic list of answer inputs
  - Each answer: text input + correct checkbox (or radio for SCQ)
  - "+ Add Answer" button (max 6)
  - "× Remove" button per answer (min 2 must remain)
- Validation:
  - At least 2 answers
  - At least one correct for MCQ
  - Exactly one correct for SCQ
  - Show inline errors

**8.5 Categories Page — `/admin/categories`**

- List of categories with name, slug, question count.
- Inline rename form per category.
- Delete button with confirmation (disabled if category has questions).
- "Add Category" inline form at top.

**8.6 Attempts Page — `/admin/attempts`**

- Table: username, submitted_at, score %, correct/total.
- Click row → open detail sheet or navigate to `/admin/attempts/[id]`.
- Detail view shows per-question breakdown:
  - Question body
  - User's answer(s) — highlighted red or green
  - Correct answer(s)
  - Explanation if present

**8.7 Settings Page — `/admin/settings`**

- Form with:
  - Number of questions (number input, 1–50)
  - Allow review toggle (Switch)
  - Timer enabled toggle (Switch)
  - Timer duration in minutes (number input, shown only when timer is enabled)
- Save button → `PUT /api/admin/settings`
- Show success toast on save.

### Checkpoint
- All admin pages load and render without errors.
- Admin can create a new question with answers, see it in the list, edit it, and delete it.
- Settings can be updated and are persisted.

---

## Phase 9 — Frontend: Public Quiz Pages

### Goal
Build the user-facing quiz experience: homepage, quiz interface, and results.

### Tasks

**9.1 Homepage — `/`**

Layout:
- Logo / platform name
- Brief tagline
- Username input + "Start Quiz" button
- Form validation: min 2 chars, max 50 chars, no special characters

On submit:
- Call `POST /api/sessions/start`
- Store `sessionToken` and questions in `sessionStorage` (or React state passed via router)
- Redirect to `/quiz?token={sessionToken}`

**9.2 Quiz Interface — `/quiz`**

State management:
```typescript
const [currentIndex, setCurrentIndex] = useState(0)
const [answers, setAnswers] = useState<Record<string, string[]>>({})
// answers: { [questionId]: [answerId, ...] }
```

Layout:
- Top bar: progress indicator (e.g. "Question 5 of 15"), timer if enabled
- Progress dots: one dot per question, colored by: answered (teal), current (blue), unanswered (gray)
- Question card:
  - Question number + type badge (SCQ/MCQ)
  - Question body text
  - Answer options:
    - SCQ: `RadioGroup` — only one selectable
    - MCQ: `Checkbox` group — multiple selectable
- Bottom navigation: "Previous" / "Next" buttons, "Submit" button on last question
- Submit triggers `AlertDialog` if any questions unanswered

On submit:
- Format answers into `{ answers: [{ questionId, answerIds }] }`
- Call `POST /api/sessions/:token/submit`
- Store result in state / sessionStorage
- Redirect to `/results?token={sessionToken}`

**9.3 Results Page — `/results`**

Layout:
- Score display: large percentage number with animated count-up
- Score ring: SVG circular progress animating from 0 to final score
- Grade band label:
  - 85–100% → "Excellent" (green)
  - 70–84% → "Good" (teal)
  - 50–69% → "Pass" (amber)
  - 0–49% → "Needs Improvement" (red)
- Correct count: "12 out of 15 correct"
- Review section (if `allowReview` is true):
  - Accordion per question
  - Header shows question number + correct/incorrect icon
  - Body shows: question text, all answer options highlighted (green = correct, red = wrong user pick, gray = not selected)
  - Explanation text if present
- "Try Again" button → returns to homepage

### Checkpoint
- User can start quiz, answer all questions, submit, and see results.
- SCQ only allows one answer selected.
- MCQ allows multiple.
- Score matches the grading logic.
- Review accordion shows correct answers clearly.

---

## Phase 10 — Polish, Validation & UX Details

### Goal
Fill in all the small but important quality details.

### Tasks

**10.1 Loading states**
- Add skeleton loaders to all admin table pages.
- Add loading spinner to all submit buttons while request is in flight.
- Add empty state components for: no questions yet, no attempts yet, no categories yet.

**10.2 Error handling**
- Wrap all API calls in try/catch.
- Show toast notifications for: success saves, failed saves, network errors.
- Handle 401 in admin pages → redirect to login.
- Handle invalid/expired session token on quiz page → redirect to homepage with error toast.

**10.3 Form validation**
- All forms must validate on blur and on submit.
- Use `react-hook-form` + Zod resolver for admin forms.
- User-facing forms (start quiz) validate inline with clear messages.

**10.4 Responsive check**
- Test all pages at 375px (mobile), 768px (tablet), 1280px (desktop).
- Admin sidebar collapses to hamburger/sheet on mobile.
- Quiz interface stacks vertically on mobile.
- Results page readable on mobile.

**10.5 Accessibility**
- All form fields have `<label>` or `aria-label`.
- All icon buttons have `aria-label`.
- Keyboard navigation works through quiz questions.
- Color is never the only indicator of correctness (also use icons: ✓ / ✗).

**10.6 Security hardening**
- Ensure admin cookies are `httpOnly` and `sameSite=lax`.
- Never expose `isCorrect` in public quiz endpoint.
- Validate all incoming request bodies with Zod — reject on invalid input.
- Sanitize username input server-side.

---

## Phase 11 — Seed Data & Final Testing

### Goal
Populate the database with realistic sample data and do a full end-to-end test.

### Tasks

**11.1 Expand seed data**
- Seed at least 30 questions across 3 categories.
- Mix: 20 SCQ + 10 MCQ.
- Mix difficulties: 10 Easy, 10 Medium, 10 Hard.
- Include explanation text for at least half the questions.

**11.2 Full user flow test**
1. Visit `http://localhost:3000`
2. Enter username "TestUser", click Start
3. Answer all questions
4. Submit
5. Verify score on results page
6. Verify attempt appears in admin panel

**11.3 Full admin flow test**
1. Login at `/admin/login` with `admin@quiz.com` / `admin1234`
2. Check dashboard stats are accurate
3. Create a new MCQ question with 4 answers (2 correct)
4. Edit that question
5. Delete a different question
6. Create a category, assign it to a question
7. Update settings: change `numQuestions` to 10
8. Start a new quiz as a user → verify only 10 questions appear
9. Review attempt detail in admin panel

**11.4 Edge case tests**
- Submit a quiz session twice → must get 409 error
- Start quiz with fewer questions in DB than `numQuestions` → should use all available
- Admin login with wrong password → must get clear error message
- Delete category with questions → must get rejection with helpful message

---

## Phase 12 — Documentation & Submission

### Goal
Write documentation and prepare the final submission package.

### Tasks

**12.1 Write `README.md`**

The README must include:

```markdown
# Quiz Platform

## Stack
- Frontend: Next.js 16, Tailwind CSS, shadcn/ui
- Backend: Node.js, Fastify, TypeScript, Prisma
- Database: PostgreSQL
- Infrastructure: Docker + Docker Compose

## Quick Start

### Prerequisites
- Docker Desktop installed and running

### Run the project

git clone ...
cd quiz-platform
cp .env.example .env
docker compose up --build

# In a second terminal:
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed

Open http://localhost:3000

## Admin Access
URL: http://localhost:3000/admin/login
Email: admin@quiz.com
Password: admin1234

## Environment Variables
See .env.example for all required variables.
```

**12.2 Prepare database dump**
```bash
docker compose exec db pg_dump -U postgres quiz_platform > database/quiz_platform.sql
```

**12.3 Final folder structure for submission**
```
Web_Project_FNAME_LNAME/
├── frontend/           # Next.js source
├── backend/            # Fastify source
├── database/
│   └── quiz_platform.sql
├── docker-compose.yml
├── .env.example
├── README.md
└── demo.mp4            # Screen recording
```

**12.4 Screen recording checklist**

Record a demo covering:
- [ ] Start quiz as public user, complete, view results
- [ ] Admin login
- [ ] Admin dashboard with real data
- [ ] Create a new question with answers
- [ ] Edit a question
- [ ] View an attempt detail
- [ ] Update settings (change question count)
- [ ] Logout

**12.5 Compress and name the archive**
```bash
zip -r Web_Project_FNAME_LNAME.zip Web_Project_FNAME_LNAME/
```

---

## Summary Table

| Phase | What Gets Built | Key Checkpoint |
|-------|----------------|----------------|
| 0 | Docker Compose + monorepo scaffold | `docker compose up db` works |
| 1 | Fastify server + health endpoint | `GET /health` returns 200 |
| 2 | Prisma schema + migrations + seed | DB tables populated |
| 3 | Admin auth (login/logout/me) | JWT cookie flow works |
| 4 | Admin CRUD (questions, categories, settings, attempts) | All admin routes respond correctly |
| 5 | Public quiz session (start/submit/grade) | Full quiz flow works end-to-end |
| 6 | Next.js init + shadcn/ui + API client | Frontend boots, components import |
| 7 | Admin shell layout + sidebar | Admin navigation renders |
| 8 | All admin pages | Full admin UI functional |
| 9 | Public pages (home, quiz, results) | Full public quiz flow in UI |
| 10 | Polish: loading, errors, a11y, responsive | No rough edges in UX |
| 11 | Seed data + E2E testing | All flows tested and passing |
| 12 | README, DB dump, submission package | Archive ready to submit |

---

*Implementation Plan v1.0 · Quiz Platform · May 2026*
