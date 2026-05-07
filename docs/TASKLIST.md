# Quiz Platform — Task List
## Phased Implementation Checklist

> No-code task tracker. Check off each item as you complete it.
> Work top to bottom. Do not skip phases.

---

## Phase 0 — Project Scaffold

- [x] 0.1 Create folders: `frontend/`, `backend/`, `database/`
- [x] 0.2 Create `docker-compose.yml` at root
- [x] 0.3 Create `.env.example` at root with all required variable names
- [x] 0.4 Copy `.env.example` to `.env` and fill in local values
- [x] 0.5 Create root `README.md` (placeholder for now)
- [x] 0.6 Initialize a Git repository at root
- [x] 0.7 Create `.gitignore` (exclude `node_modules`, `.env`, `dist`, `.next`)
- [x] 0.8 Verify `docker compose up db` starts PostgreSQL with no errors
- [x] 0.9 Verify `docker compose ps` shows `db` as healthy

---

## Phase 1 — Backend Bootstrap

- [x] 1.1 `cd backend` and run `npm init -y`
- [x] 1.2 Install production dependencies: `fastify`, `@fastify/cors`, `@fastify/cookie`, `@fastify/jwt`, `@prisma/client`, `zod`, `bcrypt`
- [x] 1.3 Install dev dependencies: `typescript`, `tsx`, `ts-node`, `@types/node`, `@types/bcrypt`, `nodemon`, `prisma`
- [x] 1.4 Run `npx tsc --init` and configure `tsconfig.json` with `strict: true`, `rootDir: src`, `outDir: dist`
- [x] 1.5 Run `npx prisma init` to generate `prisma/` folder and `schema.prisma`
- [x] 1.6 Create `src/` folder structure: `modules/`, `lib/`, `middleware/`, `utils/`
- [x] 1.7 Create `src/server.ts` with Fastify app, register CORS, cookie, and JWT plugins
- [x] 1.8 Add `GET /health` route returning `{ status: "ok" }`
- [x] 1.9 Add `npm` scripts: `dev`, `build`, `start`, `db:migrate`, `db:seed`, `db:studio`
- [x] 1.10 Create `Dockerfile.dev` for the backend service
- [x] 1.11 Add backend service to `docker-compose.yml` pointing to `Dockerfile.dev`
- [x] 1.12 Verify `docker compose up backend` starts without errors
- [x] 1.13 Verify `GET http://localhost:4000/health` returns `{ "status": "ok" }` (verified via container exec)

---

## Phase 2 — Database Schema & Seed

- [x] 2.1 Write the full schema in `database/migrations/001_init.ts` with all 8 models: `Admin`, `Category`, `Question`, `Answer`, `QuizSession`, `SessionQuestion`, `UserAnswer`, `Setting`
- [x] 2.2 Add enums `QuestionType` (SCQ, MCQ) and `Difficulty` (EASY, MEDIUM, HARD) to the schema
- [x] 2.3 Define all foreign key relations with correct cascade delete rules
- [x] 2.4 TypeScript migrations run automatically via Docker `migrate` service after DB is healthy
- [x] 2.5 Create `database/client.ts` with pg pool for database access
- [x] 2.6 Create `database/seed.ts` with seed data
- [x] 2.7 Seed one admin user: email `admin@quiz.com`, password `admin1234` (bcrypt hashed, rounds=12)
- [x] 2.8 Seed `Setting` row with `id=1`, `numQuestions=15`, `allowReview=true`
- [x] 2.9 Seed 3 categories: `General`, `Science`, `Technology`
- [x] 2.10 Seed 24 questions: mix of SCQ and MCQ, spread across categories, with correct answers marked
- [x] 2.11 Seed runs automatically in Docker after migrations complete
- [x] 2.12 Seed is idempotent (skips if admin already exists)
- [x] 2.13 Database verified with 24 questions, 96 answers, 3 categories, 1 admin, 1 setting row

---

## Phase 3 — Admin Authentication

