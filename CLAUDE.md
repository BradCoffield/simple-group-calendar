# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Production build
npm run start          # Start production server
npx eslint             # Lint
npx drizzle-kit push   # Push schema changes to Neon database
```

## Architecture Overview

**TRAILS Group Calendar** is a shared event calendar for library consortia members. It has three user tiers: public (unauthenticated), contributor (authenticated), and admin.

**Stack:** Next.js App Router (TypeScript) · React 19 · Tailwind CSS 4 · FullCalendar.io · Neon (serverless PostgreSQL) · Drizzle ORM · Clerk (auth + role management) · Svix (webhook verification)

### Key Flows

- **Public submission** (`/submit`) — unauthenticated users submit events; multi-layer spam protection (honeypot field, 3-second timer, rate limiting, validation); events land in pending state
- **Admin panel** (`/admin`) — approve/reject pending events, manage all events, manage users; events submitted by admins auto-approve
- **Calendar embed** (`/`) — public FullCalendar view; API routes have CORS headers for iframe embedding in Wix/WordPress

### Auth & Roles

Roles live in Clerk `publicMetadata`. The `/api/webhooks/clerk` route listens for `user.created` and auto-assigns the `contributor` role via Svix-verified webhooks. Role helpers are in `src/lib/auth.ts` (`getUserRole`, `isAdmin`, `isContributor`, etc.). Role checks happen at both the page level and the API route level.

### Database

Single `events` table defined in `src/db/schema.ts` (Drizzle ORM). Connection in `src/db/index.ts` using `@neondatabase/serverless`. Schema changes: edit `src/db/schema.ts` then run `npx drizzle-kit push`. Generated migrations go in `/drizzle`.

### Directory Structure

```
src/
├── app/
│   ├── page.tsx              # Public calendar view
│   ├── submit/               # Public event submission
│   ├── admin/                # Admin panel (role-gated)
│   ├── sign-in/ sign-up/     # Clerk auth pages
│   └── api/
│       ├── events/           # CRUD: GET approved, POST create
│       │   ├── [id]/         # PUT/DELETE single event
│       │   ├── public/       # POST public submissions (spam checks)
│       │   ├── pending/      # GET pending (admin only)
│       │   └── mine/         # GET current user's events
│       ├── admin/            # users, set-role, invite, delete-user
│       └── webhooks/clerk/   # Auto-assign contributor role
├── components/
│   ├── calendar/             # FullCalendar display + event modal
│   ├── admin/                # PendingEventsTable, AllEventsTable, UsersTable
│   ├── dashboard/            # EventForm, MyEventsTable
│   └── ui/                   # ColorPicker
├── db/                       # Drizzle schema + Neon connection
├── lib/
│   ├── auth.ts               # Role-checking helpers
│   └── cors.ts               # CORS helpers for embed API
├── styles/calendar.css       # FullCalendar overrides
└── types/clerk.d.ts          # Clerk type augmentations
```

### Environment Variables

```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/admin
NEXT_PUBLIC_APP_URL                          # Production URL (used for Clerk invite redirect)
```

### TypeScript Path Alias

`@/*` maps to `./src/*`.
