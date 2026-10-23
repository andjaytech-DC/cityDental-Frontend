# CityDental — Task Tracker

**Last updated:** 2026-10-23
**Legend:** `[x]` implemented and verified · `[~]` code done, external account/config required · `[ ]` not started

Verification commands are run from the repository root unless noted.

---

## A. Website launch checklist (21 items)

- [x] **1. Custom 404 page** — `apps/web/src/app/not-found.tsx`; returns the branded page with home/services/contact links.
- [x] **2. Favicons** — `app/favicon.ico`, `app/icon.svg`, `public/apple-icon.png`, `app/manifest.ts`.
- [x] **3. Loading skeletons & empty states** — `components/ui/Skeleton.tsx`, `States.tsx`, `Table.tsx`; route `loading.tsx` for admin, doctors, services, service categories and patient resources.
- [x] **4. Toast notifications** — `components/ui/Toast.tsx` mounted in `AppProviders`; used by contact form, booking wizard and admin communications.
- [x] **5. Reduced motion** — global `prefers-reduced-motion` rules in `globals.css`; skeleton animation disabled.
- [x] **6. Social sharing image** — `public/og-image.png` (1200×630) wired through `SHARE_IMAGE` in `lib/seo.ts`.
- [x] **7. Event tracking** — `lib/analytics.ts` + `components/Analytics.tsx`; events `contact_form_submit` and `appointment_booked`; consent-gated.
- [x] **8. Cookie consent banner** — `lib/consent-context.tsx`, `CookieConsent.tsx`, footer `CookiePreferences`.
- [x] **9. Security headers** — CSP, HSTS (production), nosniff, frame denial, referrer policy, permissions policy, COOP; `poweredByHeader: false`.
- [x] **10. Contact form with email notification** — `components/ContactForm.tsx` → `app/api/contact/route.ts` (zod, honeypot, rate limit, SMTP, honest 503).
- [x] **11. Unique page titles & meta descriptions** — `pageMetadata()` on all public pages; unique titles on all admin pages.
- [x] **12. Open Graph metadata** — per-page OG/Twitter tags plus the static share image.
- [x] **13. XML sitemap** — `app/sitemap.ts`; public, service, category and doctor URLs.
- [x] **14. Robots.txt** — `app/robots.ts`; private surfaces disallowed, AI search crawlers explicitly allowed on public routes.
- [x] **15. Canonical tags** — `alternates.canonical` on all public pages; duplicate booking route canonicalised.
- [x] **16. Schema.org structured data** — `Dentist`, `Person`, `BreadcrumbList`, `FAQPage` via `lib/schema.ts` + `JsonLd`.
- [x] **17. Breadcrumb navigation** — `components/Breadcrumbs.tsx` with matching JSON-LD across public pages.
- [x] **18. Internal linking** — related-care sections on services, categories, service detail, doctors, resources and FAQs.
- [x] **19. WebP/AVIF support** — `images.formats: ["image/avif","image/webp"]` in `next.config.mjs`.
- [x] **20. Lazy loading** — `next/image` for off-screen artwork.
- [x] **21. Faster font loading** — `next/font` Inter with `display: swap`; no third-party font request.

---

## B. Launch operations checklist (items 1–14)

- [x] **1. Noindex audit** — no public marketing page emits `noindex`; admin/auth/patient surfaces remain non-indexed by design. `/appointments/book` no longer sends `noindex`; it canonicalises to `/book-appointment`.
- [~] **2. Google Search Console** — create the Domain property, verify via DNS TXT, then submit the sitemap. Steps: `PROD.md` §4.
- [~] **3. Submit sitemap** — `https://<your-domain>/sitemap.xml`; submit in GSC and Bing. Steps: `PROD.md` §4–5.
- [~] **4. Request homepage indexing** — URL Inspection → Request indexing. Steps: `PROD.md` §4.
- [~] **5. Bing Webmaster Tools** — import from GSC or add manually, verify and submit sitemap. Steps: `PROD.md` §5.
- [~] **6. Google Analytics** — GA4 support is implemented and consent-gated; set `NEXT_PUBLIC_ANALYTICS_PROVIDER=ga` and `NEXT_PUBLIC_GA_ID`, rebuild. Steps: `PROD.md` §6.
- [~] **7. Google Business Profile** — create/verify the profile with matching NAP. Steps: `PROD.md` §7.
- [x] **8. HTTPS hardening (code)** — HSTS in production, `upgrade-insecure-requests` in the production CSP, secure auth cookies. Certificate/proxy termination is a hosting step: `PROD.md` §3.
- [x] **9. Unique title for every page** — all public pages and all 20 admin pages now have distinct titles.
- [ ] **10. Page speed check** — run PageSpeed Insights and Lighthouse against the production URL; record mobile LCP/CLS/INP. Steps: `PROD.md` §9.
- [x] **11. Allow ChatGPT Search to crawl** — explicit `OAI-SearchBot`, `ChatGPT-User` and `GPTBot` rules in `app/robots.ts`, with private paths still disallowed.
- [x] **12. `PROD.md`** — production runbook: env vars, HTTPS, GSC, Bing, GA4, GBP, AI crawlers, speed, smoke tests, rollback, blockers.
- [x] **13. `DESIGN.md`** — design tokens, components, layout patterns, accessibility, SEO conventions and content rules.
- [x] **14. `TASK.md`** — this tracker.

> The original request also spelled item 13 as “DESSIGN.nd”. The file is created as `DESIGN.md`.

---

## B2. Careers section (current task)

