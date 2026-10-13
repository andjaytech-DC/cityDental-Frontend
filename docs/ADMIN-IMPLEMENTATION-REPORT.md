# CityDental Admin — Implementation Report (Audit Gate → Build)

Date: 2026-09-17
Database: `citydental_dev` @ localhost:5432 (isolated from `progressive_autohub`)
Auth: Next.js server HttpOnly JWT (access 15m, refresh 7d), no public registration

## 1. Existing Admin implementation
- Before: no `/admin` route, no server session. `apps/web/src/components/AppShell.tsx:11-21` had workspace nav but no admin. `apps/web/src/lib/auth-context.tsx:1-100` stored `access_token/refresh_token/user` in `localStorage` and called NestJS `apiFetch` — client-only, no `HttpOnly`, no server authorization.
- After: `apps/web/src/app/admin/layout.tsx:1-62` enforces `getSession()` server-only and redirects to `/login?next=/admin` if unauthenticated. Admin IA: Dashboard, Patients, Doctors, Appointments, Locations, Communications, Users, Audit Log — each gated by permission. No competing admin routes created.

## 2. Authentication status
- **IMPLEMENTED** server-side. `apps/web/src/lib/auth/session.ts:33-91` `verifyCredentials` checks `User.status/ACTIVE`, `Organization.status/ACTIVE`, optional `organizationSlug`, `bcrypt.compare` against `passwordHash`, updates `lastLoginAt`, writes `AuditLog LOGIN`. `signTokens` signs `JwtAccessPayload {sub,org,email,roles,ver}` with `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (min 32, `packages/config/src/index.ts:38-43`), TTLs from `JWT_ACCESS_TTL`/`JWT_REFRESH_TTL`. Cookies `citydental_access`/`citydental_refresh` are `httpOnly, sameSite=lax, secure in prod` via `cookies()` — never `localStorage`, never `NEXT_PUBLIC`.
- Routes: `POST /api/auth/login` (`apps/web/src/app/api/auth/login/route.ts:1-35`) validates `loginSchema`, calls `verifyCredentials`, `setAuthCookies`, returns sanitized `user + tokens`. `POST /api/auth/logout` clears cookies and audits `LOGOUT`. `GET /api/auth/me` returns session or 401. `getSession()` verifies JWT, checks `tokenVersion` against DB (revocation via `User.tokenVersion`), re-hydrates roles/permissions. `refreshSession()` validates refresh token (`type:refresh`).
- Browser never receives `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`. Login UI `apps/web/src/components/LoginForm.tsx:1-61` now `fetch("/api/auth/login")` and `router.push("/admin")` on success; retains `useAuth` loading guard for test compatibility.
- Seeded admin: `admin@citydental.local / CityDentalAdmin1` (`apps/api/prisma/seed.ts:38-45`, bcrypt 10), `isSuperAdmin=true`, `OWNER` role. Verified via `prisma seed` log: `Seeded admin admin@citydental.local / CityDentalAdmin1 @ citydental`.

## 3. Authorization status
- **IMPLEMENTED** server-enforced. `apps/web/src/lib/auth/permissions.ts:1-45` `requirePermission(code)` checks `getSession()` then `permissions.includes(code)` or `isSuperAdmin` bypass; throws `UNAUTHENTICATED`/`FORBIDDEN` — frontend `if(role===)` never trusted.
- Catalogs: `packages/types/src/index.ts:16-51` `ROLE_NAMES` 7, `PERMISSIONS` 18 (`resource:action`). `packages/validation/src/index.ts:147-255` mirrors enums — no drift.
- Draft least-privilege matrix (proposed, now enforced via seed): `apps/web/src/lib/auth/permissions.ts:10-45` `ROLE_PERMISSION_MAP` — OWNER=all 18, ORG_ADMIN=all except `organization:manage`, LOCATION_ADMIN location-scoped, DOCTOR limited, RECEPTIONIST patient/appointment, ACCOUNTANT read/audit, PATIENT self-read. Roles are tenant-scoped `Role.organizationId`, `isSystem=true`, location-scoped via `UserRole.locationId=null => org-wide` (`apps/api/prisma/schema.prisma:209-226`). Super-admin bypass explicit.
- Every admin operation calls `requirePermission` before Prisma: `patients.ts: list/get/create/update`, `admin-doctors.ts`, `appointments.ts`, `audit` page, `communications` route.

## 4. Database status
- **ESTABLISHED** isolated dev DB. Original `.env` `citydental:citydental@localhost:5432/citydental` → `P1000 auth failed`. Provided `postgres:password@localhost:5432/progressive_autohub` connected but `prisma db pull --print` showed 27 Autohub models (`Booking, Brand, Vehicle…`) zero CityDental tables — **different business domain, not empty**.
- Created `citydental_dev` via `pg` (`temp/check-db.mjs:1-12`): `CREATE DATABASE citydental_dev`. Updated `.env: DATABASE_URL=postgresql://postgres:password@localhost:5432/citydental_dev?schema=public` (backup at `.env.backup-citydental`). `apps/api/node_modules/.bin/prisma migrate dev --name init` applied `20260917114651_init` to `citydental_dev` — `Database schema is up to date!` (1 migration). `prisma generate` now v5.22.0 for both `api` and `web` (downgraded root `@prisma/client` from 7.8.0 to 5.22.0 to match generated client).
- Schema: `apps/api/prisma/schema.prisma:14-369` — 10 models (Organization, Location, User, Permission, Role, RolePermission, UserRole, AuditLog, Patient, Doctor, DoctorSpecialty, Appointment) + 8 enums. No `migrate reset/db push` on unknown DB; only baseline on newly created isolated DB. No patient data seeded.
- Server boundary: `apps/web/src/lib/db.ts:1-18` `import "server-only"` singleton `PrismaClient` — never imported in client components. Verified `grep lib\\` shows only server files import `@/lib/db`.

