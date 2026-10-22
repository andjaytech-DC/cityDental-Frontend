# City Dental — Production-Readiness Checklist

**Status**: Draft, evidence-based.  
**Scope**: The currently deployed stack (Next.js BFF `apps/web` + NestJS API `apps/api`), not the future NestJS-only migration.  
**Rule**: `audit:bff:strict` is an architecture check only; passing it does not certify production readiness. Every gate below needs its own explicit evidence.

## 1. Authorization and tenant isolation

| Gate | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 1.1 | Admin routes return 401 without a valid session | Pass | `GET /api/auth/me` anonymous → 401; `GET /admin` anonymous → redirect; smoke test `cd-smoke.ps1` |
| 1.2 | Admin routes return full shell with valid session | Pass | All 10 admin pages returned 200 with `admin-sidebar-brand`, redirects disabled |
| 1.3 | Every Prisma query scopes `organizationId` to the session org | Pass (code audit) | `lib/db.ts` singleton, all `lib/*` queries use `session.organizationId`; smoke exports returned only org-scoped CSV rows |
| 1.4 | Location-scoped users cannot reach other locations' data | Untested | `getAccessibleLocationIds()` / `requireLocationAccess` exist in code; smoke test used a super-admin, which cannot validate least-privilege isolation |
| 1.5 | Non-admin roles cannot escalate via assignment | Untested | Guard logic exists in `lib/users.ts`; no role-assignment smoke performed |
| 1.6 | Audit log writes for security-relevant mutations | Partial | AuditLog writes exist in `writeAudit`, but `/api/auth/logout` does not revoke issued tokens (documented gap) |

## 2. Booking concurrency and duplicate-booking prevention

| Gate | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 2.1 | Sequential same-slot booking rejects | Pass | `POST /api/appointments/book` same slot twice → 409 overlap |
| 2.2 | Concurrent same-slot booking rejects (race-safe) | Fail | Overlap check and `Appointment.create` are separate queries outside a transaction (`apps/web/src/app/api/appointments/book/route.ts`); documented in `bff-route-map.json` notes |
| 2.3 | Same-appointment time conflict via admin action rejects | Untested | `lib/appointments.ts` `updateAppointment` has overlap re-check but same transaction boundary concern |
| 2.4 | Invalid input rejected | Pass | UUID validation → 400; status transition enum enforced in schema |

## 3. Session lifecycle, expiration, and revocation

| Gate | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 3.1 | Login issues signed JWTs in `Set-Cookie` | Pass | `citydental_access` / `citydental_refresh`, Secure, HttpOnly, SameSite=lax |
| 3.2 | Replaying valid access cookie authenticates | Pass | Exact cookie replay → `GET /api/auth/me` 200, identity matches, 19 permissions |
| 3.3 | Access token TTL enforced | Unexplained | TTL configured (`JWT_ACCESS_TTL=15m`); no live TTL expiration smoke performed |
| 3.4 | Logout revokes issued tokens | Fail | `clearAuthCookies()` clears cookies only; `tokenVersion` is not incremented on logout; old access JWT remains valid if re-presented |
| 3.5 | Logout redirects or clears UI state | Pass | `POST /api/auth/logout` → 200; subsequent `me` → 401 when cookie absent |
| 3.6 | Refresh token rotation / reuse detection | Untested | Refresh endpoint exists in code; no smoke coverage |
| 3.7 | Inactive user / suspended organization denied | Untested | Code checks `status !== ACTIVE` in `verifyCredentials`; no smoke coverage |


## 4. Payment processing and reconciliation

| Gate | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 4.1 | Unconfigured provider returns honest 503 | Pass | `POST /api/payments/create-order` → 503 NOT_CONFIGURED |
| 4.2 | Real payment provider integrated (Razorpay/Stripe/etc.) | Fail | Provider abstraction contains mock and stub implementations; Razorpay verification and order creation are placeholders |
| 4.3 | Webhook signature verified over raw body | Fail | Raw body is not preserved; HMAC verification cannot be applied to the exact payload |
| 4.4 | Webhook idempotency is race-safe | Fail | Idempotency is read-then-write on `providerPaymentId` without a unique constraint; concurrent deliveries can double-process |
| 4.5 | Webhook amount/currency mismatch rejected | Pass (code) | Schema checks exist; no live webhook smoke performed |
| 4.6 | Failed payment does not confirm appointment | Untested | Code path exists; no live webhook smoke performed |
| 4.7 | Payment records match appointment state | Untested | Transaction scope in `verifyAndConfirmPayment` exists; no live reconciliation smoke |