- [x] **Route and page** — `/careers` created at `apps/web/src/app/careers/page.tsx`; hero, three category cards, working-environment section, application form, recruitment contact card and related links.
- [x] **Categories** — Doctors and Dental Professionals; Dental Support Staff; Receptionist and Front Desk.
- [x] **Truthful labelling** — each category is marked “Hiring interest”; a notice states these are not confirmed vacancies and that salary, experience, qualifications and employment terms are published only when confirmed by the clinic.
- [x] **Application form** — full name, phone, email, position, qualifications, optional experience, short introduction and required consent.
- [x] **Validation** — required fields, email/phone format, position allow-list, length limits and consent; inline errors with `aria-invalid` and focus on the first invalid field.
- [x] **Honest submission** — reuses `POST /api/contact`; success is shown only for `status: "SUCCESS"`. A `503`/`NOT_CONFIGURED` response tells the applicant to email or call and never claims delivery.
- [x] **Resume upload** — intentionally omitted because no upload/storage workflow exists; documented in `docs/architecture/careers-frontend-integration.md`.
- [x] **Navigation and footer** — one Careers link in `mainNavLinks` (desktop + mobile) and one in `footerLinks.quick`.
- [x] **SEO** — unique title and description via `pageMetadata`, canonical `/careers`, sitemap entry, breadcrumbs; no `JobPosting` markup is emitted because no vacancies are confirmed.
- [x] **Responsive and accessible** — existing tokens/components, mobile single-column layout, labelled controls, keyboard focus, reduced-motion inherited from global styles.
- [x] **Tests** — `apps/web/src/app/careers/page.test.tsx` covers content, all eight listed roles, disclaimer, form fields, consent, validation and sitemap/navigation links.
- [ ] **Dedicated careers backend** — implement `POST /api/v1/careers/applications` with multipart resume upload, private storage, consent retention and admin review. Contract: `docs/architecture/careers-frontend-integration.md`.

---

## C. Verification evidence

Run from the repository root:

```powershell
# TypeScript
apps\web\node_modules\.bin\tsc.cmd -p apps/web/tsconfig.json --noEmit

# Lint + tests (from apps/web)
cd apps\web
.\node_modules\.bin\next.cmd lint
.\node_modules\.bin\jest.cmd --runInBand

# Architecture boundary audit (repository root)
cd ..\..
node scripts\audit-bff.mjs --check --no-write

# Production build (from apps/web) — runs `prisma generate` first, then Next
cd apps\web
corepack pnpm run build
```

Latest results:

| Check | Result |
| --- | --- |
| TypeScript | Pass — 0 errors |
| ESLint | Pass — no warnings or errors |
| Jest | Pass — 15 suites / 227 tests |
| BFF audit | Pass — no hard boundary violations |
| Production build | Pass — `/careers` prerendered as static; `/api/contact`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/favicon.ico` |
| Runtime headers | Pass — CSP, HSTS, nosniff, frame deny, referrer, permissions, COOP; no `X-Powered-By` |
| Contact API | Pass — `503 NOT_CONFIGURED` without SMTP; never reports false success |
| Noindex policy | Pass — no `noindex` on public pages; admin/workspace send `X-Robots-Tag` |

Re-run all of the above after any metadata, config or layout change.

---

## D. Outstanding before launch

These require credentials, accounts, DNS or hosting access:

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS origin and rebuild.
- [ ] Configure `COMMUNICATIONS_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CONTACT_TO_EMAIL`.
- [ ] Send a real contact enquiry and a real appointment email.
- [ ] Google Search Console verification + sitemap submission.
- [ ] Bing Webmaster verification + sitemap submission.
- [ ] GA4 measurement ID configured and realtime event verified after consent.
- [ ] Google Business Profile created and verified.
- [ ] TLS certificate installed and HTTP→HTTPS redirect enforced.
- [ ] PageSpeed Insights / Lighthouse recorded.
- [ ] Resolve production blockers listed in `PROD.md` §0 and `docs/architecture/production-readiness-checklist.md` (payments, logout revocation, booking race, worker).

---

## E. Change log

| Date | Change |
| --- | --- |
| 2026-10-22 | Implemented the 21 website launch items; added SEO/consent/analytics/contact infrastructure. |
| 2026-10-23 | Removed `noindex` from the public booking alias; added unique admin titles; allowed OAI-SearchBot/ChatGPT-User/GPTBot; added `upgrade-insecure-requests`; created `PROD.md`, `DESIGN.md`, `TASK.md`. |
| 2026-10-23 | Added `/careers` with hiring-interest categories, validated application form, honest delivery states, navigation/footer links, sitemap entry, tests and backend integration notes. No backend files changed. |
| 2026-10-23 | Fixed deployment resolution of `@citydental/validation` by compiling `packages/types` and `packages/validation` in `apps/web` `predev`/`prebuild`; reproduced the missing-`dist` failure and rebuilt successfully. |
| 2026-10-23 | Moved shared-package compilation into the `dev`/`build` scripts themselves because Vercel did not execute the `prebuild` hook. |
| 2026-10-24 | Declared `AuditAction` locally in `apps/web/src/lib/audit.ts` instead of importing it from `@prisma/client`, which resolves to the ungenerated stub when a deployment builds only `apps/web`. |
| 2026-10-24 | Added `scripts/generate-prisma-client.mjs` and wired it into `apps/web` `dev`/`build` so `prisma generate` runs before `next build`. No database changes or migrations; `prisma generate` does not connect. Documented the build-time `DATABASE_URL` requirement in `PROD.md`. |
