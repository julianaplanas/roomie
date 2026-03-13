# Roomies App — Claude Code Build Prompt

## Project Overview

Build **Roomies**, a mobile-first PWA for roommates to manage shared expenses and household tasks. It combines Splitwise-style expense splitting with a task organizer and a stats dashboard. The app is installed via "Add to Home Screen" on phones — no App Store needed.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router) as a PWA
- **Backend**: Next.js API routes (same repo)
- **Database**: PostgreSQL via Railway Postgres service
- **ORM**: Prisma
- **Auth**: JWT-based (email + password), stored in httpOnly cookies
- **Push Notifications**: Web Push API (via `web-push` npm package)
- **PWA**: `next-pwa` for service worker and manifest
- **Deployment**: Railway (single service)
- **Styling**: Tailwind CSS + custom design tokens

---

## Design Direction

**Playful & colorful.** Think bold rounded corners, vibrant accent colors, friendly typography, and subtle micro-animations. Not childish — more like a well-designed consumer app that's a joy to use.

- Use a bright primary color (e.g. indigo or violet) with colorful category tags and avatar colors
- Rounded cards, soft shadows, generous whitespace
- Bottom tab navigation (mobile-first)
- Smooth transitions between views
- Empty states with friendly illustrations or emoji
- No dark mode for now — light UI only
- Font: Inter or similar clean sans-serif

---

## Core Features

### 1. Auth

- Email + password registration and login
- JWT stored in httpOnly cookie
- Protected routes — unauthenticated users always redirected to `/login`
- Each user has: `id`, `name`, `email`, `password_hash`, `avatar_color` (randomly assigned from palette on signup), `push_subscription` (JSON, nullable)

### 2. Households

- A user can create a household (they become the admin)
- A user can belong to only one household at a time
- **Invitation flow**:
  - Admin generates an invite link or invite code (6-char alphanumeric, expires in 48h)
  - New or existing users can join via the invite link
  - Joining requires accepting the invitation — it's not automatic
  - Admin can remove members
- Household has: `id`, `name`, `created_by`, `invite_code`, `invite_expires_at`

### 3. Expenses Tab

Track shared household spending.

**Adding an expense:**
- Title / description
- Amount (numeric)
- Category (Food, Utilities, Rent, Cleaning, Transport, Other) — shown as a colored tag
- Date
- Paid by (select from household members)
- Split between: everyone in the household OR select specific members
- Split is always equal among selected members

**Debt settlement:**
- **Simplified debt view** (default): calculate net balances across all expenses and show who owes whom, minimizing the number of transactions needed (Splitwise algorithm)
- **Manual settle**: any member can mark a specific debt as settled (adds a settlement record, adjusts balances)
- Settled expenses are archived and shown in history if toggled

**Expense list:**
- Show recent expenses on the tab, newest first
- Each card shows: title, amount, category color, paid by, date
- Tap to see full detail

**Do NOT include:** photo receipts, recurring expenses

### 4. Tasks Tab

Two types of tasks: **recurring** and **one-time**.

**Recurring tasks:**
- Title
- Assigned to (one household member)
- Frequency: Daily / Weekly / Biweekly / Monthly
- Next due date (auto-calculated from frequency)
- Completing a recurring task schedules the next occurrence automatically

**One-time tasks:**
- Title
- Assigned to (one household member)
- Optional due date
- Mark as done (with timestamp of who completed it)

**Task list UI:**
- Tabs or filter: All / Mine / Overdue
- Overdue tasks highlighted in red/orange
- Completed one-time tasks shown in a collapsible "Done" section
- Each card shows: title, assigned avatar, due date, status badge

**Task assignment notification:** when a task is assigned to someone, they get a push notification.
**Due date notification:** send a push notification the day a task is due (for tasks with a due date).

### 5. Stats Tab

A friendly overview of household health. No competitive framing — focus on clarity and encouragement.

**Expenses section:**
- Net balances: who owes what to whom (simplified debt view)
- Total household spending this month
- Spending breakdown by category (simple bar or donut chart)

**Tasks section:**
- Completion rate per member this month (progress bar style, not a ranking)
- Count of overdue tasks per member
- Count of tasks completed this month per member
- A small "on a roll 🔥" badge for anyone with 100% completion this month

**No fairness scores, no competitive rankings.** Keep the tone warm and informational.

### 6. Push Notifications

- Use Web Push API + `web-push` library
- Store each user's push subscription in the DB (`push_subscription` JSON field on User)
- Prompt for notification permission on first login (with a friendly explanation modal, not a raw browser prompt immediately)
- Notification triggers:
  1. **Task assigned**: notify the assignee when a task is created/assigned to them
  2. **Task due today**: a daily cron (Railway cron job or a lightweight scheduler) checks for tasks due today and sends reminders
- Notifications deep-link back to the Tasks tab when tapped

---

## Database Schema (Prisma)

