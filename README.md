# TRAILS Simple Group Calendar

A full-stack event calendar application for the TRAILS library consortia. Built with Next.js, Neon (PostgreSQL), Clerk authentication, and FullCalendar.

## Features

- **Public Calendar** — Embeddable calendar view with month, week, and list views
- **Event Submission** — Authenticated users can submit events for approval
- **Admin Approval** — Admins can approve, edit, or reject submitted events
- **Role-Based Access** — Admin and contributor roles via Clerk metadata

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: Neon (serverless PostgreSQL) with Drizzle ORM
- **Auth**: Clerk
- **Calendar**: FullCalendar.io
- **Styling**: Tailwind CSS

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL` — Neon connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key

### 2. Database Setup

Run the schema against your Neon database:

```bash
# Option 1: Using Neon SQL Editor
# Copy contents of schema.sql and run in Neon console

# Option 2: Using psql
psql $DATABASE_URL -f schema.sql

# Option 3: Using Drizzle (after setting DATABASE_URL)
npx drizzle-kit push
```

### 3. Run Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the calendar.

## User Roles

### Promoting a User to Admin

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → select the user
3. Click **Metadata** tab
4. Set `publicMetadata` to:
   ```json
   { "role": "admin" }
   ```
5. Save changes

### Role Capabilities

| Role        | Submit Events | Edit Own Events | Approve Events | Edit All Events |
| ----------- | ------------- | --------------- | -------------- | --------------- |
| Guest       | ❌            | ❌              | ❌             | ❌              |
| Contributor | ✅            | ✅              | ❌             | ❌              |
| Admin       | ✅            | ✅              | ✅             | ✅              |

Note: Any authenticated user without a role can submit events (treated as contributor).

## Pages

- `/` — Public calendar (embeddable)
- `/dashboard` — Submit events and manage your submissions
- `/admin` — Approve pending events and manage all events
- `/sign-in` — Clerk sign-in page
- `/sign-up` — Clerk sign-up page

## Embedding in Wix

Add an HTML iframe element to your Wix page:

```html
<iframe
  src="https://your-vercel-deployment.vercel.app"
  width="100%"
  height="800"
  frameborder="0"
></iframe>
```

The public calendar page (`/`) is designed to be embedded — it has no navigation chrome.

## API Endpoints

| Method | Endpoint              | Auth     | Description                           |
| ------ | --------------------- | -------- | ------------------------------------- |
| GET    | `/api/events`         | Public   | Get approved events (with date range) |
| POST   | `/api/events`         | Required | Submit a new event                    |
| PUT    | `/api/events/[id]`    | Required | Update an event                       |
| DELETE | `/api/events/[id]`    | Required | Delete an event                       |
| GET    | `/api/events/pending` | Admin    | Get unapproved events                 |
| GET    | `/api/events/mine`    | Required | Get current user's events             |

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

Remember to add environment variables in Vercel project settings.
