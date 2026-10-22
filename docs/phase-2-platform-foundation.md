# MIU Platform — Phase 2: Platform Foundation

**Status:** Workspace implementation complete; development preview on port 3001. This is not a production deployment or a security certification.

## Implemented

- **Prisma data foundation:** users, Auth.js adapter tables, role attributes, applicant/application placeholders, programme catalogue, fee schedules, CMS ownership metadata, audit records and persistent login throttles.
- **Development identity flow:** Auth.js credentials login backed by bcrypt password hashes; roles are exposed to protected server pages. Login actions are audit-logged. Repeated failures are blocked after five attempts in a 15-minute window for the email/IP key.
- **Protected staff workspace:** `/admin` and `/admin/fees` require a session and an allowed role. Fee drafts are private. Only a `BURSAR` role can publish a draft; the operation requires a named signatory, records a timestamp and writes an audit event.
- **Fee source-of-truth:** `GET /api/fees` and public fee displays return only schedules marked `APPROVED`, published, and signed. Home, programme details and the fees page use database-backed records rather than hard-coded amounts. No Bursary source file was supplied, so the local database deliberately contains **no fee schedule values**; the public site says approval is pending instead of guessing.
- **Programme catalogue:** the 12 catalogue entries are seeded. Accreditation references were left blank because approved current-session letters were not available for import.
- **Health and catalogue APIs:** `/api/health`, `/api/programmes`, `/api/fees`.
- **Content truthfulness:** the preview does not claim a Registry-signed 2026/27 calendar or publish made-up dates; it links users to the Registry for the current approved copy. Campus area is withheld until Estates/Council resolves the 150-hectare/800-acre conflict. The privacy notice is explicitly pending DPO/Legal approval.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and provide a unique `AUTH_SECRET` and a bootstrap admin password of at least 16 characters. `.env.local` is ignored by git.
3. `npx prisma migrate dev`
4. `npm run db:seed` (only programme records are inserted; bootstrap admin is updated only if the password environment variable is present; no fees are seeded).
5. `npm run dev` — listens on `0.0.0.0:3001`.
6. `npm run test:smoke`, `npm run test:fees`, `npm run test:applicants`, `npm run test:students`, `npm run test:finance` and `npm run test:governance` (integration tests create/remove synthetic records; never run them against production data).

## Endpoints and controls

- `GET /api/health` — minimal readiness response; no user/database counts are exposed.
- `GET /api/programmes?school=Computing` — programme catalogue; includes only signed fee metadata if available.
- `GET /api/fees?session=2026/27&programme=software-engineering` — public, signed schedules only.
- `POST /api/fees` — authenticated `SUPER_ADMIN` or `BURSAR` creates a private draft.
- `PATCH /api/fees/:id` — `BURSAR` only; signs and publishes a draft after explicit confirmation. Supersedes the prior published schedule for that programme/session.
- `/admin` — restricted dashboard and audit-log view.
- `/admin/fees` — restricted fee schedule workflow.
- `/admin/finance` — Bursar/Super Admin development-only ledger and synthetic settlement workspace; see [`phase-5-finance-preview.md`](./phase-5-finance-preview.md).
- `/admin/governance` — Super Admin development-only Phase 6 decision tracker; status is self-reported, synthetic-only, and cannot record approval or unlock a release.

## Not yet production-ready (explicit gates)

1. **OIDC/SSO:** the Auth.js configuration has an optional OIDC provider hook, but no MIU issuer/client details were supplied. The current credential flow is a development authentication foundation, not a federation service or verified institution-wide SSO.
2. **MFA:** the schema has MFA fields, but TOTP enrolment/verification is not implemented. Do not use this preview for finance, registry or real personal data.
3. **Deployment security:** production requires authoritative IdP details, managed secret vault, TLS/HSTS/WAF, a reviewed trust-proxy/IP policy, distributed rate limiting/CAPTCHA, pen-test, backups/restore and security monitoring.
4. **Database:** SQLite is for this workspace only. Generate and review a separate Postgres migration set before connecting a managed production database; do not simply change the provider string.
5. **Authoritative records:** import signed fee schedule, approved curriculum/accreditation documents, current calendar and DPO-approved privacy notice before publishing those facts.
6. **Applicant services:** Phase 3 now provides a local synthetic-data preview only. Production OTP delivery, an approved intake/checklist, secure document storage/scanning, applicant privacy approval and JAMB reconciliation remain unavailable; see [`phase-3-applicant-portal-mvp.md`](./phase-3-applicant-portal-mvp.md).
7. **Dependency security:** the current `npm audit --omit=dev` check reports 0 production dependency vulnerabilities. A full install audit reported 7 findings (2 moderate, 5 high), mainly in the development toolchain; they have not been remediated or fully triaged. Re-run and review both audits before deployment.

## Phase sequence

- **Phase 2 — Foundation:** implemented for the local preview; production readiness gates remain.
- **Phase 3 — Applicant Portal MVP:** local synthetic-data workflow implemented; secure production identity, approved intake, document handling and JAMB integration remain gated.
- **Phase 4 — Student records preview:** applicant acceptance creates an idempotent test student ID and preview session/enrollment/curriculum status; official matriculation, SIS/SSO and LMS integrations remain gated. See [`phase-4-student-records-preview.md`](./phase-4-student-records-preview.md).
- **Phase 5 — Finance preview:** implemented as a synthetic development workflow. Applicants can create assessments from signed Bursary schedules and simulate a full-balance capture; Bursary can reconcile synthetic batches; QR receipts resolve to privacy-limited preview verification. No real payment/provider, official receipt or clearance is issued. See [`phase-5-finance-preview.md`](./phase-5-finance-preview.md).
- **Phase 6 — Production-readiness planning:** workshop pack and development-only decision tracker added; owner/policy/approval fields remain blank, and all release gates remain blocked pending MIU decisions, authoritative sources, integrations and independent assurance. No production switch or deployment is authorized. See [`phase-6-production-readiness-plan.md`](./phase-6-production-readiness-plan.md) and [`MIU-phase-6-governance-workshop-pack.docx`](./MIU-phase-6-governance-workshop-pack.docx).