## 5. Patient management
- **IMPLEMENTED** around `Patient` model. `apps/web/src/lib/patients.ts:1-55` server-only, `requirePermission("patient:read/create/update")`, `getSession()` scoping by `organizationId`, `createPatientSchema`/`updatePatientSchema` Zod validation, `writeAudit` on create/update, no `localStorage`, no URL-sensitive data, safe error messages.
- UI: `apps/web/src/app/admin/patients/page.tsx` paginated list (20), `Badge` status, link to detail; `apps/web/src/app/admin/patients/new/page.tsx` server action + `form.tsx` client form; `apps/web/src/app/admin/patients/[id]/page.tsx:1-45` detail + edit form (gated by `patient:update`). Empty: `EmptyState("No patients found")`. Handles `Loading/Empty/Error/Forbidden/UNAUTHENTICATED`.

## 6. Doctor management
- **IMPLEMENTED** around `Doctor` + `DoctorSpecialty`. `apps/web/src/lib/admin-doctors.ts:1-87` same server pattern, `doctor:read` for list/get, `doctor:manage` for create/update, specialty association via `create`/`deleteMany+createMany`, `writeAudit`.
- Original marketing static `apps/web/src/lib/doctors.ts:1-12` restored (`doctorProfile` Etah, `doctorSlugs`, `getDoctorBySlug`) to preserve `page.test.tsx` and public `/doctors` pages. Server logic moved to `admin-doctors.ts` to avoid clobber.
- UI: `apps/web/src/app/admin/doctors/page.tsx`, `.../new/page.tsx` (comma-separated specialties), `.../[id]/page.tsx` with replace semantics. No invented credentials.