- [x] 3.1 Create `src/lib/prisma.ts` exporting a singleton PrismaClient instance
- [x] 3.2 Create `src/middleware/auth.ts` with `adminAuthMiddleware` that reads and verifies the JWT cookie
- [x] 3.3 Create `src/modules/auth/auth.routes.ts`
- [x] 3.4 Implement `POST /api/admin/auth/login`: validate body with Zod, find admin by email, compare password with bcrypt, sign JWT, set `httpOnly` cookie
- [x] 3.5 Implement `POST /api/admin/auth/logout`: clear the `admin_token` cookie
- [x] 3.6 Implement `GET /api/admin/auth/me`: verify cookie, return admin info from JWT payload
- [x] 3.7 Register all auth routes on the Fastify instance under prefix `/api/admin/auth`
- [x] 3.8 Verify login with correct credentials sets cookie and returns admin info
- [x] 3.9 Verify login with wrong password returns 401
- [x] 3.10 Verify `GET /me` without cookie returns 401
- [x] 3.11 Verify `GET /me` with valid cookie returns admin data

---

## Phase 4 — Admin Resource Endpoints

### Settings
- [x] 4.1 Create `src/modules/settings/settings.routes.ts`
- [x] 4.2 Implement `GET /api/admin/settings`: return the single settings row
- [x] 4.3 Implement `PUT /api/admin/settings`: validate and update `numQuestions`, `timerEnabled`, `timerSeconds`, `allowReview`
- [x] 4.4 Apply `adminAuthMiddleware` to both settings routes

### Categories
- [x] 4.5 Create `src/modules/categories/categories.routes.ts`
- [x] 4.6 Implement `GET /api/admin/categories`: return all categories
- [x] 4.7 Implement `POST /api/admin/categories`: validate name, auto-generate slug, create category
- [x] 4.8 Implement `PUT /api/admin/categories/:id`: rename category and regenerate slug
- [x] 4.9 Implement `DELETE /api/admin/categories/:id`: reject with error if category has questions, otherwise delete
- [x] 4.10 Apply `adminAuthMiddleware` to all category routes

### Questions
- [x] 4.11 Create `src/modules/questions/questions.routes.ts`
- [x] 4.12 Implement `GET /api/admin/questions`: return paginated list, support query params `page`, `limit`, `search`, `type`, `categoryId`, `difficulty`
- [x] 4.13 Implement `GET /api/admin/questions/:id`: return single question with all answers
- [x] 4.14 Implement `POST /api/admin/questions`: validate with Zod (including refine rule: SCQ needs exactly 1 correct, MCQ needs at least 1), create question + answers in a Prisma transaction
- [x] 4.15 Implement `PUT /api/admin/questions/:id`: update question and replace all answers in a single Prisma transaction
- [x] 4.16 Implement `DELETE /api/admin/questions/:id`: delete question (answers cascade via Prisma)
- [x] 4.17 Apply `adminAuthMiddleware` to all question routes

### Attempts & Stats
- [x] 4.18 Create `src/modules/attempts/attempts.routes.ts`
- [x] 4.19 Implement `GET /api/admin/attempts`: paginated list of submitted sessions with username, score, dates
- [x] 4.20 Implement `GET /api/admin/attempts/:id`: full detail with per-question breakdown (user answers vs. correct answers)
- [x] 4.21 Create `src/modules/stats/stats.routes.ts`
- [x] 4.22 Implement `GET /api/admin/stats`: return `totalQuestions`, `totalAttempts`, `averageScore`, `recentAttempts` (last 10)
- [x] 4.23 Apply `adminAuthMiddleware` to all attempts and stats routes
- [x] 4.24 Register all new route modules on the Fastify app

---

## Phase 5 — Public Quiz API

- [x] 5.1 Create `src/modules/sessions/sessions.routes.ts`
- [x] 5.2 Implement `POST /api/sessions/start`:
  - [x] 5.2.1 Validate `username` (min 2, max 50 chars) with Zod
  - [x] 5.2.2 Fetch `numQuestions` from the settings row
  - [x] 5.2.3 Select random questions using `ORDER BY RANDOM()` via `prisma.$queryRaw`
  - [x] 5.2.4 Create `QuizSession` row with unique `sessionToken`
  - [x] 5.2.5 Create `SessionQuestion` rows with `displayOrder`
  - [x] 5.2.6 Return session token + questions with answers — **never include `isCorrect` in the response**
