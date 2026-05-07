# Quiz Platform

An online quiz platform with SCQ/MCQ question management. Built with Next.js, Fastify, PostgreSQL, and Docker.

## Quick Start

```bash
# Start all services
docker compose up --build

# In a separate terminal, run migrations and seed
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

Open http://localhost:3000

## Admin Access

- URL: http://localhost:3000/admin/login
- Email: admin@quiz.com
- Password: admin1234

## Tech Stack

- Frontend: Next.js 16, Tailwind CSS, shadcn/ui
- Backend: Node.js, Fastify, TypeScript, Prisma
- Database: PostgreSQL
- Containerization: Docker + Docker Compose