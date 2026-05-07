# Taskflow — Full-Stack Task Management System

A production-ready task management application built with **Next.js**, **Angular**, and **MySQL**, fully containerized with **Docker Compose**.

##  Architecture

```
┌─────────────────────────────────────────────┐
│            Browser (Angular 17)              │
│   Login | Register | Kanban Board (3 cols)   │
└──────────────┬──────────────────────────────┘
               │ HTTP REST API (/api/*)
               │ Authorization: Bearer <JWT>
┌──────────────▼──────────────────────────────┐
│         Backend (Next.js 14 API Routes)      │
│  /api/auth/register  /api/auth/login         │
│  /api/tasks   /api/tasks/:id                 │
│  JWT Auth · Zod Validation · Bcrypt          │
└──────────────┬──────────────────────────────┘
               │ Prisma ORM
┌──────────────▼──────────────────────────────┐
│               MySQL 8                        │
│   users table · tasks table                  │
└─────────────────────────────────────────────┘
```

##  Quick Start with Docker

```bash
# 1. Clone and enter project
git clone <your-repo>
cd task-management

# 2. Copy env file
cp .env.example .env

# 3. Build and run everything
docker-compose up --build

# App is running at:
# Frontend → http://localhost:4200
# Backend  → http://localhost:3000
# DB       → localhost:3306
```

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17 (Standalone Components, Signals) |
| Backend | Next.js 14 (App Router API Routes) |
| Database | MySQL 8 via Prisma ORM |
| Auth | JWT (jose) + bcryptjs |
| Validation | Zod |
| Container | Docker + Docker Compose |

##  Project Structure

```
task-management/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # DB schema (User + Task)
│   ├── src/
│   │   ├── app/api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── register/route.ts
│   │   │   └── tasks/
│   │   │       ├── route.ts       # GET all, POST create
│   │   │       └── [id]/route.ts  # PUT update, DELETE
│   │   └── lib/
│   │       ├── auth.ts            # JWT sign/verify
│   │       ├── db.ts              # Prisma client singleton
│   │       └── middleware.ts      # withAuth() guard
│   └── Dockerfile
│
├── frontend/
│   └── src/app/
│       ├── auth/
│       │   ├── login/             # Login page
│       │   └── register/          # Register page
│       ├── core/
│       │   ├── guards/auth.guard.ts
│       │   ├── interceptors/auth.interceptor.ts  # Attaches JWT
│       │   ├── models/task.model.ts
│       │   └── services/
│       │       ├── auth.service.ts
│       │       └── task.service.ts
│       └── tasks/task-board/      # Kanban board UI
│
├── docker-compose.yml
└── .env.example
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✅ | Create account |
| POST | `/api/auth/login` | ✅ | Sign in, get JWT |
| GET | `/api/tasks` | ✅ | Get my tasks |
| POST | `/api/tasks` | ✅ | Create task |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |

## 🔧 Local Development (without Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env         # Set your DATABASE_URL
npx prisma db push           # Run migrations
npm run dev                  # Starts on :3000
```

### Frontend

```bash
cd frontend
npm install
npm start                    # Starts on :4200 with proxy to :3000
```

##  Auth Flow

```
1. POST /api/auth/login  →  { user, token }
2. Angular stores token in localStorage
3. HTTP Interceptor attaches: Authorization: Bearer <token>
4. Backend withAuth() verifies JWT on every protected route
5. User can only access their own tasks
```
# task-management