- [x] 5.3 Implement `GET /api/sessions/:token`: return session + questions if not yet submitted, 404 if not found, 409 if already submitted
- [x] 5.4 Implement `POST /api/sessions/:token/submit`:
  - [x] 5.4.1 Find session by token, return 409 if already submitted
  - [x] 5.4.2 Validate all submitted `questionId`s belong to this session
  - [x] 5.4.3 Insert all `UserAnswer` rows
  - [x] 5.4.4 Grade each SCQ question: 1 point if selected answer matches the correct answer
  - [x] 5.4.5 Grade each MCQ question: 1 point only if selected answer set exactly matches correct answer set
  - [x] 5.4.6 Compute `score = (correctAnswers / totalQuestions) * 100`
  - [x] 5.4.7 Update session with `submittedAt`, `score`, `correctAnswers`
  - [x] 5.4.8 If `allowReview=true`: return full per-question breakdown. If false: return only score totals
- [x] 5.5 Register session routes on the Fastify app under `/api/sessions`
- [x] 5.6 Verify full quiz flow works via API client (Postman, curl, or Bruno)
- [x] 5.7 Verify submitting the same token twice returns 409
- [x] 5.8 Verify `isCorrect` is never present in session start response

---

## Phase 6 — Frontend Bootstrap

- [x] 6.1 `cd frontend` and run `create-next-app` with TypeScript, Tailwind, ESLint, App Router, and src directory
- [x] 6.2 Run `npx shadcn@latest init` and select Default style, Neutral base color, CSS variables enabled
- [x] 6.3 Install shadcn components: `button`, `input`, `textarea`, `card`, `dialog`, `alert-dialog`, `table`, `badge`, `dropdown-menu`, `tabs`, `select`, `checkbox`, `radio-group`, `progress`, `toast`, `separator`, `label`, `form`
- [x] 6.4 Install additional packages: `sonner`, `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `zod`
- [x] 6.5 Create `src/lib/api.ts` with a typed fetch wrapper supporting `get`, `post`, `put`, `delete` methods with `credentials: "include"`
- [x] 6.6 Create `src/types/index.ts` with all shared TypeScript interfaces: `Question`, `Answer`, `QuizSession`, `SubmitResult`, `QuestionResult`, `AdminQuestion`, `Attempt`, `Setting`
- [x] 6.7 Set `NEXT_PUBLIC_API_URL` in `.env.local` pointing to `http://127.0.0.1:4000`
- [x] 6.10 Verify a shadcn `Button` component renders correctly on a test page

---

## Phase 7 — Admin Shell

- [x] 7.1 Create `src/contexts/AdminAuthContext.tsx` with admin state, `isLoading`, and `logout()` function
- [x] 7.2 Create `src/components/admin/AdminSidebar.tsx` with navigation links to all admin pages
- [x] 7.3 Highlight the active sidebar link using `usePathname()`
- [x] 7.4 Make the sidebar collapsible to icon-only on screens below 1024px
- [x] 7.5 Create `src/app/admin/layout.tsx` wrapping all admin pages with the sidebar and auth check
- [x] 7.6 Add redirect to `/admin/login` in the layout if admin is not authenticated
- [x] 7.7 Create `src/components/ui/PageHeader.tsx` with `title` prop and optional action button slot
- [x] 7.8 Create `src/components/ui/StatCard.tsx` accepting `label`, `value`, and `icon` props
- [x] 7.9 Create `src/components/ui/DataTable.tsx` as a reusable sortable + paginated table component
- [x] 7.10 Create `src/components/ui/EmptyState.tsx` with icon, message, and optional CTA button
- [x] 7.11 Create `src/components/ui/SkeletonTable.tsx` for loading state in admin tables
- [x] 7.12 Verify navigating to `/admin/dashboard` without auth redirects to `/admin/login`

---

## Phase 8 — Admin Pages

### Login
- [x] 8.1 Create `/admin/login/page.tsx` with email and password fields
- [x] 8.2 Connect form submit to `POST /api/admin/auth/login`
- [x] 8.3 Show inline error on failed login
- [x] 8.4 Redirect to `/admin/dashboard` on success
- [x] 8.5 Show loading spinner while request is in flight

### Dashboard
- [x] 8.6 Create `/admin/dashboard/page.tsx`
- [x] 8.7 Fetch data from `GET /api/admin/stats`
- [x] 8.8 Render 4 `StatCard` components: Total Questions, Total Attempts, Average Score, Active Sessions
- [x] 8.9 Render recent attempts table using `DataTable`
- [x] 8.10 Show skeleton loaders while stats are loading

