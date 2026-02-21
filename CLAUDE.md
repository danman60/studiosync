# StudioSync — Claude Development Instructions

## Project Overview
Modern dance studio management SaaS. Part of CompSync ecosystem (StudioSync -> CompPortal -> CompSync).

## Tech Stack
- **Framework:** Next.js 15, TypeScript, App Router, `src/` directory
- **Styling:** Tailwind CSS 4, indigo/purple theme, light mode, sidebar nav
- **Data:** Supabase (shared project `netbsyvxrhrqxyzqflmd`, `studiosync` schema)
- **API:** tRPC v11 with 4 procedure tiers (public, protected, admin, owner)
- **Auth:** Supabase Auth (magic links)
- **Payments:** Stripe Connect (Standard)
- **ORM:** Supabase client only (no Prisma)
- **Types:** Manual types in `src/types/database.ts` (supabase gen types doesn't support custom schemas)

## Critical Rules
1. **Schema isolation:** ALL queries use `studiosync` schema. Never touch `public` schema (StudioSage).
2. **Tenant isolation:** Every query filters by `studio_id`. No cross-studio data leaks.
3. **Supabase MCP:** Use `supabase-CCandSS` for all DB operations (shared with StudioSage).
4. **No Prisma:** Use Supabase client directly. Service role client for server-side.
5. **Build before commit:** Every commit must pass `npm run build`.

## Architecture
- **Multi-tenant:** Subdomain routing (`{slug}.studiosync.net`)
- **Middleware:** Extracts studio slug from subdomain, sets `x-studio-slug` header
- **Root layout:** Resolves studio from slug, provides StudioContext + TRPCProvider
- **tRPC context:** Reads `x-studio-id` header, resolves user auth + role + family

## Procedure Tiers
| Tier | Usage | Auth |
|------|-------|------|
| `studioProcedure` | Requires studio context | No auth |
| `protectedProcedure` | Requires auth + studio | User auth |
| `adminProcedure` | Staff admin/owner | Admin role |
| `ownerProcedure` | Studio owner only | Owner role |

## File Structure
```
src/
  app/
    (public)/classes/     # No auth - class catalog
    (auth)/login/         # Auth pages
    (admin)/admin/        # Staff dashboard (sidebar nav)
    (portal)/dashboard/   # Parent portal (sidebar nav)
    api/trpc/[trpc]/      # tRPC API handler
  server/
    trpc.ts               # Context, procedures, middleware
    routers/_app.ts       # App router
    routers/catalog.ts    # Public catalog queries
  lib/
    supabase.ts           # Browser client (studiosync schema)
    supabase-server.ts    # Service role client
    trpc.ts               # createTRPCReact
    env.ts, utils.ts
  providers/trpc-provider.tsx
  contexts/StudioContext.tsx
  components/ui/sidebar.tsx
  types/database.ts       # Manual DB types
```

## UI Conventions
- Light theme (bg-gray-50 page, bg-white cards)
- Indigo-600 primary, sidebar navigation
- Text always explicit: text-gray-900 headings, text-gray-600 body
- Responsive: sidebar collapses on mobile with hamburger menu

## Database Schema (studiosync)
11 tables: studios, staff, families, children, seasons, class_types, levels, classes, enrollments, tuition_plans, payments
- All have RLS enabled
- Service role bypass policy on all tables
- Public read on catalog tables (studios, seasons, class_types, levels, classes where is_public=true)
- updated_at auto-trigger on all tables

## Supabase Config
- **URL:** https://netbsyvxrhrqxyzqflmd.supabase.co
- **MCP:** supabase-CCandSS
- **Schema:** studiosync (NOT public)

## Session Roadmap
1. Project scaffold + DB schema (DONE)
2. Public class catalog
3. Registration flow
4. Stripe integration
5. Admin dashboard
6. Parent portal
