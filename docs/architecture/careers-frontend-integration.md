# Careers frontend — current behaviour and backend integration

**Status:** frontend complete; dedicated careers API not implemented.
**Scope:** `apps/web` only. No NestJS, Prisma, PostgreSQL, auth or appointment code was changed for this update.

## 1. What the frontend does today

- Route: `/careers`
- Form component: `apps/web/src/components/CareersForm.tsx`
- Categories are presented as **hiring interests**, not confirmed vacancies.
- The form collects: full name, phone, email, position, qualifications, optional experience, a short introduction and consent.
- The form validates all required fields in the browser before sending.
- There is **no resume upload**. No upload/storage workflow exists in the frontend today.
- Applications are delivered through the existing `POST /api/contact` route with a message beginning with `CAREERS APPLICATION`. The body includes the position, qualifications, experience, consent marker and introduction.
- The form reports success **only** when the endpoint returns HTTP 200 and `status: "SUCCESS"`.
- When mail delivery is not configured (`503` / `NOT_CONFIGURED`), the form says online applications are not connected and directs the applicant to `citydentalEtah@gmail.com` or the clinic phone number. It never claims delivery.

### Why the contact route is reused

`/api/contact` is the only existing SMTP-backed delivery path. Reusing it keeps this change frontend-only and avoids inventing a working careers backend. The trade-off is that applications arrive in the general enquiry inbox and cannot carry attachments.

## 2. Required backend work

Replace the contact-route reuse with a dedicated NestJS careers endpoint.

### 2.1 Endpoint

```http
POST /api/v1/careers/applications
Content-Type: multipart/form-data
```

Suggested fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `fullName` | string | yes | 2–100 characters |
| `phone` | string | yes | 7–30 characters, validated server-side |
| `email` | string | yes | valid email, ≤200 characters |
| `position` | enum/string | yes | must match an approved position identifier |
| `qualifications` | string | yes | ≤300 characters |
| `experience` | string | no | ≤300 characters |
| `message` | string | yes | 10–900 characters |
| `consent` | boolean | yes | must be `true`; store `consentAt` timestamp and policy version |
| `resume` | file | no | PDF/DOC/DOCX, max 5 MB, virus-scanned |
| `company` | string | no | honeypot; reject silently when non-empty |

Do not accept HTML in text fields. Strip or reject markup. Apply rate limiting per IP/email and return a generic error to avoid account enumeration.

### 2.2 Suggested data model

- `CareerApplication`
  - `id`, `organizationId`, `fullName`, `phone`, `email`
  - `position`, `qualifications`, `experience`, `message`
  - `consentAt`, `consentVersion`
  - `resumeObjectKey`, `resumeOriginalName`, `resumeMimeType`, `resumeSize`
  - `status`: `NEW | REVIEWING | SHORTLISTED | REJECTED | HIRED | WITHDRAWN`
  - `createdAt`, `updatedAt`
  - optional `source`, `reviewedBy`, `reviewedAt`, `notes`
- Index on `organizationId`, `createdAt`, `status`, and a hash of `email` for duplicate checks.
- Enforce organization scoping in every query, consistent with the rest of the NestJS API.

### 2.3 Resume storage

- Store files in a **private** S3-compatible bucket; never a public URL.
- Use server-generated object keys (`careers/{organizationId}/{applicationId}/{uuid}`).
- Enforce MIME type, extension and size server-side; scan for malware before persisting metadata.
- Serve downloads through short-lived signed URLs to authorized admin users only.
- Define a retention period and a deletion job. Do not keep resumes indefinitely.

### 2.4 Responses

```json
{ "status": "SUCCESS", "applicationId": "..." }
```

```json
{
  "status": "FAILED",
  "reason": "Please check the highlighted fields.",
  "fields": { "email": ["Please enter a valid email address."] }
}
```

- `503` with `status: "NOT_CONFIGURED"` when mail/storage is unavailable.
- `429` for rate limiting.
- The frontend shows success only for `status: "SUCCESS"`; keep that contract.

### 2.5 Notifications and admin workflow

- Email the practice inbox (or a careers inbox) with a summary and a secure admin link.
- Do not attach resumes to email; link to the authenticated application record instead.
- Add an admin list/detail view or an export for reviewing applications.
- Record status changes in the audit log.
- Do not send automated rejections unless the clinic has approved the wording.

## 3. Frontend changes when the API exists

1. Change the form `fetch` target to `/api/v1/careers/applications` (or a Next.js BFF proxy if the project keeps that boundary).
2. Send `multipart/form-data` with a `FormData` body.
3. Add a resume file input (optional) with client-side type/size checks and a clear error for unsupported files.
4. Render the server's field errors using the same `aria-invalid` / `aria-describedby` pattern.
5. Keep the honest `NOT_CONFIGURED` state.
6. Add an analytics event only for the final result; do not send applicant details to analytics.

## 4. Privacy and accessibility notes

- Collect only what is needed to review an application.
- Link the consent text to the clinic's privacy policy once that page exists.
- Do not ask for patient health information, government IDs or payment details.
- Keep labels, focus states, error text and the success/alert regions accessible.
- The current form is keyboard operable and uses native controls; preserve that when adding uploads.

## 5. Verification for this frontend change

- `tsc --noEmit`
- ESLint
- Jest (including `apps/web/src/app/careers/page.test.tsx`)
- Production build
- Manual keyboard check of the form and the consent control
- Confirm no backend files changed