### Question Management
- [x] 8.11 Create `/admin/questions/page.tsx` with `DataTable` of all questions
- [x] 8.12 Add search input (debounced 300ms) that filters by question body
- [x] 8.13 Add filter dropdowns for Type and Difficulty
- [x] 8.14 Add "New Question" button
- [x] 8.15 Add Edit and Delete action buttons per row
- [x] 8.16 Wire Delete to `AlertDialog` confirmation before calling `DELETE /api/admin/questions/:id`
- [x] 8.17 Create `src/components/admin/QuestionForm.tsx` as a shared form component for create and edit
- [x] 8.18 Add question body textarea field with character count
- [x] 8.19 Add Type radio group (SCQ / MCQ) — switching type resets correct answer selections
- [x] 8.20 Add Category select with "No category" option
- [x] 8.21 Add Difficulty select: Easy, Medium, Hard
- [x] 8.22 Add Explanation textarea (optional)
- [x] 8.23 Add dynamic answer list: each row has a text input and a correct answer checkbox (or radio for SCQ)
- [x] 8.24 Add "+ Add Answer" button (disabled at 6 answers)
- [x] 8.25 Add "Remove" button per answer (disabled when only 2 answers remain)
- [x] 8.26 Validate: at least 2 answers, exactly 1 correct for SCQ, at least 1 correct for MCQ
- [x] 8.27 Show inline validation errors on submit attempt
- [x] 8.28 Wire form submit to `POST /api/admin/questions` for create
- [x] 8.29 Wire form submit to `PUT /api/admin/questions/:id` for edit (pre-fill all fields)

### Categories
- [x] 8.30 Create `/admin/categories/page.tsx`
- [x] 8.31 List all categories with name, slug, and question count
- [x] 8.32 Add inline rename form per category row
- [x] 8.33 Add Delete button with `AlertDialog` (disabled if category has questions, show tooltip explaining why)
- [x] 8.34 Add "New Category" form at the top of the page

### Attempts
- [x] 8.35 Create `/admin/attempts/page.tsx` with paginated table of all submitted sessions
- [x] 8.36 Show: username, submitted date, score %, correct / total
- [x] 8.37 Make each row clickable to open the attempt detail view
- [x] 8.38 Create `/admin/attempts/[id]/page.tsx` for the detail view
- [x] 8.39 Show per-question breakdown: question body, user's selected answers, correct answers, explanation
- [x] 8.40 Highlight correct answers in green and wrong selections in red

### Settings
- [x] 8.41 Create `/admin/settings/page.tsx`
- [x] 8.42 Fetch current settings from `GET /api/admin/settings` and pre-fill the form
- [x] 8.43 Add number input for `numQuestions` (min 1, max 50)
- [x] 8.44 Add toggle switch for `allowReview`
- [x] 8.45 Add toggle switch for `timerEnabled`
- [x] 8.46 Show timer duration input (in minutes) only when `timerEnabled` is on
- [x] 8.47 Wire save button to `PUT /api/admin/settings`
- [x] 8.48 Show success toast on save, error toast on failure

---

## Phase 9 — Public Quiz Pages

### Homepage
- [x] 9.1 Create `/page.tsx` (root homepage)
- [x] 9.2 Add platform name/logo and short tagline
- [x] 9.3 Add username input with validation: min 2 chars, max 50 chars
- [x] 9.4 Add "Start Quiz" button
- [x] 9.5 On submit, call `POST /api/sessions/start`
- [x] 9.6 Store `sessionToken` and questions in React state or `sessionStorage`
- [x] 9.7 Redirect to `/quiz?token={sessionToken}` on success
- [x] 9.8 Show inline error if API call fails

### Quiz Interface
- [x] 9.9 Create `/quiz/page.tsx`
- [x] 9.10 Read `sessionToken` from query params on load
- [x] 9.11 Load questions from state or re-fetch from `GET /api/sessions/:token`
- [x] 9.12 Redirect to homepage if token is invalid or session is already submitted
- [x] 9.13 Initialize answers state: `Record<questionId, answerId[]>`
- [x] 9.14 Render top progress bar showing current position and answered/unanswered dots
- [x] 9.15 Render current question card with question body and type badge
- [x] 9.16 Render SCQ answers as a `RadioGroup` — selecting one deselects all others
- [x] 9.17 Render MCQ answers as a `Checkbox` group — multiple selectable
- [x] 9.18 Add "Previous" and "Next" navigation buttons
- [x] 9.19 Show "Submit Quiz" button when on the last question (or always visible with jump-to-review)
- [x] 9.20 On "Submit" click, show `AlertDialog` listing unanswered question count with confirm/cancel
- [x] 9.21 Format answers payload as `{ answers: [{ questionId, answerIds }] }`
- [x] 9.22 Call `POST /api/sessions/:token/submit` and store the result
- [x] 9.23 Redirect to `/results?token={sessionToken}` on success

