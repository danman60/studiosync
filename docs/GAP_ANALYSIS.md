# StudioSync vs Studio Pro — Feature Gap Analysis

Generated: 2026-02-21
Source: deep-research-report.md (competitive analysis of Studio Pro)

## Tier 1: High-Impact Revenue Features

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Auto-pay / Recurring billing | TODO | `tuition_plans` table exists, need Stripe Subscription flow |
| 2 | Late fees | TODO | Auto-calculated per studio policy |
| 3 | Family/sibling discounts | TODO | Multi-student discounts, promo codes |
| 4 | ACH payments | TODO | Bank transfer option (lower fees) |
| 5 | Refunds | TODO | Admin-initiated partial/full refunds via Stripe |
| 6 | Payment terminals | DEFERRED | In-person card readers — requires hardware |

## Tier 2: Operational Essentials

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 7 | Waivers & e-signatures | TODO | Season-based, per-child, legally binding |
| 8 | Private lessons / appointments | TODO | 1-on-1 booking, instructor availability |
| 9 | Report cards | TODO | PDF generation from existing progress_marks |
| 10 | Time clock | TODO | Staff clock-in/out, payroll export |
| 11 | Data import/migration | TODO | CSV import from other platforms |
| 12 | Costume management | DEFERRED | Sizing, ordering, inventory per routine |

## Tier 3: Communication Gaps

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 13 | SMS / two-way texting | TODO | Twilio alongside Resend email |
| 14 | Voice calls | DEFERRED | Robo-Dialer, automated reminders |
| 15 | Push notifications | DEFERRED | Requires mobile app or PWA |
| 16 | Scheduled messaging | TODO | Queue sends for future date/time |
| 17 | Message templates | TODO | Reusable templates with merge fields |
| 18 | Segmented outreach | TODO | Filter by class type, age, status, tags |

## Tier 4: Events & Recital

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 19 | Recital Wizard | DEFERRED | Multi-act planning, quick changes, run sheets |
| 20 | Seating maps | DEFERRED | Venue layout, assigned seats |
| 21 | QR ticket scanning | TODO | Door check-in with phone camera |
| 22 | Volunteer management | DEFERRED | Sign-up slots, assignments |

## Tier 5: Platform / Integration

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 23 | Public API / webhooks | DEFERRED | REST endpoints, Zapier connector |
| 24 | Native mobile apps | DEFERRED | Parent + Manager apps (iOS/Android) |
| 25 | Multi-location support | DEFERRED | Separate locations under one account |
| 26 | Lead CRM | DEFERRED | Landing pages, trial classes, conversion tracking |
| 27 | Online store / POS | DEFERRED | Merchandise, costumes, in-person sales |

## Build Priority (Recommended Order)

1. **Recurring billing / auto-pay** — tuition_plans table exists, wire up Stripe Subscriptions
2. **Waivers & e-signatures** — new table, form builder, PDF generation
3. **Late fees** — small addition to invoice logic
4. **Family discounts / promo codes** — discount rules on enrollment
5. **Report cards** — PDF from existing progress_marks data
6. **SMS notifications** — Twilio integration alongside Resend

## Parity Already Achieved

- Public class catalog + registration
- Parent portal (children, enrollments, payments, announcements, messages)
- Admin dashboard (KPIs, analytics, calendar)
- Instructor portal (attendance, progress marks, class notes, roster)
- Invoice CRUD + Stripe Connect payments
- Waitlist management with auto-promote
- Season management with archiving
- Media library (upload, public/private toggle)
- Events + ticketing (basic)
- Announcements with targeting
- Parent-admin messaging
- Email notifications (Resend via Edge Function)
- CSV exports (enrollments, attendance, invoices)
- Stripe webhook for auto-marking paid
