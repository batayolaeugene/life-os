# LifeOS — Personal Daily Command Center

LifeOS is an offline-first full-stack personal management platform built with Next.js 15, Drizzle ORM, PostgreSQL, Zustand, and TanStack Query.

## Features
- **Cash Flow Tracking:** Daily expenses, income, custom categories, monthly budget thresholds.
- **Household Inventory:** Essential supplies tracking, low-stock warnings, one-click replenishment list.
- **Daily Micro-Routines:** Habit tracking, priority tasks, midnight auto-reset mechanism.
- **Unified Command Center:** At-a-glance dashboard summarizing budget, critical stock, and daily habits.
- **Offline-First PWA:** Full functionality offline using IndexedDB and Service Worker with background sync reconciliation.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```bash
DATABASE_URL="postgresql://username:password@host:port/dbname?sslmode=require"
AUTH_SECRET="your-32-char-secret"
```

3. Push database schema:
```bash
npm run db:push
```

4. Run development server:
```bash
npm run dev
```
