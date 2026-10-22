# MIU Platform Preview

A Next.js/Prisma workspace for the MIU public site and staged, development-only applicant, student-record, finance and governance workflows.

> **Status: development preview only — not approved for production.** Do not use real applicant, student, staff, identity-document or financial data. There is no live SIS, SSO, LMS, payment-provider or bank integration, and no money moves.

## Local setup

Requirements: Node.js 20+, npm, and a local SQLite database.

```bash
npm ci
cp .env.example .env.local
```

Set a unique random `AUTH_SECRET` in `.env.local`. Set `MIU_BOOTSTRAP_ADMIN_PASSWORD` only if you intend to seed/update a local preview Super Admin; use a long random password and never commit `.env.local`.

```bash
npx prisma migrate dev
npm run db:seed
npm run dev
```

The preview listens on `http://localhost:3001` (or the workspace live preview). The seed inserts the catalogue only; it does not seed fee amounts, real users, decisions or policy approvals.

## Verification

```bash
npm run lint
npm run build
npm run test:smoke
npm run test:fees
npm run test:applicants
npm run test:students
npm run test:finance
npm run test:governance
```

Integration tests create and remove synthetic records. Run them only against the disposable/local development database, never production.

## Workflows and controls

- **Applicant Portal:** local OTP simulation, synthetic applications and staff review; not an approved intake.
- **Student records:** `MIU-TEST-STU-…` identifiers and preview enrollment only; no official matriculation or student service access.
- **Finance preview:** assessments only from currently effective, signed fee schedules; simulator captures and QR receipts are not proof of payment or official clearance.
- **Governance preview:** `/admin/governance` is a Super Admin-only development tracker for D-01–D-11. It accepts synthetic labels/references only, cannot record MIU approval and does not unlock release gates. The fillable workshop pack is in [`docs/MIU-phase-6-governance-workshop-pack.docx`](docs/MIU-phase-6-governance-workshop-pack.docx).

Use synthetic values only in these preview workflows. The public fee views show no guessed amounts; the database has no Bursary schedule seeded.

## Roadmap and release status

- [`docs/phase-2-platform-foundation.md`](docs/phase-2-platform-foundation.md) — implementation roadmap and production gates.
- [`docs/phase-3-applicant-portal-mvp.md`](docs/phase-3-applicant-portal-mvp.md) — applicant preview.
- [`docs/phase-4-student-records-preview.md`](docs/phase-4-student-records-preview.md) — student-record preview.
- [`docs/phase-5-finance-preview.md`](docs/phase-5-finance-preview.md) — finance preview.
- [`docs/phase-6-production-readiness-plan.md`](docs/phase-6-production-readiness-plan.md) — MIU owner/policy decisions, evidence and release gates.

**Production decision: NO-GO.** The local database is SQLite. A production release requires MIU-approved scope, owners and authoritative policies; approved privacy/data rules; institutional OIDC/SSO and MFA; managed PostgreSQL and reviewed migrations; secure document/OTP and other required integrations; security/privacy assessment; operational support, backup/restore and recorded go/no-go approval. Do not bypass these requirements by setting environment flags.