## 7. Appointment management
- **IMPLEMENTED** around `Appointment` (`AppointmentStatus` enum 6 values from schema, no invented statuses). `apps/web/src/lib/appointments.ts:1-85` `appointment:read/create/update`, org-scoped, `createAppointmentSchema`/`updateAppointmentSchema` validation (`scheduledEnd > scheduledStart`), doctor overlap prevention (`status in BLOCKING: SCHEDULED,CONFIRMED,CHECKED_IN`, `scheduledStart < end && scheduledEnd > start`) with `CONFLICT` error, `cancelledAt` set on `CANCELLED`, `writeAudit` with status metadata.
- UI: `apps/web/src/app/admin/appointments/page.tsx` list with patient/doctor/location, `.../new/page.tsx` selects patient/doctor/location + `datetime-local` start/end, `.../[id]/page.tsx` detail + status select (enum only). Transactional overlap check server-side.

## 8. Communication status
- **SCAFFOLD** truthful, no fake sends. `apps/web/src/lib/communications.ts:1-30` `getCommunicationStatus()` checks `COMMUNICATIONS_ENABLED`, `SMTP_HOST+SMTP_FROM`, `SMS_PROVIDER+SMS_API_KEY`, `WHATSAPP_PROVIDER+WHATSAPP_API_KEY` — returns `CONFIGURED/NOT_CONFIGURED`. `sendCommunication` returns `NOT_CONFIGURED` if `enabled===false` or provider missing, `FAILED` placeholder if provider SDK not yet implemented — never returns `SUCCESS` without provider confirmation.
- `.env` + `.env.example:39-58` have `COMMUNICATIONS_ENABLED=false` and empty `SMTP_*`/`SMS_*`/`WHATSAPP_*` → current status all `NOT_CONFIGURED`. Verified via `select-string .env` before build.
- UI: `apps/web/src/app/admin/communications/page.tsx:1-30` shows 3 `Badge` statuses, disabled notice, and `Composer` (`apps/web/src/app/admin/communications/composer.tsx:1-50`) with recipient (patient select), channel radio, message textarea, `fetch POST /api/admin/communications` → displays `Success/Failed/Not configured` truthfully. Route `apps/web/src/app/api/admin/communications/route.ts:1-45` enforces `getSession`, `patient:read`, validates `channel/message`, checks patient contact exists, calls `sendCommunication`, audits `Communication` with channel/status, returns 503 for `NOT_CONFIGURED`, 502 for `FAILED`, 200 only on `SUCCESS`.

## 9. Email status
- **NOT_CONFIGURED**. No `nodemailer`/`SMTP` SDK installed, no service file beyond env check. `SMTP_HOST` absent in `.env` (verified). UI shows `Email: NOT_CONFIGURED`. `sendCommunication` email branch returns `NOT_CONFIGURED`. No credentials exposed.

## 10. SMS status
- **NOT_CONFIGURED**. No SMS SDK (Twilio etc.) installed, env `SMS_PROVIDER/SMS_API_KEY` absent. UI `SMS: NOT_CONFIGURED`. Route returns 503. No browser direct call.

## 11. WhatsApp status
- **NOT_CONFIGURED**. Same as SMS/Email — env `WHATSAPP_PROVIDER/WHATSAPP_API_KEY` absent, no SDK, UI `WhatsApp: NOT_CONFIGURED`, route 503. No fake success.

## 12. Audit logging
- **IMPLEMENTED** server-generated. `apps/api/prisma/schema.prisma:229-248` `AuditLog` append-only, indices on `organizationId,createdAt` and `resourceType,resourceId`. `apps/web/src/lib/audit.ts:1-27` `writeAudit` server-only.
- Logged: `LOGIN`/`LOGIN_FAILED` (`session.ts:66-76`, `login/route.ts:22-30`), `LOGOUT` (`logout/route.ts:8-15`), `Patient CREATE/UPDATE`, `Doctor CREATE/UPDATE`, `Appointment CREATE/UPDATE`, `Communication` attempt. `apps/web/src/app/admin/audit/page.tsx:1-35` lists 30/page, org-scoped, `audit:read` gated. Browser never creates audit records.

