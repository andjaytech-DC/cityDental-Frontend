# city-dental web

Next.js 14 frontend (UI only). All business logic, validation and data
access live in the NestJS API (`apps/api`) and are consumed through the
shared API client (`src/lib/api.ts`) against the shared contracts in
`@citydental/types` and `@citydental/validation`.

## Styling decision

The existing components (`src/components/ui/*`) are written with Tailwind
utility classes, so the repository is clearly intended to use Tailwind:

- **Tailwind CSS v3** (`^3.4.14`) is used — compatible with the pinned
  Next.js 14 line.
- `tailwind.config.js` scans only `./src/**/*.{ts,tsx}`.
- `postcss.config.js` wires `tailwindcss` + `autoprefixer`.
- `src/app/globals.css` has the `@tailwind` directives prepended; the
  pre-existing CSS design tokens are preserved and remain available to any
  component that needs them. Shell and UI primitives now use semantic `cd-*`
  classes backed by these tokens; Tailwind remains for layout and spacing.

## Application shell

Desktop sidebar, mobile dialog navigation, skip link, header, page container and
optional account controls are reusable. The shell can render without auth state.
Routes: `/`, `/login`, and the not-found fallback. App Router loading and error
boundaries provide presentation/retry UI; these are not additional URLs.

Login uses React Hook Form, the existing Zod loginSchema and AuthProvider.login.
Email/password and optional organizationSlug are the existing contract. Blank
optional organization input is omitted. No registration/reset routes, role rules,
token policies or backend endpoints were invented. Password input is cleared after
submission. Cached session UI is not proof of authorization; NestJS is authoritative.
Sign-out currently clears local state only, as before. Storage access failures no
longer break session reads; failed persistence attempts clear partial stored auth.

All HTTP calls remain in the existing API client. Login and refresh target the
previously defined NestJS contract but are not working auth endpoints in this
workspace. Clinical summaries explicitly report not-connected data sources; no
patient records, counts or activity events are fabricated.

## Verification: shell stage

Independently executed frontend checks: TypeScript PASS, ESLint PASS, production
build PASS, Jest 29/29 PASS (3 suites, including the existing 8 API-client tests).
One TypeScript run overlapped a Next build and failed on temporary generated-type
files; the standalone rerun after build completion passed. Do not run those two
commands concurrently against the same `.next` output.

Installed headless Chrome, driven via a temporary Node/CDP probe (no added browser
framework), verified 1280x900, 768x900 and 390x900 viewports:
- Root and login content; desktop/mobile navigation; explicit empty states.
- No document-level horizontal overflow on either route.
- Invalid form submit, error associations and focus on the email input.
- About dialog initial focus, repeated Tab containment, Escape and trigger focus
  restoration. An observed Tab escape was fixed with explicit focus wrapping.
- Real unavailable login request produced HTTP 404, a recoverable service message,
  cleared password and re-enabled submit; no mocked authentication success.
- Missing route displayed the custom not-found page.
- Zero captured JavaScript console errors and network transport failures. The only
  HTTP errors were the deliberately exercised auth/login and missing-page 404s.

Limits: viewport emulation is not physical-device testing. No exhaustive visual,
screen-reader or contrast certification was performed. Shift+Tab/backdrop close,
long-content modal scrolling, live page-error reset/loading transitions and a
successful authenticated session were not independently browser-verified. Error,
loading and access-state markup are covered by Jest. Native dialog requires a
modern browser. Backend authentication, data APIs and database readiness remain
separate dependencies; none was implemented in this frontend stage.

## Clinical workspace increment

Added `/patients`, `/doctors`, `/appointments` and `/patients/new`. The shell is
unchanged apart from navigation links. Overview statistics remain disconnected.
All four new routes are **contract-ready presentations**, not connected APIs.

Shared contracts inspected:
- PatientDto, DoctorDto, LocationDto, AppointmentDto and Paginated<T>.
- Patient/doctor search, status, location and pagination query schemas.
- Appointment date-window, status, patient/doctor/location and pagination queries.
- Existing createPatientSchema/updatePatientSchema for the reusable patient form.

WorkspaceLists reuses the existing table and loading/error/access/empty primitives.
Its discriminated state supports unavailable, loading, error, denied and ready.
Live pages intentionally pass unavailable. Search is disabled and appointment
filters are not enabled; no local filtering masquerades as server search.
Appointment presentation uses DTO IDs rather than invented related-record names,
and preserves the supplied start/end strings without scheduling/timezone rules.

PatientForm supports create/update schemas and an optional asynchronous onSave
integration callback. The mounted create page has NO callback. It validates fields
and explicitly says nothing was saved. No network request or local persistence is
performed. Actual save success/failure/pending branches require a future callback
using the existing schema-validating API client. Gender/status editing and location
selection are not exposed in this initial form. The update variant is reusable but
not mounted on a live route; detail operations are not specified, so no patient or
doctor detail routes were created.

