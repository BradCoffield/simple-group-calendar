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

- **Public submission** (`/submit`) — unauthenticated users submit events; multi-layer spam protection (honeypot `website` field, 3-second timer via `form_started_at`, in-memory rate limiting at 5/hour/IP, field validation); events always land in `approved: false` state
- **Contributor dashboard** (`/dashboard`) — authenticated users submit events (go to admin review) and view/manage their own submissions
- **Admin panel** (`/admin`) — approve/reject pending events, manage all events, manage users; events POSTed to `/api/events` (authenticated route) auto-approve
- **Embed** (`/embed`) — minimal FullCalendar view (`EmbedCalendar`) designed for iframe embedding in Wix/WordPress; `/api/events` and `/api/events/public` both have CORS headers (`Access-Control-Allow-Origin: *`)

### Auth & Roles

Roles live in Clerk `publicMetadata.role` (`"admin"` | `"contributor"`). The `/api/webhooks/clerk` route listens for `user.created` and auto-assigns `contributor` via Svix-verified webhooks. Role helpers are in `src/lib/auth.ts` (`getUserRole`, `isAdmin`, `isContributor`, `isAdminOrContributor`, `getCurrentUserInfo`). Role checks happen at both the page level and the API route level.

Public routes (no auth required, defined in `src/middleware.ts`): `/`, `/embed`, `/sign-in`, `/sign-up`, `/submit`, `/api/events` (GET), `/api/events/public` (POST).

### Database

Single `events` table defined in `src/db/schema.ts` (Drizzle ORM). Key fields: `approved` (boolean, default false), `submitted_by_user_id` (set to `public:<email>` for anonymous submissions), `color` (hex, default `#00a99d`). Connection in `src/db/index.ts` using `@neondatabase/serverless`. Schema changes: edit `src/db/schema.ts` then run `npx drizzle-kit push`. Generated migrations go in `/drizzle`.

> **Note:** Rate limiting in `/api/events/public` is in-memory (`Map`). It resets on cold starts and does not share state across serverless instances.

### Directory Structure

```
src/
├── app/
│   ├── page.tsx              # Public calendar view
│   ├── embed/                # Minimal calendar for iframe embedding
│   ├── submit/               # Public (unauthenticated) event submission
│   ├── dashboard/            # Contributor event submission + my events
│   ├── admin/                # Admin panel (role-gated)
│   ├── sign-in/ sign-up/     # Clerk auth pages
│   └── api/
│       ├── events/           # CRUD: GET approved, POST create (auth, auto-approves)
│       │   ├── [id]/         # PUT/DELETE single event
│       │   ├── public/       # POST public submissions (spam checks, never auto-approves)
│       │   ├── pending/      # GET pending (admin only)
│       │   └── mine/         # GET current user's events
│       ├── admin/            # users, set-role, invite, delete-user
│       └── webhooks/clerk/   # Auto-assign contributor role on user.created
├── components/
│   ├── calendar/             # Calendar.tsx, EmbedCalendar.tsx, EventModal.tsx
│   ├── admin/                # PendingEventsTable, AllEventsTable, UsersTable
│   ├── dashboard/            # EventForm, MyEventsTable
│   └── ui/                   # ColorPicker
├── db/                       # Drizzle schema + Neon connection
├── lib/
│   ├── auth.ts               # Role-checking helpers (server-side, uses currentUser())
│   └── cors.ts               # CORS helpers: corsResponse(), corsOptionsResponse()
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
