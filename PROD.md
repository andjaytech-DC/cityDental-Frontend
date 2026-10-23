# CityDental — Production Launch Runbook

**Status:** pre-launch
**Scope:** public website (`apps/web`), Next.js BFF routes, SEO, analytics and consent.
**Companion docs:** [`docs/architecture/production-readiness-checklist.md`](docs/architecture/production-readiness-checklist.md), [`DESIGN.md`](DESIGN.md), [`TASK.md`](TASK.md).

Replace `<your-domain>` with the real production origin (for example `https://citydental.in`) everywhere below. The origin must match `NEXT_PUBLIC_SITE_URL` exactly.

---

## 0. Hard blockers before going live

These are not SEO items, but the site should not be announced publicly until they are resolved.

| Gate | Current state | Owner action |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Defaults to `http://localhost:3000` | Set the real HTTPS origin and rebuild |
| Contact email delivery | `POST /api/contact` returns `503 NOT_CONFIGURED` without SMTP | Set `COMMUNICATIONS_ENABLED=true`, `SMTP_HOST`, `SMTP_FROM`, `CONTACT_TO_EMAIL` |
| Real payment provider | Razorpay order/verify are placeholders | Implement/verify before enabling online payments |
| Logout token revocation | Cookies cleared, `tokenVersion` not incremented | Fix before exposing admin sessions |
| Booking race safety | Overlap check and insert are separate queries | Add a transaction/unique constraint |
| Background worker | `apps/worker/src` is empty | Implement or remove from deploy scripts |
| SMTP/SMS delivery test | Not performed with real credentials | Send a test enquiry and a test appointment email |

Full evidence: `docs/architecture/production-readiness-checklist.md`.

---

## 1. Indexability and noindex policy

Public marketing pages are indexable. The following are intentionally non-indexed:

- `/admin/*` — `noindex` metadata + `X-Robots-Tag: noindex, nofollow`
- `/workspace`, `/patients`, `/patients/new`, `/appointments`, `/login` — `noindex`
- `/appointments/book` — canonicalised to `/book-appointment`

Verify no public page emits `noindex`:

```powershell
# after `next build`
Select-String -Path apps\web\.next\server\app\index.html -Pattern 'noindex'
# expect no output
```

Do **not** remove `noindex` from admin or patient-facing authenticated pages.

---

## 2. Environment variables

```dotenv
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://<your-domain>
NEXT_PUBLIC_API_URL=https://<api-domain>/api/v1
CORS_ORIGIN=https://<your-domain>

# Contact form
CONTACT_TO_EMAIL=citydentalEtah@gmail.com
COMMUNICATIONS_ENABLED=true
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Optional analytics (loaded only after consent)
NEXT_PUBLIC_ANALYTICS_PROVIDER=ga        # or plausible
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX           # for ga
NEXT_PUBLIC_ANALYTICS_DOMAIN=<your-domain>  # for plausible
```

Build after changing `NEXT_PUBLIC_*` values — they are inlined at build time.

---

## 3. HTTPS

