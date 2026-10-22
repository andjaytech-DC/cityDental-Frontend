# CityDental — Design System

**Status:** current implementation reference
**Source of truth:** [`apps/web/src/app/globals.css`](apps/web/src/app/globals.css), [`apps/web/src/app/premium.css`](apps/web/src/app/premium.css), [`apps/web/src/app/admin/admin.css`](apps/web/src/app/admin/admin.css).

Use these tokens and components. Do not introduce new colors, fonts, or one-off styles.

---

## 1. Brand and tone

CityDental is a patient-first dental practice in Etah. The interface should feel calm, considered, clinical without being cold, and confident without exaggeration.

Content rules:

- Never claim a treatment outcome, credential, opening hour, or facility feature that the practice has not supplied.
- Placeholder imagery must be labelled as illustration, not clinic photography.
- Do not invent testimonials, ratings, patient counts, or “award-winning” claims.
- Write in plain language; explain what happens next instead of using pressure.
- Health content is informational, not a diagnosis. Encourage contacting the clinic.

---

## 2. Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-primary` | `#235c55` | Primary buttons, links, brand mark |
| `--color-primary-light` | `#39746a` | Hover/secondary brand |
| `--color-primary-dark` | `#173f3a` | Dark accents |
| `--color-accent` | `#846743` | Fine accents, rules, eyebrow marks |
| `--color-background` | `#f8f6f0` | Page background |
| `--color-surface` | `#fffefa` | Cards, panels, forms |
| `--color-surface-muted` | `#eeeae1` | Skeleton base, quiet fills |
| `--color-secondary` | `#dce7df` | Soft green surfaces |
| `--color-on-primary` | `#fffdf7` | Text on primary |
| `--color-text-primary` | `#243e3a` | Headings and body |
| `--color-text-secondary` | `#5d6862` | Supporting copy |
| `--color-border` | `#d8dcd2` | Borders and dividers |
| `--color-success` | `#10b981` | Success (with `--color-success-ink` for text) |
| `--color-warning` | `#f59e0b` | Warnings |
| `--color-danger` | `#ef4444` | Errors (with `--color-danger-ink` for text) |

Rules:

- Body text uses `--color-text-primary`; supporting text uses `--color-text-secondary`.
- Never place text on a background with insufficient contrast. Prefer surface + primary text over colored text.
- Status is never communicated by color alone; pair it with a label or icon.

---

## 3. Typography

| Role | Token / stack |
| --- | --- |
| UI / body | `--font-sans`: Inter via `next/font` (`--font-inter`), then system fallbacks |
| Display / editorial | `--font-display`: Georgia, `Times New Roman`, serif |
| Eyebrow | Uppercase, letter-spaced small text with an accent rule |
| Headings | Tight leading, display serif for marketing headlines, sans for product UI |

Rules:

- Inter is self-hosted with `display: swap`; do not add a second webfont.
- Use one `<h1>` per page; preserve heading order.
- Keep body copy at a comfortable measure (roughly 60–75 characters).

---

## 4. Shape, spacing and elevation

| Token | Value |
| --- | --- |
| `--radius-sm` | `0.375rem` |
| `--radius` | `0.5rem` |
| `--radius-md` | `0.75rem` |
| `--radius-lg` | `1rem` |
| `--shadow-sm` | subtle 1px shadow |
| `--shadow` | default card shadow |
| `--shadow-md` | raised surface |
| `--shadow-lg` | overlays, toasts, consent |

Spacing follows a 4 px base scale (`0.25rem` steps). Marketing sections use `.premium-section` and `.premium-wrap`; do not recreate horizontal padding locally.

Breakpoints used in the current CSS:

- `min-width: 768px` — two-column form rows, larger grids
- `min-width: 1024px` — desktop navigation and wide layouts
- `max-width: 1199px` / `900px` / `767px` — existing responsive collapses
- `prefers-reduced-motion` — motion is disabled

---

## 5. Core components

