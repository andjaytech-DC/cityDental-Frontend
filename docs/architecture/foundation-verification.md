# Foundation decision record

## Authentication: observed contract, not implemented

Sources under C:\Users\bobby\cityDental-Frontend: the web auth context/API client,
shared types/validation/config sources, and apps\api\prisma\schema.prisma.

Next.js -> existing API client -> NestJS AuthController -> AuthService -> Prisma
is the intended flow. AuthController/AuthService do not exist; no auth endpoints
were created in this task.

Frontend expects POST /api/v1/auth/login with email, password, optional
organizationSlug, and POST /api/v1/auth/refresh with refreshToken. Both expect
{ user, tokens }. No registration endpoint/contract exists. createUserSchema is
not evidence of public self-registration. Password-change schema has no route.

User: id, email, firstName, lastName, organizationId, organizationSlug,
isSuperAdmin, roles, permissions, locationIds. Shared catalogs define roles and
permissions; empty locationIds is documented as organization-wide. Tokens:
accessToken, refreshToken, expiresIn (positive access lifetime in seconds).

JwtAccessPayload defines sub, org, email, roles, ver; JwtRefreshPayload adds
 type: "refresh". JWT/bcrypt dependencies are present, not implementations.
Config requires separate secrets (minimum 32 characters), TTL defaults 15m/7d.
Algorithm, issuer, audience, clock tolerance, hashing cost are not defined.

Existing password validation (not silently unified): login/current password
8–128; create-user password 10–128; changed password 10–128 with uppercase,
lowercase and digit. Optional login slug 2–64; refresh token minimum 10.

Browser currently stores user/tokens in localStorage, sends Bearer access tokens,
restores cached UI state without server validation, refreshes only explicitly,
and logs out locally. No password is persisted. This is NOT server authorization.

Decisions required before authentication implementation:
- Initial owner/organization provisioning, invitations vs registration.
- Tenant slug semantics with globally unique User.email.
- Role-to-permission mapping, mixed location/org scopes, suspended accounts and
  organizations, super-admin behavior.
- Browser storage vs HttpOnly cookies; session lifetime, concurrent sessions,
  rotation/reuse detection, revocation/logout. tokenVersion exists but its checks
  and increment policy do not.
- JWT verification policy, hash parameters, throttling/auditing and recovery.
- Review UserRole.location onDelete SetNull: deletion can convert a location grant
  into an organization-wide grant. Do not enable authorization on this assumption.

## Database: Unknown (Case C)

PostgreSQL process listens on localhost:5432. Root environment targets database
citydental, schema public; credentials are present and are not reproduced here.
Read-only prisma db pull --print failed P1000 (credentials rejected). Earlier
attempt without exported DATABASE_URL failed P1012: CLI does not inherit NestJS
ConfigModule's root environment loading. Neither reveals database contents.

No migrations directory or seed implementation exists. Compose declares Postgres
16 and a persistent named volume; this does NOT prove a new/empty database. No
historical baseline/deployment record was found. Prisma validates successfully.

Missing evidence: confirmed target ownership/purpose, authorized working read-only
credentials, catalog/schema inspection and migration/deployment history. Do not
migrate/reset/db push. If existing, plan a baseline; if confirmed empty, review an
initial migration. Nullable UserRole.locationId compound uniqueness does not
prevent duplicate organization-wide grants; reviewed scoped SQL is still needed.
No schema changes, migrations, seeds or database writes occurred in this task.

## Architecture audit

- HIGH, FIXED: C:\Users\bobby\cityDental-Frontend\apps\web\src\lib\api.ts
  used payload as T. Raw apiFetch now returns unknown; apiFetchValidated parses a
  shared Zod schema. Auth context consumes this boundary.
- MEDIUM, FIXED: same file serialized JSON without Content-Type; now sets
  application/json for JSON bodies. Regression tests cover the wire request.
- No direct Prisma/database imports or filesystem JSON persistence found in web
  or frontend-consumed shared packages. No Next API routes/Server Actions found.
- Backend config validates DATABASE_URL; it is not imported by web.
- No duplicated implemented domain services found. Shared form/transport schemas
  do not substitute for backend enforcement.
- LOW, DEFERRED: role literals duplicated in shared ROLE_NAMES and roleNameSchema
  currently agree; consolidate when maintaining that catalog.
- Auth cache trust/scope-deletion risks above are unresolved, not fixed by inventing
  authentication behavior during foundation verification.

## Testing scope

Jest 29 reused via next/jest, Node environment; no second framework or DOM package.
Frontend static rendering tests exercise root and every UI export (Modal closed).
API tests stub fetch using real Response objects, never Prisma or backend logic.
These tests do NOT prove browser hydration, focus trapping or interactions.
Backend ESLint 8.57.1 uses legacy config and TypeScript ESLint 8.70.0 recommended
rules; no global disabling or formatting rule expansion. Existing health tests
remain unchanged.

## Final verification (2026-09-16)

Independent commands passed: backend TypeScript, lint, 2/2 health tests and build;
frontend TypeScript, lint, 10/10 tests and production build; API-client suite
independently passed 8/8; Prisma validation passed. Dependency install exited 0.

NestJS production process returned HTTP 200 from /api/v1/health and was stopped.
Next production process returned HTTP 200 for / and linked global CSS. A temporary
Node/Chrome DevTools Protocol probe used installed headless Chrome with an isolated
profile (no added browser framework). It observed the title, button, three cards,
loaded CSS tokens/computed colors, complete document, zero console exceptions or
console errors and zero failed network requests across 9 observed responses.
The first probe found a missing favicon; adding the static Next icon.svg resolved
that 404. Rebuild and identical browser recheck both exited 0. Probe servers were
stopped. This is a root-page smoke check, NOT exhaustive accessibility, responsive
layout, modal keyboard, authentication, or clinical workflow verification.

The root page does not call NestJS, so its network check does not prove a live
browser-to-API authenticated flow. API boundary behavior is unit-tested; the real
NestJS health URL was independently probed. Database introspection remained
blocked by P1000; no migration or authentication work was performed.