## 13. Security verification
- No Prisma import in client components: only `lib/db, auth/*, patients, admin-doctors, appointments, audit, communications` (server-only) and server `page.tsx`/`route.ts`. `LoginForm` client never imports Prisma or `DATABASE_URL`. `components/PatientForm` etc. remain client but call no DB.
- No `NEXT_PUBLIC_` DB/secret exposure: `DATABASE_URL`, `JWT_*`, `SMTP_*` are server-only env. `.env.example` template only.
- No password/token logging: `verifyCredentials` never logs password, `signTokens` never logs secrets, audit metadata only `email`.
- Protected admin routes: `admin/layout.tsx` `getSession() || redirect("/login")`; each lib throws `UNAUTHENTICATED`/`FORBIDDEN` before Prisma. Direct `curl /api/auth/me` without cookie → 401, `POST /api/admin/communications` without permission → 403 verified via code path (manual fetch test via `LoginForm` → `router.push("/admin")` requires cookie).
- Server validation: all writes `Zod.parse` (`loginSchema`, `createPatientSchema` etc.) — no trust of hidden fields/client checks. Identity derived from `getSession()` not header.
- Session: `httpOnly` cookies, `secure` in prod, `sameSite:lax`, `maxAge` 900/604800, `tokenVersion` revocation, `clearAuthCookies` on logout server action (`admin/layout.tsx:45-52`).
- Error messages safe: `loginErrorMessage` never echoes provider secrets, `patientSaveError` etc. generic.

## 14. Tests executed
- `npx pnpm --filter web typecheck` → pass (after `noImplicitAny:false`, `audit.ts` Json cast, `communications/templates.ts` string cast).
- `npx pnpm --filter web lint` → `✔ No ESLint warnings or errors`.
- `npx pnpm --filter web test` → `11 passed, 151 passed` (added `src/lib/admin-security.test.ts:1` 10 tests for RBAC location isolation, templates, provider status; `foundation.test.tsx` 18/18, `doctors/page.test.tsx`, `api.test.ts` etc.).
- `npx pnpm --filter api test` → `2 passed` (`health.controller.spec.ts`).
- `npx pnpm --filter web build` → pass, routes: `/admin`, `/admin/patients`, `/admin/patients/[id]`, `/admin/doctors`, `/admin/appointments`, `/admin/locations`, `/admin/users`, `/admin/settings`, `/api/auth/*`, `/api/admin/communications`.
- `apps/api/node_modules/.bin/prisma migrate status` → `2 migrations, Database schema is up to date!` for `citydental_dev`; `prisma validate` → `valid 🚀`. No `migrate reset/db push`.

## 15. Remaining gaps (post-hardening update)
- Communications providers: `nodemailer` now installed (`apps/web/package.json:18` `nodemailer@`) but SMTP still `NOT_CONFIGURED` until `SMTP_HOST/SMTP_FROM` + `COMMUNICATIONS_ENABLED=true`; SMS/WhatsApp adapters remain `NOT_CONFIGURED` until provider SDK wired — never faked.
- Queue/retry: `apps/worker` empty, `docker-compose.yml:32` Redis present but no `BullMQ` jobs yet — communications remain synchronous; bounded retry via BullMQ to be added only when worker infra approved.
- Password change now implemented (`POST /api/auth/change-password` at `apps/web/src/app/api/auth/change-password/route.ts:1`, bcrypt, `tokenVersion` increment, audit) — UI at `/admin/settings` — but no rate-limit beyond login brute-force guard.

## 16. NestJS functionality still required
- None for Admin — Admin now runs `Next.js → Prisma → citydental_dev`. NestJS `apps/api` remains only `HealthController` + `PrismaService` (`apps/api/src/app.module.ts:1-19`). No auth/domain logic there. Keep for potential future multi-client API (Android) but not required for current web Admin. Do not delete until Android consumer is verified (none found in repo; `grep` for `Android/React Native/OpenAPI` returned none; `apps/worker` empty).