### Backend handoff — not implemented or bound

Only the health controller exists in this workspace. No exact clinical endpoint
paths/methods or operation response envelopes are defined in repository sources.
The following are proposed REST bindings to agree with the backend team, NOT
verified endpoints and NOT requests this frontend currently sends:

| Operation | Proposed binding | Existing request/data contract |
| --- | --- | --- |
| List patients | GET /api/v1/patients | listPatientsQuerySchema, PatientDto, Paginated<T> |
| List doctors | GET /api/v1/doctors | listDoctorsQuerySchema, DoctorDto, Paginated<T> |
| List appointments | GET /api/v1/appointments | listAppointmentsQuerySchema, AppointmentDto, Paginated<T> |
| Create patient | POST /api/v1/patients | createPatientSchema; mutation response undefined |
| Update patient | PATCH /api/v1/patients/:id | updatePatientSchema; mutation response undefined |
| Location lookup | GET /api/v1/locations | LocationDto; list envelope/query undefined |

Agree bindings/envelopes before adding API methods. Add runtime response schemas
matching the agreed DTO envelopes; do not cast raw transport data. Then wire real
request cancellation/loading, pagination/search, 401/403 mapping and save outcomes.
No fake service or speculative patient/doctor detail operation was added.

### Clinical verification results

Independent frontend TypeScript, ESLint and production build passed. Jest:
**5 suites, 54 tests, 54 passed, 0 failed** (includes existing 8 API-client tests).
New tests cover all three list presentations, each loading/empty/data/error/access
state, and patient schema/form/error-message presentation. Synthetic records are
confined to test files; they are not production page data. One initial static-render
assertion incorrectly expected React Hook Form ref-applied defaults in HTML; it was
corrected. Update-form hydration is not claimed as verified.

Headless Chrome passed all four new routes at 1280x900, 768x900 and 390x900:
HTTP 200, correct headings/disconnected states, no document horizontal overflow,
working desktop/mobile navigation and keyboard skip-link focus. On the patient
form, invalid submission focused firstName, valid test-only names produced the
explicit no-save message, and feedback did not overflow. Zero captured JavaScript
console errors and zero failed network requests. No clinical requests were issued.
Temporary probes were removed after execution; no new browser framework was added.

Limits: populated tables, actual HTTP clinical errors, live loading/pagination,
update hydration and successful saves were NOT browser-verified. They require real
integration (presentation branches alone are tested in Jest). No full WCAG or
physical-device claim is made. Frontend remains runnable independently; this is not
production-ready clinical functionality.

## Premium public redesign (final stage)

`/` is now an original, patient-facing CityDental site; the former overview lives at
`/workspace`. The public header (sticky, scroll state, desktop nav, accessible
mobile dialog with Skip link) and footer share a warm ivory/teal token set defined
in globals.css with presentation rules in premium.css. Sections: hero with original
locally generated SVG artwork (labelled "not a photograph of our clinic"), honest
highlights, an explicit service-catalog placeholder, patient-experience editorial,
a doctor section that states the doctor API is not connected, and an appointment
CTA that links to /appointments without claiming booking. No invented services,
doctors, credentials, statistics, reviews or contact details. Clinical screens and
the login page adopt the same typography/tokens. Routes intentionally end at:
/, /workspace, /login, /patients, /patients/new, /doctors, /appointments; a
previously added /patients/[id] route was REMOVED because no detail contract or
binding exists (any patient id now serves the custom 404, verified in browser).

### Redesign verification (actual results)

Independent commands: web TypeScript PASS, ESLint PASS, production build PASS,
Jest 5 suites / 56 tests PASS (0 failed), API build/typecheck PASS, health tests
2/2 PASS. Two transient failures were observed and fixed: a duplicate UI barrel
export (typecheck) and Next image-optimizer 400s for query-string SVG URLs
(browser); both were corrected and re-verified. Headless Chrome checked all seven
routes at 1280x900, 768x900 and 390x900: HTTP 200, expected headings/disconnected
states, sticky-header scroll state, mobile menu dialog, skip-link/main-content
focus, zero console errors, zero network failures, no document horizontal overflow,
custom 404 on /patients/<id>. Screenshots from an earlier probe round are in
logs/screens (development artifacts only). One TypeScript run raced a concurrent
build and failed on stale .next types; cleared cache and standalone rerun passed.
No production build vs hydration difference was observed in the checked flows.

Limits: visual polish reviewed via automated DOM/CSS assertions and screenshots,
not a designer sign-off; no screen-reader audit; animation behavior only via the
reduced-motion media query; PDF/print and ultra-wide layouts unchecked. No backend,
database, Prisma or authentication changes were made in this redesign. The site is
NOT production-ready: services, doctors, booking, contact details and clinical data
remain explicitly unconnected until their NestJS APIs and content are approved.