```prisma
model User {
  id               String    @id @default(cuid())
  name             String
  email            String    @unique
  passwordHash     String
  avatarColor      String
  pushSubscription Json?
  householdId      String?
  household        Household? @relation(fields: [householdId], references: [id])
  createdAt        DateTime  @default(now())

  paidExpenses     Expense[] @relation("PaidBy")
  expenseSplits    ExpenseSplit[]
  assignedTasks    Task[]
  completedTasks   TaskCompletion[]
  sentSettlements  Settlement[] @relation("Payer")
  receivedSettlements Settlement[] @relation("Payee")
}

model Household {
  id            String    @id @default(cuid())
  name          String
  inviteCode    String    @unique
  inviteExpiresAt DateTime?
  createdById   String
  createdAt     DateTime  @default(now())

  members       User[]
  expenses      Expense[]
  tasks         Task[]
}

model Expense {
  id           String    @id @default(cuid())
  householdId  String
  household    Household @relation(fields: [householdId], references: [id])
  title        String
  amount       Decimal   @db.Decimal(10, 2)
  category     String
  date         DateTime
  paidById     String
  paidBy       User      @relation("PaidBy", fields: [paidById], references: [id])
  createdAt    DateTime  @default(now())

  splits       ExpenseSplit[]
}

model ExpenseSplit {
  id         String  @id @default(cuid())
  expenseId  String
  expense    Expense @relation(fields: [expenseId], references: [id])
  userId     String
  user       User    @relation(fields: [userId], references: [id])
  amount     Decimal @db.Decimal(10, 2)
  settled    Boolean @default(false)
}

model Settlement {
  id        String   @id @default(cuid())
  payerId   String
  payer     User     @relation("Payer", fields: [payerId], references: [id])
  payeeId   String
  payee     User     @relation("Payee", fields: [payeeId], references: [id])
  amount    Decimal  @db.Decimal(10, 2)
  note      String?
  createdAt DateTime @default(now())
}

model Task {
  id           String    @id @default(cuid())
  householdId  String
  household    Household @relation(fields: [householdId], references: [id])
  title        String
  type         String    // "recurring" | "one_time"
  frequency    String?   // "daily" | "weekly" | "biweekly" | "monthly" — null for one_time
  assignedToId String
  assignedTo   User      @relation(fields: [assignedToId], references: [id])
  dueDate      DateTime?
  completedAt  DateTime? // for one_time tasks
  isArchived   Boolean   @default(false)
  createdAt    DateTime  @default(now())

  completions  TaskCompletion[]
}

model TaskCompletion {
  id          String   @id @default(cuid())
  taskId      String
  task        Task     @relation(fields: [taskId], references: [id])
  completedBy String
  user        User     @relation(fields: [completedBy], references: [id])
  completedAt DateTime @default(now())
}
```

---

## App Structure

```
/app
  /login          → Login page
  /register       → Register page
  /join/[code]    → Join household via invite code
  /(app)          → Protected layout with bottom nav
    /home         → Dashboard / quick overview (optional landing after login)
    /expenses     → Expenses tab
    /tasks        → Tasks tab
    /stats        → Stats tab
    /settings     → Household settings, invite link, members, logout

/api
  /auth/register
  /auth/login
  /auth/logout
  /household/create
  /household/invite
  /household/join
  /household/members
  /expenses (GET, POST)
  /expenses/[id] (GET, DELETE)
  /expenses/settle (POST)
  /tasks (GET, POST)
  /tasks/[id] (PATCH, DELETE)
  /tasks/[id]/complete (POST)
  /stats
  /notifications/subscribe (POST)
  /notifications/send (internal)
  /cron/task-reminders (GET — called by scheduler)
```

---

## PWA Configuration

- `manifest.json`: name "Roomies", short_name "Roomies", display "standalone", background_color and theme_color matching primary brand color
- Icons: generate placeholder icons at 192x192 and 512x512
- Service worker via `next-pwa`: cache shell, offline fallback page
- `viewport` meta tag set correctly to prevent iOS zoom on input focus (font-size minimum 16px on all inputs)

---

## Key Implementation Notes

1. **Debt simplification algorithm**: implement a graph-reduction approach — compute net balance per user, then greedily match the largest creditor with the largest debtor until all are settled. This minimizes total transactions.

2. **Invite codes**: generate a random 6-char alphanumeric string, store with a 48h expiry. Validate on join. Admin can regenerate from Settings.

3. **Recurring task scheduling**: when a recurring task is completed, create a new Task record with `dueDate` set to `now + frequency`. The old task gets `isArchived: true`.

4. **Notification permission UX**: show a custom in-app modal explaining why notifications are useful before calling `Notification.requestPermission()`. Only show once per session if not yet granted.

5. **iOS PWA specifics**:
   - Add `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style` meta tags
   - Web Push works on iOS 16.4+ — note this in the Settings page for users on older iOS
   - All inputs must have `font-size: 16px` minimum to prevent zoom on focus

6. **Railway environment variables needed**:
   ```
   DATABASE_URL        → Railway Postgres connection string
   JWT_SECRET          → random 32+ char string
   VAPID_PUBLIC_KEY    → generated with web-push
   VAPID_PRIVATE_KEY   → generated with web-push
   VAPID_EMAIL         → mailto:you@example.com
   NEXT_PUBLIC_VAPID_PUBLIC_KEY → same as VAPID_PUBLIC_KEY (exposed to client)
   ```

7. **Cron job for task reminders**: implement `/api/cron/task-reminders` as a GET endpoint protected by a shared secret header. Configure Railway's cron job to call it daily at 8am.

8. **Error handling**: all API routes return consistent JSON `{ error: string }` on failure. Frontend shows toast notifications for errors and successes.

9. **Loading states**: every data-fetching action should have a loading skeleton or spinner. No blank flashes.

10. **Empty states**: every tab needs a friendly empty state (emoji + message + CTA) for when there's no data yet.

---

## Out of Scope (for this build)

- Photo receipts
- Recurring expenses
- Activity feed / history log
- Multiple households per user
- Admin transfer
- Currency selection (default to user's locale or EUR)

---

## Deliverables

1. Full Next.js PWA project with all features above implemented
2. Prisma schema and initial migration
3. `railway.toml` for deployment config
4. `.env.example` with all required variables
5. `README.md` with setup instructions, Railway deployment steps, and how to generate VAPID keys