### Results Page
- [x] 9.24 Create `/results/page.tsx`
- [x] 9.25 Load result from state or re-fetch from session token
- [x] 9.26 Show large animated score percentage (count-up animation from 0 to final score)
- [x] 9.27 Show animated SVG score ring filling to the final percentage
- [x] 9.28 Show grade band label: Excellent (≥85%), Good (≥70%), Pass (≥50%), Needs Improvement (<50%)
- [x] 9.29 Show "X out of Y correct" count
- [x] 9.30 If `allowReview` is true, render accordion list of all questions:
  - [x] 9.30.1 Each accordion item header shows question number and a correct/incorrect icon
  - [x] 9.30.2 Each accordion body shows all answer options with green (correct) and red (wrong selected) highlights
  - [x] 9.30.3 Show explanation text below answers if present
- [x] 9.31 Add "Try Again" button that clears state and navigates to `/`

---

## Phase 10 — Polish & Quality Pass

### Loading States
- [ ] 10.1 Add shimmer skeleton to every admin table that loads async data
- [ ] 10.2 Add loading spinner to all submit/save buttons while request is in flight
- [ ] 10.3 Add `EmptyState` component to: question list, category list, attempts list (when no data exists)
- [ ] 10.4 Add empty state to quiz results review if no review data is available

### Error Handling
- [ ] 10.5 Wrap every API call in a try/catch
- [ ] 10.6 Show Sonner error toast for any failed API call
- [ ] 10.7 Show Sonner success toast for every successful create/update/delete in admin
- [ ] 10.8 Handle 401 response globally in the API client: redirect to `/admin/login`
- [ ] 10.9 Handle invalid/missing session token on `/quiz`: redirect to `/` with error toast
- [ ] 10.10 Handle already-submitted session on `/quiz`: redirect to `/results` or homepage

### Responsive Design
- [ ] 10.11 Test homepage at 375px, 768px, 1280px — no overflow or broken layout
- [ ] 10.12 Test quiz interface at 375px — answer options stack cleanly, navigation buttons are full-width
- [ ] 10.13 Test results page at 375px — score ring and accordion are readable
- [ ] 10.14 Test admin dashboard at 375px — stat cards stack vertically, sidebar collapses
- [ ] 10.15 Test question form at 375px — dynamic answer list is usable on mobile
- [ ] 10.16 Ensure all touch targets are at least 44×44px

### Accessibility
- [ ] 10.17 Ensure every `<input>` has an associated `<label>`
- [ ] 10.18 Ensure every icon-only button has an `aria-label`
- [ ] 10.19 Ensure quiz answer options use proper `<fieldset>` and `<legend>` wrapping
- [ ] 10.20 Ensure correctness in results is conveyed by icon AND color (not color alone)
- [ ] 10.21 Verify keyboard navigation works through the full quiz flow (Tab, Enter, Space)
- [ ] 10.22 Verify color contrast meets WCAG AA on all surfaces (especially badge colors on cards)

### Security
- [ ] 10.23 Confirm `admin_token` cookie is set with `httpOnly: true` and `sameSite: lax`
- [ ] 10.24 Confirm `isCorrect` field is absent from `POST /api/sessions/start` response
- [ ] 10.25 Confirm all Zod schemas reject malformed payloads with a 400 response
- [ ] 10.26 Confirm JWT secret is read from environment variable, never hardcoded

---

## Phase 11 — Testing & Data

### Seed Expansion
- [ ] 11.1 Expand seed to at least 30 questions total
- [ ] 11.2 Ensure at least 10 MCQ questions are seeded
- [ ] 11.3 Ensure at least 10 questions include an explanation text
- [ ] 11.4 Spread questions evenly across all 3 categories
- [ ] 11.5 Include questions at all 3 difficulty levels

### End-to-End: User Flow
- [ ] 11.6 Visit homepage, enter username, start quiz
- [ ] 11.7 Answer all questions (mix of SCQ and MCQ)
- [ ] 11.8 Submit quiz and verify results page shows correct score
- [ ] 11.9 Verify review accordion shows correct green/red highlighting
- [ ] 11.10 Click "Try Again" and verify a new session starts with different questions

