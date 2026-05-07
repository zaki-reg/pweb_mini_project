# Product Requirements Document
## Online Quiz Platform — SCQ/MCQ Bank
**University of Sétif 1 · Web Programming Mini Project · 2025–2026**

---

## 1. Overview

### 1.1 Purpose

The Online Quiz Platform is a web-based application that allows administrators to manage a bank of single-choice (SCQ) and multiple-choice (MCQ) questions. Public users can start a temporary quiz session by entering a username, receive a randomized set of questions, complete the quiz in an exam-style interface, and instantly receive an automatically graded score.

### 1.2 Goals

- Deliver a smooth quiz experience without requiring full user registration.
- Give administrators complete control over question creation, editing, deletion, and result review.
- Ensure fairness through randomized question selection and deterministic grading.
- Build the project with a modern, production-style full-stack architecture using Dockerized services.

### 1.3 Scope

| In Scope | Out of Scope |
|----------|-------------|
| Admin authentication | Full user registration/authentication |
| Question CRUD for SCQ and MCQ | Social login |
| Category/topic organization | Multiplayer quiz mode |
| Configurable quiz settings | Negative marking |
| Randomized quiz sessions | Essay/open-ended questions |
| Auto-grading and result review | Question import from external files |
| Admin dashboard and attempt history | Advanced analytics engine |
| Dockerized local development | Native mobile application |

---

## 2. Stakeholders

| Role | Responsibilities |
|------|-----------------|
| Admin | Manages questions, categories, settings, and reviews attempts |
| Public User | Starts a session, answers quiz questions, and receives score |
| Developer Team | Designs, builds, tests, deploys, and documents the system |
| Instructor / Evaluator | Evaluates the submission based on functionality, design, code quality, and creativity |

---

## 3. Technology Stack

### 3.1 Selected Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | **Next.js 16** |
| UI Components | **shadcn/ui** |
| Styling | **Tailwind CSS** |
| Frontend Language | **TypeScript** |
| Backend Runtime | **Node.js** |
| Backend Framework | **Fastify** |
| Backend Language | **TypeScript** |
| Database | **PostgreSQL** |
| ORM | **Prisma ORM** |
| Validation | **Zod** |
| Containerization | **Docker + Docker Compose** |
| Authentication | Cookie/session-based admin auth or JWT-backed admin auth |

### 3.2 Stack Rationale

- **Next.js 16** provides a modern React-based frontend with strong routing and server/client rendering flexibility.
- **shadcn/ui** gives a clean, customizable design system that helps achieve a polished UI quickly.
- **Tailwind CSS** supports rapid, consistent responsive styling.
- **Fastify + TypeScript** provides a fast, typed backend with clean plugin-based architecture.
- **PostgreSQL** is reliable, relational, and well-suited for normalized quiz data.
- **Docker** makes local setup, demo delivery, and evaluation easier and more consistent.

