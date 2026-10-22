# MIU Platform — Phase 3: Applicant Portal MVP

**Status:** Implemented as a local development preview. It is not a production admissions service, an approved intake, or a security certification. Use synthetic test information only.

## Applicant journey implemented

- **Registration:** `/applicant/register` simulates email and phone OTP verification, creates an `APPLICANT` account and blocks duplicate normalized email/phone. Codes are short-lived, attempt-limited, stored as HMAC digests and consumed during registration. The local code is deliberately displayed in the preview UI; no message is delivered.
- **Authentication:** applicants use the existing Auth.js credentials flow. Applicant sessions are routed to `/portal`; staff sessions continue to `/admin`. Applicants must have verified email and phone flags to sign in.
- **Dashboard:** `/portal` lists an applicant's own records and lets them create one draft per programme/session. `/portal/applications/:id` supports save/resume, profile and entry-route fields, JAMB score/registration data and entered O-level subjects.
- **Application numbering:** one transaction increments a yearly sequence and creates `MIU-APP-YYYY-000001-CHECK`. The sequence is database-backed; a checksum is generated with the local authentication secret.
- **Deduplication:** User email and normalized phone are unique. A JAMB registration number is encrypted with AES-256-GCM and separately HMAC-keyed for uniqueness; only the last four characters are stored in clear. Do not rotate the preview secret while keeping test records if you expect to decrypt them.
- **Documents:** the preview accepts one PDF, PNG or JPEG at a time, up to 5 MB, checks the file extension, declared MIME type and basic magic-byte signature, and then discards the bytes. It stores no file, does not run antivirus/malware scanning, does not verify document contents or authenticity, and does not treat the file as received. Never select a real applicant document.
- **Applicant status dashboard:** applicants see their own status and any explicitly applicant-visible message. Staff-only review notes are not returned in the applicant API response.
- **Staff review:** `/admin/applications` and its API are restricted to `SUPER_ADMIN`, `REGISTRAR` and `ADMISSIONS`. Supported transitions include `SUBMITTED → UNDER_REVIEW / NEEDS_INFORMATION / OFFERED / NOT_OFFERED`. Decision changes create a status event and audit record; requests for information/non-offers require an applicant-facing message.

## Preview-only behavior and intake status

- In non-production development, active catalogue entries can be used for **synthetic workflow testing**. The default preview session label is `2026/27`, configurable with `MIU_PREVIEW_APPLICATION_SESSION`. This label does not mean that MIU has opened an intake.
- Test submissions update the local record to `SUBMITTED` so the status workflow can be exercised. They are not delivered to Admissions, do not constitute an official MIU application, and do not imply eligibility, an offer or admission.
- In production, registration/OTP endpoints return `503` because no approved email/SMS provider is integrated. Intake creation also requires `MIU_APPLICATIONS_ENABLED=true`, `MIU_ACTIVE_APPLICATION_SESSION`, and the individual programme's `isAcceptingApplications` flag. Submission additionally checks the email/SMS, storage, malware-scanning and approved-privacy flags. These flags are gates—not evidence that an integration has been delivered or tested.
- Until approved provider and storage integrations are implemented and reviewed, the portal must remain unavailable for real applicants. Do not set production readiness variables merely to bypass the gate.

## API routes

- `POST /api/applicant/otp/send` — development-only local OTP simulation for email or phone.
- `POST /api/applicant/otp/verify` — verifies a short-lived development code.
- `POST /api/applicant/register` — creates a verified preview identity; disabled in production.
- `GET /api/applications` — lists only the signed-in applicant's records.
- `POST /api/applications` — create/resume a draft for the preview session.
- `GET /api/applications/:id` — applicant-owned record, safe status history and decrypted JAMB value for that applicant.
- `PATCH /api/applications/:id` — save a draft or submit the synthetic preview record.
- `POST /api/applications/:id/documents/validate` — in-memory format check only; uploaded bytes are discarded.
- `GET /api/admin/applications` — restricted Admissions review queue (latest 100 records).
- `PATCH /api/admin/applications/:id` — restricted, audited status transition and applicant-visible message.

All applicant endpoints require the applicant role and verify record ownership. Staff review endpoints authorize role server-side; UI hiding is not the security control.

## Local verification

1. Use the existing `.env.local` preview configuration. Do not commit secrets or use real identities.
2. `npx prisma migrate dev` applies the local Phase 3 migration.
3. `npm run dev` starts the preview at `http://localhost:3001`.
4. Run `npm run typecheck`, `npm run build`, `npm run test:smoke`, `npm run test:fees`, and `npm run test:applicants`.
5. `test:applicants` creates and removes synthetic applicant/reviewer records and a preview application. The yearly application sequence intentionally advances, leaving a harmless gap in test numbering.

## Production blockers / institutional decisions required

1. Approved intake session and Registry-controlled per-programme opening/closing configuration.
2. Registrar-approved programme checklist, entry criteria and accessible applicant-facing notices.
3. Approved privacy notice, retention schedule, lawful-basis/consent wording and DPO review for applicant/identity data.
4. Institution-approved email and SMS OTP providers, templates, delivery monitoring and production abuse/rate-limit controls.
5. Secure private document storage, retention/deletion policies, signed download authorization, antivirus scanning/quarantine and an incident process. No upload bucket is implemented here.
6. Stable key management: separate managed `APP_PII_ENCRYPTION_KEY` and `APP_PII_DEDUP_KEY`, secrets vault, rotation/recovery procedure and encrypted database/backups. The local preview falls back to `AUTH_SECRET` only outside production.
7. Managed PostgreSQL and a reviewed production migration/backup/restore plan; the local DB is SQLite.
8. Registrar/Admissions staff roster, least-privilege role assignment, MFA/SSO and counsellor assignment workflow.
9. JAMB integration/reconciliation authority and security review. This MVP records applicant-entered JAMB data only; `jambCapsStatus` remains `NOT_SYNCED` and no JAMB API/CAPS call is made.
10. Security/privacy assessment, threat model, penetration test, production monitoring, operational support and incident response.

## Not included

No live OTP delivery, official active intake or eligibility decision, application document storage/scanning, JAMB CAPS lookup, scholarship exam/schedule, live payment processing or offer-letter issuance is implemented. Phase 4 adds a synthetic student-record preview and Phase 5 adds a synthetic finance/receipt preview only; neither issues an official matriculation number, payment receipt or clearance. Student email and live SIS/LMS/ERP provisioning remain gated or restricted notices.
