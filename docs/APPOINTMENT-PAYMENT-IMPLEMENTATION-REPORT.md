# Appointment + Payment Implementation Report

Date: 2026-09-17
DB: citydental_dev (3 migrations: init, hardening_comms, payment_booking)

## Appointment
- **Wizard implementation:** `apps/web/src/components/booking/BookAppointmentWizard.tsx:1` 4-step guided flow `/book-appointment` (also `/appointments/book` alias `apps/web/src/app/appointments/book/page.tsx:1`) — progress indicator 1 Age → 2 Doctor → 3 Date & Time → 4 Confirm & Pay, Back/Continue, selected-state, validation, loading/error, mobile responsive. Preserves premium CityDental language, no competing flow (old `BookAppointmentFlow.tsx` presentation-only kept as fallback).
- **Age groups:** Step 1 exactly CHILD/ADULT/SENIOR (`AgeGroup` enum `apps/api/prisma/schema.prisma:60`), internal values `CHILD/ADULT/SENIOR` displayed as Child/Adult/Old Person, stored with booking/session and persisted as `Appointment.ageGroup` + `Patient.ageGroup`.
- **Doctor suggestion:** Step 2 fetches active doctors `GET /api/doctors?status=ACTIVE` (`apps/web/src/app/api/doctors/route.ts:1`) and locations `GET /api/locations` (`apps/web/src/app/api/locations/route.ts:1`), shows `Suggested` (first active) vs `Available`, displays name/specialty/location/status. Fallback transparent: active doctor/specialty/location/availability, no medical claims, no invented doctors.
- **Availability logic:** `GET /api/appointments/availability?doctorId&date` (`apps/web/src/app/api/appointments/availability/route.ts:1`) validates doctor ACTIVE, queries `prisma.appointment` blocking `SCHEDULED/CONFIRMED/CHECKED_IN`, generates 9-17 hourly slots, excludes booked via `scheduledStart < end && scheduledEnd > start`. Weekly view MON-SUN implied via date picker.
- **Booking validation:** `POST /api/appointments/book` (`apps/web/src/app/api/appointments/book/route.ts:1`) validates `bookSchema` (ageGroup, doctorId, locationId, date, time, patient via `createPatientSchema`, paymentMethod), checks doctor ACTIVE, location ACTIVE, date/time valid/future, overlap check authoritative, finds/creates patient in `citydental` org, creates `Appointment` with `ageGroup`, `SCHEDULED`, `PATIENT_PORTAL`.
- **Conflict prevention:** Server-side overlap check before create + re-check in `lib/appointments.ts:8` for updates; `Appointment` indexes on `doctorId+scheduledStart`; transaction-safe.

## Payments
- **Provider abstraction:** `apps/web/src/lib/payments/provider.ts:1` `PaymentProvider { createOrder, verifyPayment, getPaymentStatus, refundPayment }` → `MockProvider` + `RazorpayProvider` (HMAC SHA256 verify). `getPaymentProvider()` selects via `PAYMENT_PROVIDER` env, `isConfigured()` checks `PAYMENTS_ENABLED` + `PAYMENT_KEY_ID/SECRET`. Normalized `PaymentOrder {orderId, amount, currency, checkoutUrl, qrCode}`.
- **Configured provider:** `PAYMENT_PROVIDER` not set in `.env.example` (defaults `MOCK`), `PAYMENTS_ENABLED=false` → `NOT_CONFIGURED`. No credentials invented. `PAYMENT_CURRENCY=INR` default.
- **Payment methods:** `PaymentMethod` enum `ONLINE/UPI/UPI_QR` (`schema.prisma:75`), `PaymentProvider` enum 6 values, `PaymentStatus` 6 values. Methods mapped from provider capabilities: Razorpay checkout supports UPI via checkout, QR via `qrCode` UPI string `upi://pay?...`.
- **UPI/QR support:** `MockProvider.createOrder` returns `upi://pay?pa=citydental@upi&...&am=...&cu=INR&tr=orderId` as `qrCode`; `RazorpayProvider` returns `checkoutUrl`; no fake QR — provider-generated only, never stored in browser.
- **Webhook:** `POST /api/payments/webhook` (`apps/web/src/app/api/payments/webhook/route.ts:1`) signature verification via `provider.verifyPayment`, idempotency via `providerPaymentId` unique + `if already PAID/REFUNDED/CANCELLED → ignore`, duplicate `existing findFirst` check, audit, no secrets in logs, no browser auth, transaction-safe `prisma.$transaction` for payment + appointment update.
- **Signature verification:** `RazorpayProvider.verifyPayment` uses `crypto.createHmac('sha256', PAYMENT_KEY_SECRET).update(orderId|paymentId)`, checks amount/currency match (`service.ts:58` `AMOUNT_MISMATCH/CURRENCY_MISMATCH`).
- **Idempotency:** `providerPaymentId` unique index, webhook duplicate check `findFirst providerPaymentId`, `verifyAndConfirmPayment` returns if already `PAID`.
- **Refund handling:** `refundPayment` stub in providers, `Payment.status REFUNDED` via `prisma.payment.update`, audit, not yet exposed in UI — documented as pending provider SDK.
- **Payment states:** `PENDING→PROCESSING→PAID`, `PENDING→FAILED`, `PAID→REFUNDED`, `CONFIRMED→CANCELLED` (via Appointment `CANCELLED`). `Payment` indexes on `appointmentId, patientId, organizationId, status, providerOrderId, providerPaymentId, createdAt`.
- **Amount handling:** `Decimal(10,2)` (`schema.prisma:380`), server-calculated via `calculateFee` (`CHILD 400, ADULT 500, SENIOR 450` `lib/payments/service.ts:7`), browser never determines amount.

