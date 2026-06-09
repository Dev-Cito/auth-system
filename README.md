# 🔐 Auth System

A full-stack authentication system built with **NestJS** + **Next.js**, featuring JWT access tokens and httpOnly cookie-based refresh tokens.

---

## 🚀 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, Tailwind CSS v4, Zustand, Framer Motion |
| Backend | NestJS, TypeORM, Passport JWT |
| Database | PostgreSQL |
| Auth | JWT (access token) + httpOnly cookie (refresh token) |
| Infra | Docker, pnpm monorepo |

---

## 🖥️ Live Demo

> Coming soon — deploy on Vercel + Railway

**Test credentials**

| Role | Email | Password |
|---|---|---|
| 👑 Admin | `admin@authsystem.com` | `Admin@123456` |
| 👤 User | `user@authsystem.com` | `User@123456` |

---

## 📁 Project Structure

```
auth-system/
├── frontend/     # Next.js app (port 3000)
├── backend/      # NestJS API (port 3001)
└── docker-compose.yml
```

---

## ⚙️ Local Setup

### 1. Clone & install

```bash
git clone https://github.com/Dev-Cito/auth-system.git
cd auth-system
pnpm install
```

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=devuser
DB_PASSWORD=devpassword
DB_NAME=auth_db

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

PORT=3001
NODE_ENV=development
```

### 4. Run migrations & seed

```bash
cd backend
pnpm migration:run
pnpm seed
```

### 5. Start both apps

```bash
# Backend
cd backend && pnpm start:dev

# Frontend (new terminal)
cd frontend && pnpm dev
```

| App | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |

---

## 🔑 Auth Flow

```
Login → access token (httpOnly cookie, 15m)
      + refresh token (httpOnly cookie, 7d)

401 → auto-refresh via /auth/refresh
   → new cookies set, request retried

Logout → cookies cleared + refresh token revoked in DB
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/api/auth/register` | — |
| `POST` | `/api/auth/login` | — |
| `GET` | `/api/auth/me` | ✅ |
| `POST` | `/api/auth/refresh` | — |
| `POST` | `/api/auth/logout` | ✅ |

Full docs at `/api/docs` (Swagger UI).

---

## 🚢 Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend + DB | [Render](https://render.com) |

Set `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api` on Vercel.
