# Application review and HTTP smoke test

Review date: 2026-09-18 (local time). Scope: current Next.js BFF application, not a NestJS migration. No application source or database schema changed.

## Verified results

- Fresh NestJS and Next.js production builds completed with exit 0.
- Web: 208 tests in 14 suites passed; TypeScript noEmit passed.
- API: 2 tests passed; TypeScript noEmit passed.
- Prisma migration status: citydental_dev on localhost:5432, three migrations, up to date. No migration or seed executed.
- NestJS localhost:4000/api/v1/health returned 200; /api/v1/doctors returned 404. Nest startup mapped only the health endpoint.
- Next.js localhost:3100: home, login and booking pages returned 200.
- Public doctor/location catalog and availability returned data.
- Booking smoke created two CONFIRMED appointments for one synthetic patient. Sequential repeat of the first slot returned 409. Invalid UUID input returned 400. This does NOT prove concurrent-booking safety.
- Payment order creation for the smoke appointment returned 503 while unconfigured. Unknown-order webhook returned 500 (observed behavior, not an acceptable production error contract).
- Anonymous auth/me and report export returned 401; anonymous communications returned 401.
- Fresh curl login returned 200. Replaying its exact access cookie to auth/me returned 200, matching the login identity and 19 permissions.
- All ten admin pages returned 200 and included admin-sidebar-brand with curl redirects disabled: dashboard, patients, doctors, appointments, locations, reports, audit, users, communications, settings.
- Authenticated patients/payments/appointments CSV exports returned 200 with expected header rows. CSV escaping and location-scoped permissions were not validated live.

## Harness correction

The initial PowerShell suite reported 41 passes and 11 failures. Do not treat that as a valid overall application result: its cookie jar withheld Secure cookies over plain HTTP, and its redirect-following admin checks could pass on the login page.

A fresh diagnostic showed login 200, two stored Secure/HttpOnly/SameSite=lax cookies, zero cookies eligible for HTTP, and two eligible for HTTPS. Immediate auth/me returned 401 with the complete body {"message":"Unauthenticated"}. No application cookie settings were changed. Explicit-cookie curl checks then verified authentication, actual admin markup and exports without following redirects. This validates server behavior, not browser cookie transport or deployed HTTPS.

Authenticated communications and password-change validation checks from the initial run are inconclusive: the session was missing. A password was not changed. No claim of live logout revocation coverage is made.

## Review findings requiring follow-up

1. **Backend ownership incomplete:** all business routes still execute in Next.js. NestJS health passing is not evidence of working Nest business APIs.
2. **Booking integrity:** overlap check and create are separate operations. Doctor/location queries do not bind both records to the selected organization. Patient matching by optional email can select an unrelated first patient when email is omitted. These are source-review findings; no adversarial reproduction was run.
3. **Authorization:** reports permit multiple entity exports behind broad read permissions; payment export queries do not apply the location filter used by other exports. Public catalogs are not tenant-scoped. A super-admin smoke test cannot establish least-privilege isolation.
4. **Payments not production-ready:** provider order creation contains unimplemented behavior. Webhook processing needs authentic raw-body verification, authoritative amount checks and atomic idempotency. The observed 500 must not be labeled a successful payment test.
5. **Session lifecycle:** source logout clears cookies but does not revoke issued tokens; access-session hydration does not check organization status. Refresh behavior needs dedicated coverage.
6. **Booking UI truthfulness/timezone:** the UI unconditionally says confirmations were sent even when responses report NOT_CONFIGURED. Slot conversion uses browser-local time and booking parses server-local time; cross-timezone behavior remains unverified.
7. **Operations:** Redis was not listening; apps/worker has no package.json or implementation despite root worker scripts. The unrelated app on port 3000 was left untouched.
8. **Audit limitations:** the BFF audit is a regex-based inventory, not a security proof. Import resolution is not a complete recursive dependency graph; controller discovery does not prove Nest module registration or HTTP reachability. Migration-state checks need strengthening before using the strict gate as production certification.

## Side effects and cleanup

The two servers started for smoke testing were stopped after identity checks: web PID 14788 and API PID 16932. Existing port-3000 application and PostgreSQL were not stopped.

Retained synthetic data in citydental_dev (not deleted during review):
- Patient 53471ef3-f8e6-47ba-a3f0-0d95b973983b, Smoke Probe, smoke.probe@citydental.local.
- Appointment 887b0531-1500-45d4-a6ec-48f273e9859b, 2026-09-21T03:30:00Z.
- Appointment 5620b3cc-9e2e-4237-8f32-7082ddbc98dc, 2026-09-21T04:30:00Z.
- Booking/login-related audit and communication history may also remain. No payments were collected or notifications delivered.

## Limitations / conclusion

Basic HTTP functionality passed after correcting cookie transport. Production readiness is NOT established. No browser interaction/hydration, responsive layout, accessibility, TLS cookie lifecycle, worker delivery, real payment, concurrent booking or non-admin isolation testing was completed. No migration code was written.
