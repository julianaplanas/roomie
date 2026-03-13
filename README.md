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

### Step 1: Push your code to GitHub

Create a GitHub repo and push the project:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/roomies.git
git push -u origin main
```

### Step 2: Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in (GitHub login works)
2. Click **New Project** from the dashboard

### Step 3: Add PostgreSQL

1. Inside your new project, click **Add Service** > **Database** > **PostgreSQL**
2. Railway will provision a Postgres instance automatically
3. Click on the Postgres service, go to the **Variables** tab, and copy the `DATABASE_URL` — you'll need it in Step 5

### Step 4: Add your app service

1. Click **Add Service** > **GitHub Repo**
2. Select your Roomies repository
3. Railway will detect the `railway.toml` and use it for build/deploy config

### Step 5: Generate VAPID keys

Run this locally to generate your Web Push keys:

```bash
npx web-push generate-vapid-keys
```

This outputs a public key and a private key. Save both — you'll add them as environment variables next.

### Step 6: Set environment variables

Click on your app service in Railway, go to the **Variables** tab, and add each of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Click **Add Reference** > select the Postgres service's `DATABASE_URL` (Railway links it automatically) |
| `JWT_SECRET` | A random string, 32+ characters. Generate one with: `openssl rand -base64 32` |
| `VAPID_PUBLIC_KEY` | The public key from Step 5 |
| `VAPID_PRIVATE_KEY` | The private key from Step 5 |
| `VAPID_EMAIL` | `mailto:you@example.com` (your email) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same value as `VAPID_PUBLIC_KEY` |
| `CRON_SECRET` | A random string for protecting the cron endpoint. Generate one with: `openssl rand -base64 16` |

> **Tip**: For `DATABASE_URL`, use Railway's variable references instead of pasting the raw string. Click the **Add Reference** button and select it from the Postgres service — this way it stays in sync if the DB URL ever changes.

### Step 7: Deploy

Railway will automatically trigger a deploy when you push to `main`. The `railway.toml` runs:

```
npx prisma generate && npx prisma migrate deploy && npm run build
```

This generates the Prisma client, runs any pending migrations, and builds the Next.js app. You can monitor the build logs in the **Deployments** tab.

### Step 8: Get your public URL

1. Click on your app service > **Settings** > **Networking**
2. Click **Generate Domain** to get a `*.up.railway.app` URL
3. Optionally, add a custom domain here

### Step 9: Set up the daily task reminder cron

Roomies has an endpoint that sends push notifications for tasks due today. You need to call it on a schedule:

**Option A — Railway Cron Service (recommended)**

1. In your project, click **Add Service** > **Cron**
2. Set the schedule to `0 8 * * *` (every day at 8:00 AM UTC)
3. Set the command to:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR_APP_URL.up.railway.app/api/cron/task-reminders
   ```
   Replace `YOUR_CRON_SECRET` with the value you set in Step 6, and `YOUR_APP_URL` with your actual Railway domain.

**Option B — External cron service**

Use [cron-job.org](https://cron-job.org), UptimeRobot, or any HTTP cron service to make a GET request to:

```
GET https://YOUR_APP_URL.up.railway.app/api/cron/task-reminders
Header: Authorization: Bearer YOUR_CRON_SECRET
```

### Step 10: Install the PWA

Open your Railway URL on your phone:

- **iOS**: Open in Safari > tap Share > **Add to Home Screen**
- **Android**: Chrome will show an "Install" banner, or tap the menu > **Install app**

> **Note**: Push notifications require iOS 16.4+ on iPhones. On older iOS versions, the app works fine but won't receive push notifications.

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
