# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000 (uses webpack)
npm run build            # Production build (uses webpack)
npm start                # Start production server
npm run lint             # Run ESLint

# Database (Drizzle ORM)
npm run db:generate      # Generate migrations from schema changes
npm run db:migrate       # Run pending migrations
npm run db:push          # Push schema directly to DB (dev only)
npm run db:studio        # Open Drizzle Studio UI

# Email
npm run test:email       # Test email sending via Resend
npm run email:preview    # Preview email templates locally
```

There is no test runner script configured — Jest is installed as a dev dependency but no `test` script exists in package.json.

## Architecture

### Multi-Portal Structure

The app serves three distinct roles with separate dashboards:

- **Public** (`/`) — Marketing pages, booking form, quote requests
- **Client Portal** (`/client/dashboard`) — View/manage bookings, reviews, profile
- **Driver Portal** (`/driver/*`) — Availability, planning, stats, vehicle reports
- **Admin Portal** (`/admin/*`) — Full system management: users, drivers, vehicles, bookings, assignments, ads

Authentication uses NextAuth v4 with credentials + Google OAuth. Sessions are stored in PostgreSQL via `@auth/drizzle-adapter`. The auth configuration is in `src/lib/auth.ts`.

### Database Layer

- **ORM**: Drizzle ORM — all DB access MUST go through Drizzle, never raw SQL
- **Schema**: `src/schema.ts` — single source of truth for all table definitions
- **Connection**: `src/lib/db.ts` (lazy-initialized Neon serverless client)
- **Migrations**: `./migrations/` directory, managed by `drizzle-kit`

Always import inferred types from the schema:
```typescript
import type { InsertDriver, SelectDriver } from '@/schema'
import { db } from '@/lib/db'
import { driversTable } from '@/schema'
import { eq, and, desc } from 'drizzle-orm'
```

Key booking statuses: `pending → assigned → approved → confirmed → in_progress → completed | cancelled`
Key quote statuses: `pending → in_progress → sent → accepted | rejected | expired`

### API Routes

All API routes live under `src/app/api/` organized by domain:

```
/api/auth/           — NextAuth + custom signin/signup/reset-password
/api/admin/          — Admin management (bookings, drivers, vehicles, roles, permissions)
/api/client/         — Client features (bookings, profile, reviews)
/api/driver/         — Driver features (availability, stats, bookings, profile)
/api/bookings/       — Booking CRUD
/api/quotes/         — Quote management
/api/invoices/       — Invoice generation (jsPDF)
/api/vehicle-reports/ — Driver vehicle damage reports
/api/ads/            — Advertisement system
/api/health/         — Health check endpoint
```

### Key Utilities

- `src/utils/admin-permissions.ts` — Role-based access control logic
- `src/utils/permissions.ts` — Permission checking helpers
- `src/hooks/usePermissions.ts` — React hook for permission checks
- `src/lib/resend-mailer.ts` — Transactional email via Resend
- `src/lib/invoice-pdf.ts` — PDF invoice generation via jsPDF

### Styling

- **Tailwind CSS v4** with PostCSS
- **Shadcn UI** (Radix UI primitives) for components in `src/components/ui/`
- Dark/light theme support; brand colors use red-passion (migrated from orange)
- Fonts: Cormorant Garamond (headings), DM Sans (body), Syne (accents)

### Infrastructure

- **Deployment**: Docker + Coolify (PaaS). `next.config.ts` uses `output: 'standalone'` and TypeScript build errors are intentionally ignored for Coolify compatibility.
- **Images**: Cloudinary CDN (all images migrated there)
- **Database**: Neon serverless PostgreSQL
- **Email**: Resend
- **Local DB**: `docker-compose.yml` runs PostgreSQL 15

### Code Conventions

- Use functional components; avoid classes
- Minimize `'use client'` — prefer React Server Components and Next.js SSR
- Variable names use auxiliary verbs: `isLoading`, `hasError`, `canEdit`
- Directory names use lowercase-with-dashes: `components/auth-wizard`
- Validate all inputs with Zod schemas
- Wrap all DB operations in try/catch
- Use transactions for multi-step DB operations