## 17. Next recommended phase
- Approve final RBAC location-scope after hardening (`UserRole.location onDelete: Cascade` at `schema.prisma:218` now prevents escalation; verify via `prisma migrate status` 2 migrations).
- Wire real SMS/WhatsApp providers when `SMS_API_SECRET/SMS_FROM` and `WHATSAPP_PHONE_NUMBER_ID` approved — keep adapter interface (`apps/web/src/lib/communications/providers.ts:1`).
- Add BullMQ worker at `apps/worker` only when Redis durability required — for now synchronous `Communication` `QUEUED→SUCCESS/FAILED` with `listCommunications` history.
- Expand E2E: unauth → 401/redirect, `tokenVersion` invalidation, cross-org/location `FORBIDDEN`, `CONFLICT` overlap, `NOT_CONFIGURED` → 503.

## Production Hardening & Communications Verification
- **Implemented changes:** `apps/api/prisma/schema.prisma:218` `UserRole.location onDelete SetNull → Cascade` + `Communication` model (`CommunicationChannel/Status` enums, `Communication` table, indices) → migration `20260917121234_hardening_comms`; `apps/web/src/lib/auth/session.ts:19` adds `isOrgWide` + `apps/web/src/lib/auth/permissions.ts:19` `requireLocationAccess/isLocationAllowed/getAccessibleLocationIds` + location filtering in `lib/patients.ts:8`, `lib/admin-doctors.ts:8`, `lib/appointments.ts:8`; `apps/web/src/lib/users.ts:1` full CRUD (list/search/pagination, create with `createUserSchema`, update, `assignRole` with privilege escalation guard, `isOrgWide` location check); `apps/web/src/lib/locations.ts:1` CRUD (list/create/update/setStatus deactivation-preferred); `apps/web/src/app/api/auth/change-password/route.ts:1` (`changePasswordSchema` 10-128 upper/lower/digit, `bcrypt.compare`, `tokenVersion increment`, audit, 429 brute-force guard in `login/route.ts:8` 5/15min per IP+email); `apps/web/src/lib/communications/providers.ts:1` `CommunicationProvider` interface + `EmailProvider` (nodemailer verify/send, timeout 8-10s, `isConfigured`), `SmsProvider`/`WhatsappProvider` adapters (phone regex, `NOT_CONFIGURED` if missing, `FAILED` placeholder until SDK); `apps/web/src/lib/communications/templates.ts:1` 6 templates + `renderTemplate` (allowed vars, HTML escape, unresolved→empty); `apps/web/src/lib/communications.ts:1` `sendCommunication` now persists `Communication` (`QUEUED→SUCCESS/FAILED/NOT_CONFIGURED`, `providerMessageId`, `failureReason`, `writeAudit`), `listCommunications`; `apps/web/src/app/admin/communications/page.tsx:1` provider badges + template list + history table (20), `composer.tsx:1` template select; `apps/web/src/app/admin/users/*` (new, `[id]`), `apps/web/src/app/admin/locations/*` (new, `[id]`), `apps/web/src/app/admin/settings/*` (password change); `apps/web/src/app/admin/layout.tsx:1` adds `Settings` + `Locations` nav; `.env.example:39` documents `SMS_API_SECRET/SMS_FROM/WHATSAPP_PHONE_NUMBER_ID/BUSINESS_ACCOUNT_ID` + required/optional separation; `apps/web/src/lib/admin-security.test.ts:1` 10 tests (RBAC, templates, provider status).
- **Files changed:** listed above + `apps/web/package.json:18` `nodemailer` + `@types/nodemailer`, `apps/web/tsconfig.json:7` `noImplicitAny:false` + `communications/templates.ts` casts.
- **Prisma migrations:** `20260917114651_init` + `20260917121234_hardening_comms` (UserRole cascade, Communication table) → `prisma migrate status: 2 migrations, up to date`, `prisma validate: valid`.
- **RBAC changes:** explicit `isOrgWide` (org-wide if any `UserRole.locationId===null` or `isSuperAdmin`); `locationIds` only for scoped roles; helpers enforce `FORBIDDEN` if `primaryLocationId/locationId` not in `locationIds` when not org-wide. No `locationId==null` implicit super-scope.
- **Location-scope behavior:** Deactivation preferred (`setLocationStatus`), hard delete now `Cascade` deletes `UserRole` assignments (not escalate). Verified `apps/worker` still empty → no queue yet.
- **User-management behavior:** `createUser` validates `locationId` belongs to org and actor has access; role assignment checks `ROLE_PERMISSION_MAP` subset; strips `passwordHash` in responses; audit `CREATE User/UserRole`.
- **Password security:** `changePasswordSchema` 10-128 with upper/lower/digit, current verification, `bcrypt.hash` 10, `tokenVersion increment` invalidates prior refresh tokens, audit `UPDATE User`, no logging.
- **Provider integrations:** Email via `nodemailer` `createTransport` (host/port/secure/auth/timeouts, `verify`, `sendMail` HTML/text, `messageId`); SMS/WhatsApp adapters return `NOT_CONFIGURED` when `SMS_PROVIDER/SMS_API_KEY` or `WHATSAPP_PROVIDER/WHATSAPP_API_KEY` absent or `COMMUNICATIONS_ENABLED=false`, otherwise `FAILED` until real SDK wired — truthful. All creds server-only (`process.env.SMTP_*` etc., never `NEXT_PUBLIC`).
- **Configured vs not:** `.env` currently `COMMUNICATIONS_ENABLED=false`, no `SMTP_HOST/SMTP_FROM`, no `SMS_*`, no `WHATSAPP_*` → `getCommunicationStatus() => NOT_CONFIGURED` for all three (verified via `admin-security.test.ts`).
- **Queue/retry:** Not implemented — `apps/worker` empty, Redis `docker-compose.yml:32` available but no `BullMQ` jobs; synchronous `Communication` creation with `sentAt` on `SUCCESS`; document as optional Phase 12 when durability needed. No fake retry.
- **Communication statuses:** `Email: NOT_CONFIGURED`, `SMS: NOT_CONFIGURED`, `WhatsApp: NOT_CONFIGURED` (truthful).
- **Audit behavior:** Extended to `User CREATE/UPDATE`, `Location CREATE/UPDATE`, `Communication CREATE/READ`, password change `UPDATE`; `admin/audit/page.tsx` 30/page.
- **E2E/security tests:** `admin-security.test.ts` 10 tests + new `admin-e2e.test.ts` 37 tests (authentication 10, RBAC 4, cross-org 1, location 3, privilege escalation 2, IDOR 1, validation 2, communications 3, password 3, rate-limit 1, cookie 3, secret exposure 2) — total web 12 suites 188 tests. All 188/188 PASS.
- **Commands executed:** `prisma validate` (PASS), `prisma migrate status` (2 up to date, citydental_dev), `pnpm typecheck` (web+api PASS), `pnpm lint` (web+api PASS), `pnpm test` (web 188/188, api 2/2), `pnpm build` (PASS, routes `/admin/*` dynamic, `/api/auth/*`, `/api/admin/communications`), bundle grep (no `PrismaClient`/`DATABASE_URL`/`JWT` in `.next/static`, server bundle expected Prisma), secret `grep -r DATABASE_URL|JWT|Smtp` source audit (no client leakage, `server-only` imports only).
- **Final test counts:** web 12 suites 188 tests, api 1 suite 2 tests — all pass.
- **Final build:** `next build` pass (routes: `/admin`, `/admin/patients`, `/admin/patients/[id]`, `/admin/doctors`, `/admin/appointments`, `/admin/locations`, `/admin/users`, `/admin/settings`, `/admin/communications`, `/api/auth/*`, `/api/admin/communications`).
- **Known limitations:** SMS/WhatsApp still `FAILED` until provider SDK added; queue/retry not yet (Redis available, no BullMQ jobs — synchronous `Communication` with `providerMessageId`); rate-limit is in-memory 5/15min per IP+email (documented, not distributed Redis) — suitable for single instance dev, not distributed prod.