### 3.3 High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│                Next.js 16 App                │
│      (TypeScript + Tailwind + shadcn/ui)     │
│                                              │
│  /                 → Homepage                │
│  /quiz             → Quiz session UI         │
│  /results          → Final score + review    │
│  /admin/**         → Admin dashboard         │
└───────────────────────┬──────────────────────┘
                        │ HTTP / JSON API
┌───────────────────────▼──────────────────────┐
│            Fastify API (Node.js)             │
│         (TypeScript + Prisma + Zod)          │
│                                              │
│  Auth, Questions, Categories, Sessions,      │
│  Attempts, Settings, Randomization, Grading  │
└───────────────────────┬──────────────────────┘
                        │ Prisma ORM
┌───────────────────────▼──────────────────────┐
│                 PostgreSQL DB                │
└──────────────────────────────────────────────┘

         All services run through Docker Compose
```

---

## 4. Product Features

### 4.1 Administrator Features

- Log in to access the admin dashboard.
- Create, edit, and delete SCQ and MCQ questions.
- Define answer options and mark the correct ones.
- Organize questions into optional categories or topics.
- Configure quiz settings such as number of questions.
- View user attempts and final scores.
- Review detailed answers submitted in each attempt.

### 4.2 Public User Features

- Start a session using only a username.
- Receive a randomized set of quiz questions.
- Answer questions in an exam-like interface.
- Submit the quiz and instantly get the score.
- Review correct answers after submission if enabled by settings.

---

## 5. Functional Requirements

### 5.1 Public Quiz Flow

#### FR-U-01: Start Session
- User lands on the homepage.
- User enters a username.
- System validates the username.
- System creates a quiz session.
- System selects a randomized set of questions based on the configured number in settings.
- System redirects the user to the quiz interface.

#### FR-U-02: Take Quiz
- User sees one question at a time or a structured multi-question layout.
- SCQ questions allow one selected answer.
- MCQ questions allow multiple selected answers.
- User can move forward/backward through the session.
- The interface should clearly show progress.

#### FR-U-03: Submit Quiz
- User submits all selected answers.
- System validates that the session is still active and not already submitted.
- System stores the submitted answers.
- System grades the quiz automatically.
- System redirects the user to the results page.

#### FR-U-04: Grading Logic
- SCQ: full point only if the chosen answer matches the single correct answer.
- MCQ: full point only if the selected set exactly matches the correct set.
- Final score formula:

\[
\text{score percentage} = \frac{\text{correct answers}}{\text{total questions}} \times 100
\]

#### FR-U-05: View Result
- User sees score, number of correct answers, and optional review details.
- User sees the correct answers for each question if review is enabled.
- User can return to the homepage and start a new session.

### 5.2 Admin Flow

#### FR-A-01: Admin Login
- Admin enters credentials on `/admin/login`.
- System validates credentials.
- System creates an authenticated admin session.
- Admin is redirected to the dashboard.

#### FR-A-02: Admin Dashboard
- Show total number of questions.
- Show total attempts.
- Show average score.
- Show recent attempts.

#### FR-A-03: Question Management
- Admin can create a new question.
- Admin can edit an existing question.
- Admin can delete a question with confirmation.
- Admin can search and filter questions.

#### FR-A-04: Category Management
- Admin can create categories.
- Admin can rename categories.
- Admin can delete unused categories.

#### FR-A-05: Attempt Review
- Admin can see all quiz attempts.
- Admin can inspect a detailed view of one attempt.
- Admin can review score, chosen answers, and correct answers.

#### FR-A-06: Settings Management
- Admin can define the number of questions per quiz.
- Admin can enable/disable answer review.
- Admin can optionally configure a timer feature.

#### FR-A-07: Logout
- Admin can securely log out.
- Session/cookie/token must be invalidated.

---

## 6. User Stories

### 6.1 Public User Stories

- As a public user, I want to start a quiz quickly with only a username so that I can begin immediately.
- As a public user, I want random questions so that each session feels fair.
- As a public user, I want instant grading so that I know my result right away.
- As a public user, I want to review correct answers so that I can learn from mistakes.

### 6.2 Admin User Stories

- As an admin, I want to manage questions easily so that the quiz bank stays updated.
- As an admin, I want to mark correct answers clearly so that grading is accurate.
- As an admin, I want to configure the number of questions so that I can control exam length.
- As an admin, I want to review attempts and scores so that I can monitor platform usage.

---

## 7. Database Design

### 7.1 Core Tables

#### `admins`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID / BIGSERIAL | Primary key |
| name | VARCHAR(100) | Admin display name |
| email | VARCHAR(150) | Unique login email |
| password_hash | TEXT | Hashed password |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

#### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID / BIGSERIAL | Primary key |
| name | VARCHAR(100) | Category name |
| slug | VARCHAR(120) | Unique slug |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

#### `questions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID / BIGSERIAL | Primary key |
| category_id | FK | Nullable category reference |
| body | TEXT | Question statement |
| type | VARCHAR(10) | `scq` or `mcq` |
| difficulty | VARCHAR(20) | Optional bonus field |
| explanation | TEXT | Optional explanation |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

#### `answers`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID / BIGSERIAL | Primary key |
| question_id | FK | Parent question |
| body | TEXT | Answer text |
| is_correct | BOOLEAN | Correctness flag |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

#### `quiz_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID / BIGSERIAL | Primary key |
| username | VARCHAR(100) | Temporary public username |
| session_token | TEXT | Unique session token |
| started_at | TIMESTAMP | Session start time |
| submitted_at | TIMESTAMP | Nullable submit time |
| score | NUMERIC(5,2) | Nullable final percentage |
| total_questions | INTEGER | Snapshot of quiz size |
| correct_answers | INTEGER | Nullable final count |
| time_taken_seconds | INTEGER | Optional timer metric |

#### `session_questions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID / BIGSERIAL | Primary key |
| session_id | FK | Quiz session |
| question_id | FK | Assigned question |
| display_order | INTEGER | Question order |

#### `user_answers`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID / BIGSERIAL | Primary key |
| session_id | FK | Session reference |
| question_id | FK | Question reference |
| answer_id | FK | Selected answer |

#### `settings`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Single row table |
| num_questions | INTEGER | Configurable quiz size |
| timer_enabled | BOOLEAN | Timer toggle |
| timer_seconds | INTEGER | Optional duration |
| allow_review | BOOLEAN | Show answers after submit |
| updated_at | TIMESTAMP | Last update |

### 7.2 Notes

- `num_questions` should be configurable from the admin settings page.
- For `scq`, exactly one answer must be marked correct.
- For `mcq`, one or more answers may be marked correct.
- Random question selection must happen at session creation time and be stored in `session_questions`.

---

## 8. API Requirements

### 8.1 Public Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/sessions/start` | Start a quiz session |
| GET | `/api/sessions/:token` | Get current quiz session |
| POST | `/api/sessions/:token/submit` | Submit answers and grade quiz |

### 8.2 Admin Auth Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/auth/login` | Admin login |
| POST | `/api/admin/auth/logout` | Admin logout |
| GET | `/api/admin/auth/me` | Current admin profile |

### 8.3 Admin Resource Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/questions` | List questions |
| POST | `/api/admin/questions` | Create question |
| GET | `/api/admin/questions/:id` | Get single question |
| PUT | `/api/admin/questions/:id` | Update question |
| DELETE | `/api/admin/questions/:id` | Delete question |
| GET | `/api/admin/categories` | List categories |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |
| GET | `/api/admin/attempts` | List attempts |
| GET | `/api/admin/attempts/:id` | Attempt detail |
| GET | `/api/admin/settings` | Get settings |
| PUT | `/api/admin/settings` | Update settings |
| GET | `/api/admin/stats` | Dashboard statistics |

### 8.4 API Conventions

- All requests and responses use JSON.
- Validation errors return structured error objects.
- Zod schemas validate payloads at the Fastify route layer.
- Prisma handles database persistence.
- Authentication-protected admin routes must use Fastify middleware/hooks.

---

## 9. Frontend Requirements

### 9.1 Main Pages

| Route | Page |
|-------|------|
| `/` | Homepage / Start session |
| `/quiz` | Quiz interface |
| `/results` | Result and answer review |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Admin dashboard |
| `/admin/questions` | Question management |
| `/admin/categories` | Category management |
| `/admin/attempts` | Attempt history |
| `/admin/settings` | Settings management |

### 9.2 UI Component Requirements

The frontend should use **shadcn/ui** as the base component system with custom styling through Tailwind CSS.

Required UI building blocks:
- Button
- Input
- Textarea
- Card
- Dialog / Modal
- Table
- Badge
- Dropdown menu
- Toast / Sonner-style notifications
- Tabs
- Alert dialog
- Select
- Checkbox
- Radio group
- Progress bar

### 9.3 Quiz UI Requirements

- Clear question card layout.
- Distinct styling for SCQ vs MCQ selection patterns.
- Progress indicator.
- Submit confirmation dialog.
- Accessible keyboard navigation.
- Responsive mobile-first layout.

### 9.4 Admin UI Requirements

- Sidebar or top navigation for admin routes.
- Searchable question table.
- Filters for type/category/difficulty.
- Form builder for adding dynamic answer options.
- Attempt detail page with readable answer breakdown.

---

## 10. Backend Requirements

### 10.1 Fastify Modules

Recommended backend modules:
- `auth`
- `questions`
- `categories`
- `sessions`
- `attempts`
- `settings`
- `stats`

### 10.2 Service Responsibilities

| Service | Responsibility |
|---------|----------------|
| Auth Service | Admin login, logout, session verification |
| Question Service | CRUD on question bank and answers |
| Category Service | Category CRUD |
| Session Service | Session creation and question randomization |
| Grading Service | Evaluate submitted answers and compute score |
| Attempt Service | Fetch attempt lists and details |
| Settings Service | Manage quiz configuration |
| Stats Service | Produce dashboard totals and averages |

### 10.3 Validation and Error Handling

- Use Zod schemas for route input validation.
- Return typed API responses.
- Handle not-found, unauthorized, validation, and conflict errors consistently.
- Prevent duplicate submission of the same quiz session.

---

## 11. Dockerization Requirements

### 11.1 Services

The project should run through Docker Compose with at least these services:

| Service | Purpose |
|---------|---------|
| `frontend` | Next.js 16 app |
| `backend` | Fastify TypeScript API |
| `db` | PostgreSQL database |

### 11.2 Suggested Compose Flow

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    depends_on:
      - db

  db:
    image: postgres:17
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: quiz_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

### 11.3 Docker Goals

- One-command local startup.
- Consistent development environment.
- Easier demo for evaluators.
- Cleaner delivery in the final compressed submission.

---

## 12. Non-Functional Requirements

### 12.1 Performance
- Homepage and quiz views should load quickly on standard hardware.
- Grading should be near-instant after submission.
- Question retrieval and admin tables should remain responsive with moderate dataset sizes.

### 12.2 Security
- Hash admin passwords securely.
- Protect admin routes.
- Validate and sanitize all user input.
- Prevent duplicate or tampered submissions.
- Use environment variables for secrets.

### 12.3 Accessibility
- Semantic HTML structure.
- Keyboard-accessible forms and actions.
- Proper label associations.
- Clear focus states.
- Adequate color contrast.

### 12.4 Responsiveness
- Mobile-first layout.
- Support phone, tablet, and desktop widths.
- Ensure admin tables remain usable on smaller screens.

### 12.5 Code Quality
- Full TypeScript on frontend and backend.
- Reusable components and service layers.
- Clear folder structure.
- ESLint + Prettier.
- `.env.example` files.
- README with setup instructions.

---

## 13. Project Structure

### 13.1 Frontend Structure

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── quiz/page.tsx
│   ├── results/page.tsx
│   └── admin/
│       ├── login/page.tsx
│       ├── dashboard/page.tsx
│       ├── questions/page.tsx
│       ├── categories/page.tsx
│       ├── attempts/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/
│   ├── quiz/
│   └── admin/
├── lib/
├── hooks/
├── types/
└── public/
```

### 13.2 Backend Structure

```text
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── plugins/
│   ├── modules/
│   │   ├── auth/
│   │   ├── questions/
│   │   ├── categories/
│   │   ├── sessions/
│   │   ├── attempts/
│   │   ├── settings/
│   │   └── stats/
│   ├── lib/
│   ├── utils/
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── package.json
```

### 13.3 Root Structure

```text
quiz-platform/
├── frontend/
├── backend/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 14. Design Direction

### 14.1 Visual Style

- Modern academic dashboard feel.
- Clean spacing and strong readability.
- Card-based interfaces.
- Minimal but polished interaction feedback.
- Distinct admin and public areas.

### 14.2 Suggested Theme

- Neutral surfaces with a blue/teal primary accent.
- Strong contrast for answer states.
- Clear correctness states:
  - Green = correct
  - Red = incorrect
  - Gray = neutral/unanswered
  - Yellow/amber = warning or flagged state

### 14.3 Design Inspiration Goals

- Should look more polished than a standard classroom CRUD app.
- Should feel production-ready enough to score well on design and creativity.
- Should still remain simple enough to build within project constraints.

---

## 15. Milestones

| Milestone | Deliverable |
|-----------|-------------|
| M1 | Project setup: Next.js, Fastify, PostgreSQL, Docker |
| M2 | Database schema + Prisma migrations |
| M3 | Admin authentication |
| M4 | Question and category CRUD |
| M5 | Public session start + quiz interface |
| M6 | Submission + grading system |
| M7 | Results page + attempt review |
| M8 | Admin dashboard + settings |
| M9 | UI polish, responsiveness, QA, seed data |
| M10 | Final README, demo recording, zipped submission |

---

## 16. Submission Checklist

- [ ] Frontend source code included.
- [ ] Backend source code included.
- [ ] PostgreSQL schema/migrations included.
- [ ] Docker files included.
- [ ] README with setup/run steps included.
- [ ] Demo video included.
- [ ] Final archive named according to teacher instructions.

---

## 17. Final Recommendation

This project should be implemented as a **Dockerized monorepo** with a **Next.js 16 frontend** and a **Fastify TypeScript backend**, connected to **PostgreSQL** through **Prisma**. This stack gives a modern developer experience, strong type safety across the full stack, and a polished UI path through **shadcn/ui + Tailwind CSS**, while still keeping the architecture realistic and maintainable for a university mini project.

---

*Document version: 1.1 · Updated stack edition · May 2026*
