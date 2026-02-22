# StudioSync — Current Work

## Next Session: Seed Script via MCP

**Status:** Ready to build. MCP `supabase-CCandSS` restored in `~/.claude/mcp.json`.

### Task
Build seed data for the `studiosync` schema using `mcp__supabase-CCandSS__execute_sql`. Create a "Dans Dancers" test studio with realistic dance studio data.

### What to seed (all in `studiosync` schema)
1. **Studio** — "Dans Dancers", slug `dans-dancers`, director `danieljohnabrahamson@gmail.com`
2. **Staff** — owner + 3 instructors (Miss Sarah, Mr. James, Miss Olivia)
3. **Seasons** — current season (Sep 2025 - Jun 2026), next season (Sep 2026 - Jun 2027)
4. **Class types** — Ballet, Jazz, Hip Hop, Contemporary, Tap, Acro
5. **Levels** — Pre-Primary (3-5), Primary (6-8), Junior (9-11), Senior (12+), Adult
6. **Classes** — ~15 classes across types/levels/days, with pricing and capacity
7. **Families** — 8-10 families with realistic names
8. **Children** — 15-20 children across families, varying ages
9. **Enrollments** — Most children in 2-3 classes, some waitlisted
10. **Invoices** — Mix of paid, sent, overdue
11. **Invoice line items** — Tuition charges per enrollment
12. **Payments** — Some succeeded, some pending
13. **Class sessions** — Generate a few weeks of sessions
14. **Attendance** — Mix of present/absent/late for past sessions
15. **Announcements** — 2-3 (recital info, schedule change)
16. **Events** — Spring Recital, Summer Camp
17. **Promo codes** — EARLYBIRD 10% off, SIBLING $25 off
18. **Waivers** — Liability waiver
19. **Private lessons** — 2-3 scheduled
20. **Message templates** — Welcome, payment reminder, absence notification

### Key constraints
- All IDs are UUIDs (use `gen_random_uuid()` or hardcoded UUIDs for FK references)
- `studio_id` on every row
- Prices in cents (e.g., 8500 = $85.00)
- `day_of_week`: 0=Sunday, 1=Monday, etc.
- Times as `HH:MM:SS` strings
- Dates as `YYYY-MM-DD` strings
- `auth_user_id` on staff/families can be placeholder UUIDs (no real auth users yet)

### Schema reference
- Full types: `src/types/database.ts`
- 28 tables total in `studiosync` schema

### MCP command
```
mcp__supabase-CCandSS__execute_sql({ sql: "INSERT INTO studiosync.studios ..." })
```

### Operational items after seed
- [ ] Stripe webhook handler — ALREADY BUILT (`src/app/api/webhooks/stripe/route.ts`)
- [ ] Add service role key to `StudioSync/.env.local`
- [ ] Production domain + Vercel deployment
