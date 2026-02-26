# StudioSync — Missing Features Beyond Role Matrix

Generated: 2026-02-21
Updated: 2026-02-21

## High Priority

1. **Waitlist management** — Enrollments table has `waitlisted` status. `promoteFromWaitlist` admin procedure exists but no dedicated UI for batch promote.
2. ~~**Parent self-registration of new children**~~ — DONE (portal.addStudent + UI "Add Student" button)
3. ~~**Admin invoices page**~~ — DONE (billing page rewritten with full invoice CRUD)
4. ~~**Attendance reports for admin**~~ — DONE (admin/attendance page with chronic absentee tracking)
5. ~~**Instructor attendance landing page**~~ — DONE (instructor/attendance class picker page)

## Medium Priority

6. ~~**Studio settings CRUD**~~ — DONE (settings page has full save with updateStudio mutation)
7. **Stripe Connect onboarding flow** — The billing page references it but no actual Stripe Connect setup flow exists
8. **Email notifications** — No notification system for: invoice sent, payment received, announcement published, enrollment confirmed
9. ~~**Parent profile page**~~ — DONE (portal/dashboard/profile/page.tsx with getProfile/updateProfile)
10. ~~**Class detail for parents**~~ — DONE (public catalog at /classes/[classId])

## Lower Priority

11. **Bulk enrollment import** — Admin can only enroll one-by-one
12. **Season archiving** — No way to archive/deactivate old seasons and associated data
13. **Instructor class notes** — No place for instructors to leave per-session notes beyond progress marks
14. **Export/download** — No CSV export for enrollments, attendance, invoices, or analytics
15. **Parent-admin messaging** — No direct communication channel beyond announcements

## Status Tracker

| # | Feature | Status | Commit |
|---|---------|--------|--------|
| 1 | Waitlist management UI | DONE | b199eb3 |
| 2 | Parent add children | DONE | 56926ac |
| 3 | Admin invoices page | DONE | ea71e42 |
| 4 | Attendance reports | DONE | a179881 |
| 5 | Instructor attendance landing | DONE | a179881 |
| 6 | Studio settings CRUD | DONE | 56926ac |
| 7 | Stripe Connect onboarding | DONE | b199eb3 |
| 8 | Email notifications | DONE | b199eb3 (Edge Function + helper lib) |
| 9 | Parent profile page | DONE | a179881 |
| 10 | Class detail for parents | DONE | (Phase 2) |
| 11 | Bulk enrollment import | DONE | b199eb3 |
| 12 | Season archiving | DONE | b199eb3 |
| 13 | Instructor class notes | DONE | b199eb3 |
| 14 | Export/download | DONE | b199eb3 |
| 15 | Parent-admin messaging | DONE | b199eb3 |

## ALL FEATURES COMPLETE

All 15 tracked features are implemented. Remaining work is operational:
- Stripe webhook handler (`/api/webhooks/stripe`) for auto-marking invoices paid
- Resend API key configuration in Supabase Edge Function secrets
- Seed data for testing (see plan: playful-questing-blossom.md Testing Strategy)
- Production domain setup and Vercel deployment config

## Design System Pass — COMPLETE

All pages updated to unified design system utilities across 4 commits:
- `ea71e42` — Core 13 files + 5 remaining pages (globals.css, Modal, sidebar, admin pages, portal pages)
- `738e05c` — 6 admin Phase 4/5 pages (analytics, attendance, calendar, media, announcements, events)
- `8286baf` — 9 instructor pages + 7 portal pages

Utilities applied: glass-card, glass-card-static, skeleton, empty-state, table-*, icon-btn, btn-gradient, filter-chip, section-heading, stat-number, input-glow, stagger animations, h-11 touch targets, text-[11px] badges.
