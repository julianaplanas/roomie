# Roomies

A mobile-first PWA for roommates to manage shared expenses and household tasks. Combines Splitwise-style expense splitting with task management and a stats dashboard.

## Features

- **Expenses**: Track shared spending with equal splitting, category tags, and simplified debt calculation
- **Tasks**: One-time and recurring tasks with auto-scheduling and assignment
- **Stats**: Monthly spending breakdown, category charts, task completion rates
- **Push Notifications**: Task assignment and due date reminders via Web Push
- **PWA**: Installable via "Add to Home Screen" — no app store needed

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- JWT auth (httpOnly cookies)
- Tailwind CSS
- Web Push API

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — random 32+ character string
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate with `npx web-push generate-vapid-keys`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — same as VAPID_PUBLIC_KEY
- `VAPID_EMAIL` — your email as `mailto:you@example.com`
- `CRON_SECRET` — secret for the task reminder cron endpoint

### 3. Set up database

```bash
npx prisma migrate dev --name init
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Railway

1. Create a new project on [Railway](https://railway.app)
2. Add a PostgreSQL service
3. Add a new service from your GitHub repo
4. Set all environment variables from `.env.example`
5. Railway will use `railway.toml` to build and deploy

### Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

Copy the public and private keys into your environment variables.

### Cron job for task reminders

Set up a Railway cron job that calls:

```
GET /api/cron/task-reminders
Authorization: Bearer <CRON_SECRET>
```

Schedule: daily at 8:00 AM (`0 8 * * *`)

## Project Structure

```
src/
  app/
    (app)/          — Protected pages (home, expenses, tasks, stats, settings)
    api/            — API routes (auth, household, expenses, tasks, stats, notifications)
    login/          — Login page
    register/       — Register page
    join/[code]/    — Invite join page
  components/       — Shared UI components
  hooks/            — Custom React hooks
  lib/              — Utilities (auth, api, debt algorithm, prisma, etc.)
prisma/
  schema.prisma     — Database schema
```