1. Provision a TLS certificate at the host/reverse proxy (Vercel, Netlify, Cloudflare, or Nginx + Let's Encrypt).
2. Force HTTP → HTTPS at the edge or proxy (301).
3. Confirm production responses include:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `Content-Security-Policy` with `upgrade-insecure-requests`
4. Auth cookies are already `Secure`, `HttpOnly`, `SameSite=Lax`.
5. Validate with [SSL Labs](https://www.ssllabs.com/ssltest/) and `curl -I https://<your-domain>`.

Only submit HSTS preload after the domain is permanently HTTPS.

---

## 4. Google Search Console

1. Open <https://search.google.com/search-console>.
2. Add a **Domain** property for `<your-domain>`.
3. Verify with a DNS TXT record (preferred) or the HTML tag method.
4. Confirm `https://<your-domain>/sitemap.xml` loads with absolute URLs on the production origin.
5. Submit the sitemap under **Indexing → Sitemaps**.
6. Use **URL Inspection** on `https://<your-domain>/` → **Request indexing**.
7. Re-check **Pages** after 48–72 hours for “Discovered – currently not indexed” or soft-404 reports.

Do not submit `/admin`, `/workspace`, `/patients`, `/login` or `/appointments`.

---

## 5. Bing Webmaster Tools

1. Open <https://www.bing.com/webmasters>.
2. Sign in and choose **Import from Google Search Console** (fastest), or add the site manually.
3. Verify via DNS or XML file.
4. Submit `https://<your-domain>/sitemap.xml`.
5. Use **URL Submission** for the homepage and key service pages.

---

## 6. Google Analytics (GA4)

The codebase already supports GA4 and Plausible behind cookie consent. Nothing is loaded before the visitor accepts.

1. Create a GA4 property and a Web data stream for `<your-domain>`.
2. Copy the measurement ID (`G-XXXXXXXXXX`).
3. Set:
   ```dotenv
   NEXT_PUBLIC_ANALYTICS_PROVIDER=ga
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
4. Rebuild and redeploy.
5. Open the site in a private window → **Accept analytics** → confirm `collect` requests in DevTools → GA4 **Realtime**.
6. Confirm **Reject/Essential only** loads no analytics request.
7. Mark `contact_form_submit` and `appointment_booked` as key events if desired.

Plausible alternative:

```dotenv
NEXT_PUBLIC_ANALYTICS_PROVIDER=plausible
NEXT_PUBLIC_ANALYTICS_DOMAIN=<your-domain>
```

---

## 7. Google Business Profile

1. Open <https://business.google.com> and add **CityDental**.
2. Category: **Dentist**. Add secondary categories only if accurate.
3. NAP must match the website exactly:
   - **Name:** CityDental
   - **Address:** Shop No. 5, Yadav Market, MG Road, Etah, 701012
   - **Phone:** +91 94151 92948
   - **Website:** `https://<your-domain>`
4. Add opening hours only when the practice confirms them. Do not invent hours.
5. Complete video/photo verification if offered; otherwise request the postcard/phone verification.
6. After verification, publish the profile and add the appointment link (`/book-appointment`).

Keep the name, address and phone identical on the site, GBP, and any directories.

---

## 8. AI search crawlers (ChatGPT Search)

`apps/web/src/app/robots.ts` explicitly allows `OAI-SearchBot`, `ChatGPT-User` and `GPTBot` on public routes while keeping private surfaces disallowed.

Verify after deploy:

```powershell
Invoke-WebRequest https://<your-domain>/robots.txt | Select-Object -ExpandProperty Content
```

Expect explicit `User-Agent` groups for the three crawlers plus `Sitemap: https://<your-domain>/sitemap.xml`.

No `llms.txt` is required for indexing; the sitemap and crawlable HTML are the source of truth.

---

## 9. Page speed

Targets (mobile): **LCP < 2.5 s**, **CLS < 0.1**, **INP < 200 ms**.

1. Run [PageSpeed Insights](https://pagespeed.web.dev/) for the homepage and one service page.
2. Run Lighthouse locally against production:
   ```powershell
   npx lighthouse https://<your-domain> --preset=desktop --view
   ```
3. Check the build output: shared JS is ~87 kB first load; the hero artwork is SVG and fonts are self-hosted with `display: swap`.
4. Analytics is consent-gated, so third-party scripts do not affect the initial load for new visitors.
5. `next.config.mjs` enables AVIF/WebP output for any raster images added later.
6. Re-test after enabling analytics and after adding any real clinic photography.

---

## 10. Production smoke test

Run after every deploy:

**Build note:** `apps/web/package.json` runs the following, inline, inside its `dev` and `build` scripts before starting Next.js. Keep this. Do not move any of it back to `prebuild` hooks; the deployment environment did not execute them.

1. `scripts/generate-prisma-client.mjs` — runs `prisma generate` against `apps/api/prisma/schema.prisma`. Without it, a deployment that builds only `apps/web` ships the Prisma *stub* client, so types such as `AuditAction` are missing and `new PrismaClient()` throws at runtime. `prisma generate` never connects to the database and never runs migrations. On Windows the query-engine DLL can be locked by a running dev server; the script continues only when an already-generated client provably contains our schema's types, so a genuine generation failure still fails the build.
2. Compiles `packages/types` and `packages/validation`. Without this, deployments fail with `Can't resolve '@citydental/validation'` because the workspace `dist` folders are gitignored.

**Build-time database requirement:** `/api/locations` is prerendered as a static route and calls `prisma.location.findMany()` during `next build`, so the build itself needs `DATABASE_URL` to be set **and** reachable from the build environment. Set it in the deployment environment's variables — the repo's `.env` is gitignored and is not present on Vercel. If the database is only reachable from your machine, that build fails with `Environment variable not found: DATABASE_URL` or a connection error.

```powershell
$base = "https://<your-domain>"
foreach ($p in @("/", "/about", "/services", "/services/oral-surgery",
  "/services/oral-surgery/wisdom-teeth-removal", "/doctors",
  "/doctors/dr-kamlesh-kumar-yadav", "/patient-resources",
  "/patient-resources/faqs", "/careers", "/contact", "/book-appointment",
  "/robots.txt", "/sitemap.xml", "/manifest.webmanifest",
  "/og-image.png", "/favicon.ico")) {
  $r = Invoke-WebRequest ($base + $p) -UseBasicParsing
  "{0} {1}" -f $r.StatusCode, $p
}
```

Then confirm:

- [ ] Unknown URL returns the custom 404 with status 404.
- [ ] `/robots.txt` and `/sitemap.xml` use the production origin.
- [ ] Homepage HTML contains `canonical`, `og:image`, `twitter:card` and `Dentist` JSON-LD.
- [ ] Service/doctor pages contain `BreadcrumbList`; FAQ page contains `FAQPage`.
- [ ] Security headers present (CSP, HSTS, nosniff, frame deny, referrer, permissions).
- [ ] `/admin` redirects to `/login`; `/admin/*` and `/workspace` send `X-Robots-Tag`.
- [ ] Contact form: success with SMTP configured; `503` with a clear message when not.
- [ ] Careers form: all fields validate; `503` shows the email/call fallback and no false success; no confirmed-vacancy claim appears.
- [ ] Cookie banner appears, blocks analytics until accepted, and footer “Cookie settings” reopens it.

---

## 11. Rollback

1. Keep the previous deployment artefact available.
2. Re-deploy the previous build if smoke tests fail.
3. Database migrations are forward-only; take a backup before applying new migrations.
4. If analytics or consent breaks, unset `NEXT_PUBLIC_ANALYTICS_PROVIDER` and redeploy — the site remains functional without it.

---

## 12. Post-launch checklist

- [ ] GSC property verified and sitemap submitted
- [ ] Homepage indexing requested
- [ ] Bing Webmaster import complete
- [ ] GA4 realtime events verified after consent
- [ ] Google Business Profile verified
- [ ] HTTPS + HSTS validated
- [ ] Mobile PageSpeed recorded
- [ ] `robots.txt` shows AI crawler rules
- [ ] Contact enquiry received in the practice inbox
- [ ] Test appointment email received
