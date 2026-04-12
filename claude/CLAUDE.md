# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NavetteXpress** is a premium private chauffeur / airport-transfer booking platform for Dakar, Senegal. It is a full-stack Next.js 16 application with three distinct dashboards (Admin, Client, Driver) and a public landing page.

## Common Commands

```bash
# Development
npm run dev            # Start dev server on port 3000 (webpack mode)
npm run build          # Production build (webpack)
npm run lint           # Lint all source files

# Database (Drizzle ORM + Neon PostgreSQL)
npm run db:generate    # Generate SQL migration files from schema changes
npm run db:migrate     # Apply pending migrations
npm run db:push        # Push schema directly (dev only)
npm run db:studio      # Open Drizzle Studio UI

# Email
npm run email:preview  # Preview email templates
npm run email:all      # Generate all Resend templates

# Mobile (Capacitor / Android)
npm run mobile:sync          # Sync web build to Capacitor
npm run mobile:open:android  # Open in Android Studio
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router, webpack mode — not Turbopack)
- **Database**: Neon PostgreSQL (serverless) via Drizzle ORM
- **Auth**: NextAuth v4 with Credentials + Google OAuth; sessions stored in DB
- **Styling**: Tailwind CSS v4 + CSS custom properties (no Tailwind config file)
- **Icons**: `@phosphor-icons/react` only — **do not use `lucide-react`** in dashboards
- **Email**: Resend + React Email components
- **PDF**: jsPDF + jspdf-autotable for invoice generation
- **Mobile**: Capacitor (Android target)
- **AI agent**: `@anthropic-ai/sdk` (Claude) — admin agent at `src/lib/agent/`

### Directory Structure

```
src/
  app/
    (public pages)/     # Landing, flotte, services, temoignages, zones…
    admin/              # Admin dashboard (users, vehicles, bookings, ads, SEO…)
    client/             # Client dashboard (reservations, quotes, history)
    driver/             # Driver dashboard (planning, disponibilités, stats…)
    api/                # Route handlers grouped by domain
    auth/               # NextAuth sign-in/sign-up pages
  components/
    admin/              # Admin-specific UI components
    client/             # Client-specific UI components
    driver/             # Driver-specific UI components
    ui/                 # Shared primitives (shadcn-style)
    seo/                # JsonLd, structured data
    mobile/             # Capacitor-aware components
  db.ts                 # Lazy-init Drizzle client (proxy pattern)
  schema.ts             # Single source of truth for all DB tables/enums
  lib/
    auth.ts             # NextAuth config (Credentials + Google)
    agent/              # Claude AI admin agent + tools
    email.ts / resend-mailer.ts  # Email sending helpers
    invoice-pdf.ts      # PDF invoice generation
    utils.ts            # Shared utilities
  context/              # React contexts (e.g. DriverViewContext)
  hooks/                # Custom hooks (permissions, notifications, toast)
  utils/                # Role/permission helpers
```

### Database Schema (`src/schema.ts`)
All tables are defined in a single file. Key tables:
- `users` — roles: `admin | manager | driver | customer`; includes company fields, login-attempt tracking
- `bookings` — full lifecycle: `pending → assigned → approved → confirmed → in_progress → completed | cancelled`; price-approval flow between admin and client
- `vehicles` — linked to a driver; supports fleet page metadata
- `quotes` — separate quote request flow (`pending → sent → accepted | rejected | expired`)
- `reviews` — post-trip ratings tied to booking + driver
- `permissions` — RBAC table per role/resource/action

### Authentication & Authorization
- NextAuth session is extended with `role` and `id` from the `users` table
- Route protection is done in each layout/page via `getServerSession(authOptions)`
- Granular permissions checked via `src/hooks/usePermissions.ts` (client) and `src/utils/permissions.ts` (server)
- Account lockout after failed login attempts (tracked in `users` table)

### CSS Design Tokens
All colors are CSS custom properties defined in `src/app/globals.css`. Three theming namespaces:
- `--color-client-*` — client dashboard (dark, red accent `#FF2C2C`)
- `--color-driver-*` — driver dashboard (light by default, blue accent `#2563EB`)
- `--gold`, `--crimson` — public landing page (gold `#C9A84C`)

Use these variables instead of hardcoded hex values in any dashboard component.

### API Routes (`src/app/api/`)
Routes are organized by domain: `bookings`, `quotes`, `vehicles`, `users`, `reviews`, `locations`, `ads`, `invoices`, `driver`, `client`, `admin`, `agent`. Each folder contains `route.ts` files with typed request/response handlers.

### Environment Variables Required
```
DATABASE_URL          # Neon PostgreSQL connection string
NEXTAUTH_SECRET       # NextAuth signing secret
NEXTAUTH_URL          # App base URL
GOOGLE_CLIENT_ID      # (optional) Google OAuth
GOOGLE_CLIENT_SECRET  # (optional) Google OAuth
RESEND_API_KEY        # Email sending
```
