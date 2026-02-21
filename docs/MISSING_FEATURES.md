# StudioSync — Missing Features Beyond Role Matrix

Generated: 2026-02-21

## High Priority

1. **Waitlist management** — Enrollments table has `waitlisted` status but no UI for parents to join waitlists or admins to promote from waitlist
2. **Parent self-registration of new children** — Parents can only edit existing children, not add new ones via portal
3. **Admin invoices page** — The `invoiceRouter` has full admin CRUD but `/admin/billing` is a Stripe placeholder, not an invoice management page
4. **Attendance reports for admin** — Admin has analytics but no attendance-specific reporting (e.g., chronic absentees)
5. **Instructor attendance landing page** — `/instructor/attendance` is in the sidebar but likely routes to nothing (attendance is per-class via `[classId]/attendance`)

## Medium Priority

6. **Studio settings CRUD** — Settings page is read-only; no ability to update studio name, slug, contact info, branding
7. **Stripe Connect onboarding flow** — The billing page placeholder references it but no actual Stripe Connect setup exists
8. **Email notifications** — No notification system for: invoice sent, payment received, announcement published, enrollment confirmed
9. **Parent profile page** — `getProfile`/`updateProfile` procedures exist but no dedicated profile page in portal nav
10. **Class detail for parents** — Parents see enrolled classes but can't view detailed class info (schedule, instructor bio, etc.)

## Lower Priority

11. **Bulk enrollment import** — Admin can only enroll one-by-one
12. **Season archiving** — No way to archive/deactivate old seasons and associated data
13. **Instructor class notes** — No place for instructors to leave per-session or per-student notes beyond progress marks
14. **Export/download** — No CSV export for enrollments, attendance, invoices, or analytics
15. **Parent-admin messaging** — No direct communication channel beyond announcements

## Status Tracker

| # | Feature | Status | Commit |
|---|---------|--------|--------|
| 1 | Waitlist management | TODO | |
| 2 | Parent add children | TODO | |
| 3 | Admin invoices page | TODO | |
| 4 | Attendance reports | TODO | |
| 5 | Instructor attendance landing | TODO | |
| 6 | Studio settings CRUD | TODO | |
| 7 | Stripe Connect onboarding | TODO | |
| 8 | Email notifications | TODO | |
| 9 | Parent profile page | TODO | |
| 10 | Class detail for parents | TODO | |
| 11 | Bulk enrollment import | TODO | |
| 12 | Season archiving | TODO | |
| 13 | Instructor class notes | TODO | |
| 14 | Export/download | TODO | |
| 15 | Parent-admin messaging | TODO | |