| Component | Path | Notes |
| --- | --- | --- |
| Button | `src/components/ui/Button.tsx` | Primary, secondary, outline, ghost; sizes; loading/disabled |
| Badge | `src/components/ui/Badge.tsx` | Status and category labels |
| Card | `src/components/ui/Card.tsx` | Surface panel with optional title |
| Input | `src/components/ui/Input.tsx` | Labelled form control |
| Table | `src/components/ui/Table.tsx` | Header/body/empty row; horizontal scroll on small screens |
| States | `src/components/ui/States.tsx` | `LoadingState`, `EmptyState`, `ErrorState`, `AccessErrorState`, `PageHeading` |
| Skeleton | `src/components/ui/Skeleton.tsx` | `Skeleton`, `TableSkeleton`, `CardGridSkeleton`, `PageSkeleton` |
| Toast | `src/components/ui/Toast.tsx` | `ToastProvider`, `useToast`; top-level notifications |
| Breadcrumbs | `src/components/Breadcrumbs.tsx` | Accessible trail + `BreadcrumbList` JSON-LD |
| Cookie consent | `src/components/CookieConsent.tsx` | Accept analytics / essential only |
| Cookie preferences | `src/components/CookiePreferences.tsx` | Footer control to reopen consent |
| Contact form | `src/components/ContactForm.tsx` | Validation, honeypot, toasts, honest failure states |
| Careers form | `src/components/CareersForm.tsx` | Application fields, validation, consent, honest delivery states; no resume upload yet |
| JSON-LD | `src/components/JsonLd.tsx` | Escaped structured-data script |

Marketing-specific classes live in `premium.css`: `.premium-hero`, `.premium-section`, `.premium-wrap`, `.premium-cta`, `.premium-footer`, `.resource-card`, `.doctor-*`, `.service-*`, `.faq-item`, `.cd-related`, `.careers-*`.

Admin UI uses `admin/admin.css` and the same UI primitives. Do not reuse marketing classes in admin screens.

---

## 6. Layout patterns

- **Public page:** `<main>` from `AppShell` → `.premium-section.premium-wrap` blocks → page-specific sections.
- **Page heading:** `.cd-page-heading` or `<PageHeading>` with one `<h1>` and a short description.
- **Breadcrumbs:** directly above the hero, wrapped in `.premium-wrap`.
- **Related links:** `.cd-related` grid of 3–4 links at the end of a public page.
- **Clinical/admin page:** `AppShell` + `PageHeading` + `Card`/`Table`; authenticated routes are noindex.
- **Empty/loading/error:** always render an explicit state; never a blank panel.

---

## 7. Accessibility

- Skip link is present in `AppShell`; landmarks (`header`, `nav`, `main`, `footer`) are used.
- Interactive elements are real `button`/`a` elements with visible focus.
- Breadcrumb uses `<nav aria-label="Breadcrumb">`, an ordered list, and `aria-current="page"`.
- Toasts use `aria-live="polite"`; errors are also shown inline next to fields.
- Cookie banner is a labelled region with normal buttons.
- Reduced motion is respected globally.
- Forms have explicit `<label htmlFor>`, `required`, and `aria-invalid`/`aria-describedby` on errors.
- Target WCAG 2.2 AA contrast and keyboard operation. Test with keyboard only before launch.

---

## 8. SEO and sharing patterns

- Use `pageMetadata()` from `src/lib/seo.ts` for every public page: unique title, description, canonical, Open Graph and Twitter card.
- Canonical paths are route-relative; `metadataBase` resolves them against `NEXT_PUBLIC_SITE_URL`.
- The share image is `public/og-image.png` (1200×630), referenced by `SHARE_IMAGE`.
- Use `<Breadcrumbs>` on every public page so the visible trail and JSON-LD stay in sync.
- Structured data lives in `src/lib/schema.ts`; keep facts limited to verified clinic data.
- Auth and admin pages must remain `noindex`.
- Images added later should use `next/image` with meaningful `alt` text; AVIF/WebP output is enabled.

---

## 9. Do / don't

**Do**

- Reuse `ui` primitives and existing CSS classes.
- Add loading, empty and error states for every data surface.
- Keep marketing copy calm and factual.
- Label illustrations and placeholders honestly.
- Run typecheck, lint, tests and build before handing off.

**Don't**

- Add a new color, font, or spacing scale.
- Invent clinic facts, hours, credentials, reviews or prices.
- Use a spinner where a content skeleton is clearer.
- Put database access in a client component.
- Remove `noindex` from authenticated pages.
- Load analytics before consent.