## 5. Notification delivery and failure recovery

| Gate | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 5.1 | Providers disabled send nothing | Pass | `COMMUNICATIONS_ENABLED=false`; booking smoke returned `emailStatus=NOT_CONFIGURED`, `whatsappStatus=NOT_CONFIGURED` |
| 5.2 | Booking succeeds without configured providers | Pass | Appointment created despite `NOT_CONFIGURED` communication statuses |
| 5.3 | Provider failure does not fail booking | Pass | Communication provider failures are swallowed on purpose |
| 5.4 | Real SMTP/SMS/WhatsApp delivery verified | Fail | Providers not configured in `.env`; no delivery smoke performed |
| 5.5 | Communication history audit recorded | Unexplained | `lib/communications.ts` writes `Communication` and `AuditLog`; no live smoke due to disabled providers |

## 6. Browser-level behavior and end-to-end workflows

| Gate | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 6.1 | Browser hydration without console errors | Untested | No headless-browser or Playwright/Cypress suite present in this repo |
| 6.2 | Booking wizard end-to-end (select → book → confirmation) | Untested | Server-side route responses verified; React rendering not verified |
| 6.3 | Cookie transport over HTTPS in browser | Untested | Verified over `curl` explicit header only; browser cookie behavior not tested |
| 6.4 | Accessibility / keyboard / responsive layout | Untested | Not part of this review scope |
| 6.5 | Real payment checkout flow in browser | Untested | No payment provider configured; no browser-level test |


## 7. Deployment operations, monitoring, backups, and recovery

| Gate | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 7.1 | `docker-compose.yml` deploys Postgres + Redis | Unexplained | File exists; Redis was **not listening** during smoke test, so service status unverified |
| 7.2 | `apps/worker` implements background jobs | Fail | `apps/worker` contains only an empty `src/` directory; root `dev` script references `pnpm --filter worker dev` with no `package.json` |
| 7.3 | Database migrations apply without data loss | Unexplained | Prisma migrations exist (init, hardening_comms, payment_booking); no production migration history or backup/restore procedure documented |
| 7.4 | Build artifacts reproducible | Partial | `apps/api/dist` and `apps/web/.next` built successfully during smoke test |
| 7.5 | Health endpoint available | Pass | `GET /api/v1/health` → 200; only endpoint mapped in NestJS |
| 7.6 | Log aggregation / error monitoring | Untested | No observability integration present |
| 7.7 | Secret rotation procedure | Untested | JWT secrets and provider keys live in `.env`; no rotation runbook |

## Retained test-data traceability (do not delete)

| Item | ID | Purpose |
| --- | --- | --- |
| Patient | `53471ef3-f8e6-47ba-a3f0-0d95b973983b` | Smoke patient, email `smoke.probe@citydental.local` |
| Appointment A | `887b0531-1500-45d4-a6ec-48f273e9859b` | First smoke appointment, 2026-09-21T03:30:00Z |
| Appointment B | `5620b3cc-9e2e-4237-8f32-7082ddbc98dc` | Second smoke appointment, 2026-09-21T04:30:00Z |

These records remain in `citydental_dev` per the evidence-preservation decision.

## Conclusion

No gate in this checklist currently certifies production readiness. The architecture audit (`audit:bff:strict`) correctly reports remaining work: 13 Next.js routes still served by Next.js, 41 web files reaching domain data, and `@prisma/client` still declared in `apps/web`. That architecture backlog is separate from, and does not substitute for, the seven readiness areas above.

## How to use

Update each "Status" cell when live evidence is produced. Move a gate to Pass only when a test or observed run supports it. Untested gates should be treated as Fail until proven otherwise.