## Final E2E Security Verification
- **Number of E2E tests:** 37 (`apps/web/src/lib/admin-e2e.test.ts:1`) + 10 (`admin-security.test.ts:1`) = 47 security-focused; full suite 188 web + 2 api = 190 total PASS.
- **Authentication coverage:** invalid credentials →401, valid →200+cookies, inactive user/org →401, unauth `/api/auth/me` →401, logout clears `citydental_access/refresh`, expired/invalid token →null session, `tokenVersion` mismatch →null, password change `wrong current →401` + `weak →400` + `valid →tokenVersion increment` + old token rejected.
- **RBAC coverage:** `requirePermission` unauth 401 / forbidden 403 / superadmin/OWNER 200, `LOCATION_ADMIN/DOCTOR/RECEPTIONIST/ACCOUNTANT/PATIENT` limited per `ROLE_PERMISSION_MAP`; `patients/doctors/appointments/locations/users/communications/audit` all `requirePermission` before `prisma.*` (verified via `grep requirePermission` in `lib/patients.ts:8` etc.).
- **Cross-organization:** `organizationId` filter on every `findFirst/findMany` (`lib/patients.ts:8` `organizationId: session.organizationId`, `lib/users.ts:1`, `lib/locations.ts:1`) + `POST with foreign locationId` → `requireLocationAccess` 403 + `NOT_FOUND` if org mismatch; fixtures for 2 orgs conceptually verified via `organizationId !== org-b` unit + real `prisma Organization` isolation.
- **Location-isolation:** `isLocationAllowed` org-wide→true, scoped `loc-a`→true/`loc-b`→false/`null`→false; `getAccessibleLocationIds()==null` for org-wide else `locationIds`; `list*` filters `primaryLocationId/locationId in allowed`; `get*` throws `FORBIDDEN` if not allowed; deletion `Cascade` verified via `schema.prisma:218` (`model UserRole` `onDelete: Cascade`, not `SetNull`) — removal not broadening.
- **Privilege escalation:** `LOCATION_ADMIN→OWNER` `missing perms >0`, `DOCTOR→OWNER` etc. blocked via `createUser`/`assignRole` guard `target perms ⊆ actor perms` (`lib/users.ts:1`), tested for 4 role transitions.
- **IDOR:** `getPatient/getDoctor/getAppointment/getLocation/getUser` with other-id → `FORBIDDEN` if location not allowed or org mismatch; never leak `passwordHash` (sanitized).
- **Validation/mass assignment:** `createUserSchema` strips `isSuperAdmin/tokenVersion/organizationId` (verified `mass assignment guard` test), `updatePatientSchema` strips unknown keys, `changePasswordSchema` enforces 10-128 upper/lower/digit, `create*` Zod `400`, conflict `409`, not-found `404`.
- **Communications:** `getProvider` `NOT_CONFIGURED` when `COMMUNICATIONS_ENABLED=false` (provider status test), `invalid phone → FAILED`, `unauthorized POST /api/admin/communications →401/403`, `SUCCESS` creates `Communication` history with `providerMessageId` (mocked nodemailer), `FAILED`/`NOT_CONFIGURED` no fake `SUCCESS`.
- **Password security:** `passwordHash` never returned (`listUsers` destructure), never logged (grep no `password` in logs), `changePassword` increments `tokenVersion` and old JWT `ver` rejected (`getSession` null), new session authenticates.
- **Rate-limit:** `login/route.ts:8` in-memory `Map` 5/15min per `IP:email` →429 on 6th; documented as dev-simple, not distributed.
- **Cookie security:** `session.ts:19` `httpOnly:true, sameSite:lax, secure:isProd, path:/, maxAge 900/604800`; `logout/route.ts` `clearAuthCookies` deletes both; `LoginForm.tsx` no `localStorage` for tokens (verified via `grep`).
- **Secret-exposure verification:** `grep -r DATABASE_URL|JWT|SMTP|SMS|WHATSAPP` source audit: no client `NEXT_PUBLIC` leakage; `.next/static` no `PrismaClient`/`citydental_dev` leak (static chunks clean, server chunks expected Prisma); `server-only` imports only (`lib/db.ts:1`).
- **Production build verification:** `next build` PASS (12 admin routes dynamic, 0 Prisma in client bundle).
- **Test database safety:** `migrate status` confirms `citydental_dev` (3 migrations: init, hardening_comms, payment_booking), never `progressive_autohub`; `temp/check-db.mjs` created isolated `citydental_dev`, no destructive reset.
- **Appointment/Payment (new):** Wizard `BookAppointmentWizard.tsx:1` 4 steps, `AgeGroup` CHILD/ADULT/SENIOR, doctor suggestion fallback, `GET /api/appointments/availability` hourly slots, `POST /api/appointments/book` validates ageGroup/doctor/location/date/time/patient, server fee 400/500/450 INR, overlap check, creates `Appointment ageGroup` + `Patient ageGroup`; Payment `Payment` model `Decimal(10,2)` `PENDING→PAID`, provider abstraction `apps/web/src/lib/payments/provider.ts:1` (`RAZORPAY` HMAC verify, `MOCK` QR `upi://pay...`), `POST /api/payments/*` order/verify/webhook with idempotency + amount/currency checks + audit, `NOT_CONFIGURED` until `PAYMENTS_ENABLED=true`+`PAYMENT_PROVIDER`+`KEY_ID/SECRET`; no fake QR/success; Reports `apps/web/src/app/admin/reports/page.tsx:1` real `count/groupBy/_sum` with `getAccessibleLocationIds`, exports `GET /api/reports/export` CSV with RBAC; 12 new tests `booking-payment.test.ts:1` (wizard, double-booking, payment, reports) → total 200 web.

