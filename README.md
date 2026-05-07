# Quiz Platform

A full-stack online quiz platform for managing and taking quizzes with support for Single Choice Questions (SCQ) and Multiple Choice Questions (MCQ).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Pages Overview](#pages-overview)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Admin Credentials](#admin-credentials)
- [Available Scripts](#available-scripts)

---

## Overview

Quiz Platform is a web application that allows administrators to create and manage quiz questions while users can take interactive quizzes. The platform supports two question types:

- **SCQ (Single Choice Question)**: Users select exactly one correct answer from multiple options
- **MCQ (Multiple Choice Question)**: Users can select multiple correct answers

### Key Capabilities

- Admin authentication with secure JWT cookies
- Question management (create, edit, delete) with validation
- Category organization for questions
- Random question selection for each quiz session
- Automatic grading with configurable scoring
- Review mode for users to see correct answers after submission
- Comprehensive attempt tracking and analytics

---

## Features

### Admin Features

- **Dashboard**: View total questions, attempts, average score, and recent activity
- **Question Management**: Create SCQ/MCQ questions with 2-6 answer options, difficulty levels, and explanations
- **Category Management**: Organize questions into categories with automatic slug generation
- **Attempt Tracking**: View all quiz submissions with detailed per-question breakdowns
- **Settings**: Configure number of questions per quiz, timer settings, and review permissions

### User Features

- **Quiz Start**: Enter username and begin a randomized quiz session
- **Interactive Quiz**: Answer SCQ via radio buttons, MCQ via checkboxes with progress tracking
- **Results**: View animated score percentage, grade band, and optional review of all questions
- **Re-attempt**: Start a new quiz with different random questions

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.5 | React framework with App Router |
| React | 19.2.6 | UI library |
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| shadcn/ui | - | Component library built on Radix UI |
| React Hook Form | 7.75.0 | Form handling |
| Zod | 3.25.76 | Schema validation |
| Sonner | 1.7.4 | Toast notifications |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime environment |
| Fastify | 5.8.5 | Web framework |
| Prisma | 7.8.0 | ORM |
| PostgreSQL | 17 | Database |
| Zod | 4.4.3 | Schema validation |
| bcrypt | 6.0.0 | Password hashing |
| JWT | - | Authentication |

### DevOps

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |

---

## Project Structure

```
pweb_miniproject/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── admin/       # Admin dashboard pages
│   │   │   ├── quiz/        # Quiz taking page
│   │   │   └── results/     # Results page
│   │   ├── components/     # React components
│   │   │   ├── admin/      # Admin-specific components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Utilities (API client)
│   │   └── types/          # TypeScript interfaces
│   └── package.json
│
├── backend/                  # Fastify backend API
│   ├── src/
│   │   ├── modules/        # Route modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── categories/# Category CRUD
│   │   │   ├── questions/  # Question CRUD
│   │   │   ├── attempts/  # Attempt tracking
│   │   │   ├── stats/      # Dashboard stats
│   │   │   └── sessions/  # Quiz session management
│   │   ├── middleware/    # Auth middleware
│   │   ├── lib/           # Utilities (Prisma client)
│   │   └── server.ts      # Fastify app entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── database/           # Migrations and seed
│   └── package.json
│
├── docs/
│   └── TASKLIST.md         # Phase-by-phase task tracking
│
├── docker-compose.yml      # Docker services configuration
├── .env.example            # Environment variable template
└── README.md              # This file
```

---

## Prerequisites

- **Node.js** 18+
- **Docker** and **Docker Compose**
- **PostgreSQL** 14+ (via Docker)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/zaki-reg/pweb_miniproject.git
cd pweb_miniproject
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

The default values in `.env.example` are configured for local development.

### 3. Start All Services

```bash
# Start database, run migrations, seed data, and start backend
docker compose up --build
```

This will:

- Start PostgreSQL database on port 5432
- Run database migrations automatically
- Seed initial data (admin user, categories, sample questions)
- Start the backend API on http://localhost:4000

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at **http://localhost:3000**

### 5. Access the Admin Dashboard

Navigate to **http://localhost:3000/admin/login**

---

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/quiz_platform` |
| `JWT_SECRET` | Secret key for JWT signing | `supersecretkey_change_in_prod` |
| `PORT` | Backend server port | `4000` |
| `FRONTEND_URL` | Allowed CORS origins | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000` |

---

## Pages Overview

### Public Pages

| Path | Description |
|------|-------------|
| `/` | Homepage with quiz start form |
| `/quiz?token={sessionToken}` | Interactive quiz interface |
| `/results?token={sessionToken}` | Score display and optional review |

### Admin Pages

| Path | Description |
|------|-------------|
| `/admin/login` | Admin authentication |
| `/admin/dashboard` | Overview stats and recent attempts |
| `/admin/questions` | Question list with CRUD operations |
| `/admin/categories` | Category management |
| `/admin/attempts` | All quiz attempt records |
| `/admin/attempts/[id]` | Detailed attempt breakdown |
| `/admin/settings` | Quiz configuration |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/auth/login` | Admin login |
| POST | `/api/admin/auth/logout` | Admin logout |
| GET | `/api/admin/auth/me` | Get current admin |

### Questions (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/questions` | List questions (paginated, filterable) |
| GET | `/api/admin/questions/:id` | Get single question |
| POST | `/api/admin/questions` | Create question |
| PUT | `/api/admin/questions/:id` | Update question |
| DELETE | `/api/admin/questions/:id` | Delete question |

### Categories (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/categories` | List categories |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |

### Attempts (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/attempts` | List attempts (paginated) |
| GET | `/api/admin/attempts/:id` | Get attempt detail |

### Stats (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |

### Settings (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/settings` | Get current settings |
| PUT | `/api/admin/settings` | Update settings |

### Sessions (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/start` | Start new quiz session |
| GET | `/api/sessions/:token` | Get session (not submitted) |
| POST | `/api/sessions/:token/submit` | Submit quiz answers |

---

## Database Schema

### Models

- **Admin**: Admin users for dashboard access
- **Category**: Question categories with auto-generated slugs
- **Question**: Quiz questions with type (SCQ/MCQ), difficulty, and explanation
- **Answer**: Answer options linked to questions
- **QuizSession**: Quiz attempt records with scores
- **SessionQuestion**: Questions assigned to each session
- **UserAnswer**: User's selected answers per question
- **Setting**: Global quiz configuration (numQuestions, timer, allowReview)

### Enums

- **QuestionType**: `SCQ`, `MCQ`
- **Difficulty**: `EASY`, `MEDIUM`, `HARD`

---

## Admin Credentials

| Field | Value |
|-------|-------|
| URL | http://localhost:3000/admin/login |
| Email | admin@quiz.com |
| Password | admin1234 |

---

## Available Scripts

### Backend

```bash
cd backend

# Development (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run migrations
npm run migrate

# Seed database
npm run seed

# Open Prisma Studio
npm run db:studio

# Generate Prisma client
npm run db:generate
```

### Frontend

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Docker

```bash
# Start all services
docker compose up --build

# Start specific service
docker compose up db
docker compose up backend

# Stop all services
docker compose down

# View logs
docker compose logs -f
```

---

## License

ISC