### End-to-End: Admin Flow
- [ ] 11.11 Login with `admin@quiz.com` / `admin1234`
- [ ] 11.12 Verify dashboard stats reflect correct numbers
- [ ] 11.13 Create a new SCQ question with 3 answers, 1 correct
- [ ] 11.14 Create a new MCQ question with 4 answers, 2 correct
- [ ] 11.15 Edit the SCQ question body and change the correct answer
- [ ] 11.16 Delete a question and verify it disappears from the list
- [ ] 11.17 Create a new category and assign a question to it
- [ ] 11.18 Try to delete a category that has questions — verify it is rejected
- [ ] 11.19 Change `numQuestions` in Settings to 5
- [ ] 11.20 Start a new quiz as a user and verify only 5 questions appear
- [ ] 11.21 View the attempt detail in admin and verify answers match what was submitted
- [ ] 11.22 Logout and verify admin session is cleared

### Edge Cases
- [ ] 11.23 Submit the same quiz session token twice — verify 409 response
- [ ] 11.24 Start a quiz when DB has fewer questions than `numQuestions` — verify it uses all available
- [ ] 11.25 Attempt admin login with wrong password — verify 401 and clear error message
- [ ] 11.26 Submit a question form with 0 correct answers — verify validation blocks it
- [ ] 11.27 Submit a SCQ question with 2 correct answers — verify validation blocks it

---

## Phase 12 — Submission Preparation

### Database
- [ ] 12.1 Run a full `pg_dump` of the database:
  ```
  docker compose exec db pg_dump -U postgres quiz_platform > database/quiz_platform.sql
  ```
- [ ] 12.2 Verify the `.sql` file includes all tables, seed data, and migrations

### Documentation
- [ ] 12.3 Write full `README.md` with: project description, tech stack, prerequisites, quick start steps, admin credentials, environment variable reference
- [ ] 12.4 Write `.env.example` with all variable names and placeholder values (no real secrets)
- [ ] 12.5 Write brief inline comments on any complex logic in the grading service and session start query

### Screen Recording
- [ ] 12.6 Record demo video showing:
  - [ ] 12.6.1 Start quiz as public user, complete all questions, view results
  - [ ] 12.6.2 Admin login
  - [ ] 12.6.3 Admin dashboard with real data visible
  - [ ] 12.6.4 Create a new question with answers
  - [ ] 12.6.5 Edit a question
  - [ ] 12.6.6 View an attempt detail
  - [ ] 12.6.7 Update settings
  - [ ] 12.6.8 Admin logout

### Final Checks
- [ ] 12.7 Run `docker compose down -v && docker compose up --build` and verify everything starts from scratch
- [ ] 12.8 Run migrations and seed on a fresh database: `npm run db:migrate && npm run db:seed`
- [ ] 12.9 Complete the full user + admin flow one more time on the fresh environment
- [ ] 12.10 Remove all `console.log` debug statements from production code
- [ ] 12.11 Ensure no hardcoded credentials or secrets exist in the codebase
- [ ] 12.12 Confirm `.env` is listed in `.gitignore` and not committed

### Archive
- [ ] 12.13 Assemble final folder: `frontend/`, `backend/`, `database/`, `docker-compose.yml`, `.env.example`, `README.md`, `demo.mp4`
- [ ] 12.14 Compress into `Web_Project_FNAME_LNAME.zip`
- [ ] 12.15 Verify the zip extracts correctly and README instructions work
- [ ] 12.16 Submit via the Google Form provided by the instructor

---

## Progress Summary

| Phase | Tasks | Done |
|-------|-------|------|
| 0 — Scaffold | 10 | 0 |
| 1 — Backend Bootstrap | 13 | 0 |
| 2 — Database & Seed | 13 | 0 |
| 3 — Admin Auth | 11 | 0 |
| 4 — Admin Endpoints | 24 | 0 |
| 5 — Public Quiz API | 8 | 0 |
| 6 — Frontend Bootstrap | 10 | 10 |
| 7 — Admin Shell | 12 | 12 |
| 8 — Admin Pages | 48 | 48 |
| 9 — Public Pages | 31 | 0 |
| 10 — Polish | 26 | 0 |
| 11 — Testing | 27 | 0 |
| 12 — Submission | 16 | 0 |
| **Total** | **249** | **0** |