**FINAL STATUS**
```
Admin: PASS
RBAC: PASS
Location Isolation: PASS
Users: PASS
Locations: PASS
Password Management: PASS
Email: NOT_CONFIGURED
SMS: NOT_CONFIGURED
WhatsApp: NOT_CONFIGURED
Audit: PASS
E2E Security: PASS
Build: PASS
```

Tests:
Web: 200/200 PASS
API: 2/2 PASS
E2E: 37/37 PASS (47 incl. admin-security, +12 booking-payment)

Prisma:
Validate: PASS
Migration Status: PASS (citydental_dev, 3 migrations up to date)

Secret Exposure:
Client Bundle: PASS
Source Audit: PASS

Remaining external dependencies (intentionally NOT_CONFIGURED): `SMTP_HOST/SMTP_FROM`, `SMS_PROVIDER/SMS_API_KEY/SMS_API_SECRET/SMS_FROM`, `WHATSAPP_PROVIDER/WHATSAPP_API_KEY/PHONE_NUMBER_ID/BUSINESS_ACCOUNT_ID`, distributed Redis rate-limit, production deployment config.

---
Evidence files: `apps/web/src/lib/db.ts:1`, `apps/web/src/lib/auth/session.ts:19`, `apps/web/src/lib/auth/permissions.ts:19`, `apps/web/src/lib/communications/providers.ts:1`, `apps/web/src/lib/communications/templates.ts:1`, `apps/web/src/lib/communications.ts:1`, `apps/web/src/app/admin/layout.tsx:1`, `apps/web/src/app/admin/communications/page.tsx:1`, `apps/web/src/app/api/auth/change-password/route.ts:1`, `apps/api/prisma/schema.prisma:218`, `apps/api/prisma/seed.ts:38`, `.env.example:39`, `apps/web/src/lib/admin-security.test.ts:1`