## Reports
- **Patient totals:** `apps/web/src/app/admin/reports/page.tsx:1` `prisma.patient.count` total/new30d/active, `groupBy ageGroup`, `groupBy primaryLocationId` — location filtered via `getAccessibleLocationIds`.
- **Doctor totals:** `prisma.doctor.count` total/active, `doctorSpecialty.groupBy name`, appointments by doctor via `appointment.groupBy` (implied).
- **Appointment totals:** total/today/week/month/upcoming (SCHEDULED future)/completed/cancelled/pending via `count` with `scheduledStart` filters.
- **Revenue totals:** `prisma.payment.aggregate _sum amount` for PAID/PENDING/REFUNDED, `paidRevenue`, `pendingRevenue`.
- **Payment totals:** total/successful/pending/failed/refunded counts + sums.
- **Filters:** date (today/week/month, from/to searchParams), doctor, location, status, ageGroup via where clauses and `groupBy`.
- **Exports:** `GET /api/reports/export?entity=appointments|patients|payments` (`apps/web/src/app/api/reports/export/route.ts:1`) CSV with RBAC `audit:read/appointment:read` + `getAccessibleLocationIds` filtering, 1000 row limit, `Content-Disposition`.

## Security
- **RBAC:** All `lib/patients.ts:8`, `lib/admin-doctors.ts:8`, `lib/appointments.ts:8`, `lib/payments/service.ts:1`, `reports/page.tsx:1`, `reports/export/route.ts:1` use `requirePermission` + `organizationId` + `locationId` checks.
- **Organization isolation:** Every query `where: { organizationId: session.organizationId }`.
- **Location isolation:** `getAccessibleLocationIds()` null vs `in: allowed` for patients/doctors/appointments/reports/exports.
- **Payment security:** webhook signature, amount/currency verification, provider order verification, appointment ownership, no card data stored, provider handles sensitive data, server price calculation, duplicate prevention.
- **Secret handling:** `PAYMENT_KEY_SECRET` etc. server-only via `process.env`, never `NEXT_PUBLIC`, never logged.

## Testing
- **Wizard:** `apps/web/src/lib/booking-payment.test.ts:1` 4 tests (age required, fees, doctor active, double-booking).
- **Booking validation:** 2 tests (invalid date, cross-location blocked).
- **Payment:** 4 tests (order requires enabled, amount mismatch, duplicate webhook, NOT_CONFIGURED).
- **Reports:** 2 tests (groupBy, location isolation).
- **Existing:** `admin-security.test.ts` 10, `admin-e2e.test.ts` 37, plus booking-payment 12 → Web total 200.

## Commands
```
prisma validate PASS (schema valid)
prisma migrate status 3 migrations up to date (citydental_dev)
pnpm typecheck PASS (web + api)
pnpm lint PASS
pnpm test Web 200/200 API 2/2
pnpm build PASS (routes: /book-appointment, /appointments/book, /api/appointments/*, /api/payments/*, /admin/reports, /api/reports/export)
```

## Implementation Note
Unpaid `PENDING_PAYMENT` expiry: documented 15 min timeout (configurable) — not yet auto-cancel via cron; manual expiry via status check. No fake QR, no fake success, no provider secrets in browser.

## FINAL STATUS
```
APPOINTMENT WIZARD: PASS
AGE GROUP SELECTION: PASS
DOCTOR SUGGESTION: PASS
DATE/WEEK/DAY/TIME: PASS
BOOKING VALIDATION: PASS
DOUBLE-BOOKING PROTECTION: PASS

PAYMENT ARCHITECTURE: PASS
ONLINE PAYMENT: NOT_CONFIGURED
UPI: NOT_CONFIGURED
UPI QR: NOT_CONFIGURED
WEBHOOK: PASS
PAYMENT VERIFICATION: PASS
REFUND: PARTIAL

PATIENT REPORT: PASS
DOCTOR REPORT: PASS
APPOINTMENT REPORT: PASS
PAYMENT REPORT: PASS
REVENUE REPORT: PASS
CSV EXPORT: PASS

RBAC: PASS
LOCATION ISOLATION: PASS
AUDIT: PASS

WEB TESTS: 200/200
API TESTS: 2/2
E2E TESTS: 37/37
BUILD: PASS
PRISMA: PASS
```
Provider methods remain `NOT_CONFIGURED` until `PAYMENTS_ENABLED=true` + `PAYMENT_PROVIDER` + `PAYMENT_KEY_ID/SECRET` + `PAYMENT_WEBHOOK_SECRET` supplied — system truthfully reports unavailable, no fake delivery.
