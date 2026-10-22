# MIU Platform — Phase 5: Finance Preview

**Status:** Development-only, synthetic finance workflow. This is not a payment service, accounting system, evidence of funds received, official receipt, or clearance decision.

## Preview workflow

1. The Finance panel appears only after an applicant accepts a development-preview offer and has a preview enrollment.
2. A fee assessment can be prepared only when a currently effective fee schedule exists for the same programme/session and is published, marked `APPROVED`, signed and internally consistent. The assessment copies the exact whole-NGN total and schedule version. If a valid schedule is absent, the request is rejected; no amount is estimated or invented.
3. Assessment creation is unique per enrollment. It appends one `DEBIT` charge row to `FinanceLedgerEntry`; retries return the existing assessment.
4. The applicant may trigger a **full-balance simulator event**. The server ignores client-supplied amounts, records a `PREVIEW_SIMULATOR` event with an idempotency key and synthetic provider reference, then appends one `CREDIT` ledger row in the same transaction. One payment is allowed per assessment; partial payments, refunds and chargebacks are not implemented.
5. The applicant sees a `MIU-TEST-REC-YYYY-000001` receipt code and a QR code. The QR resolves to an opaque-token verification page. That public page shows only the synthetic receipt, programme/session, amount and ledger-derived preview balance; it does not reveal a person's name, email or student ID.
6. Bursar/Super Admin can select synthetic payment references in `/admin/finance`, submit a synthetic batch reference and reported total, and record `MATCHED` or `VARIANCE`. Batch-reference retries with identical contents are idempotent. A variance does not rewrite the payment ledger.
7. The balance is calculated from ledger rows (`DEBIT` charges minus `CREDIT` synthetic captures). `PREVIEW_CLEARED` / `PREVIEW_PENDING` is a derived display value only. It is not stored as an official clearance, does not unlock registration, and does not grant access to student services.

## Data and access controls

- `FeeAssessment` is unique per `StudentEnrollment`, references its signed `FeeSchedule`, snapshots the amount/currency and is marked preview-only.
- `FinanceLedgerEntry` is append-style in the application: there are no update/delete finance endpoints. Assessment charges and synthetic payment credits have unique idempotency keys.
- `FinancePayment` enforces one synthetic full payment per assessment, with unique provider reference, idempotency key, receipt code and high-entropy receipt token.
- `SettlementBatch` stores the reported and matched totals, unique batch reference, stable request hash, result, creating staff ID and linked test payment events.
- `/api/applications/:id/preview-assessment` and `/preview-payment` require the signed-in applicant to own the accepted application and preview enrollment.
- `/admin/finance` and `/api/admin/finance` are restricted to `BURSAR` and `SUPER_ADMIN`; applicant and other staff roles are denied.
- `/finance/verify/:token` is public token verification with no personal identifiers. The QR image endpoint accepts only an existing synthetic receipt token. `MIU_PREVIEW_PUBLIC_URL` may be set to a valid absolute preview origin to pin the QR destination; otherwise the development request host is used.
- Important assessment, capture and reconciliation operations create audit records.

## Production gates

All Phase 5 finance-preview writes are blocked in production with `503`; the preview Bursary API is also disabled, the finance workspace is hidden/redirected and the preview receipt-verification page is not served. A future live finance release needs all of the following, plus a fresh reviewed production design:

1. MIU Finance/Bursary-approved fee schedule and fee-component rules, session applicability, effective dates, currency and NGN/kobo handling.
2. MIU-selected payment provider; approved merchant account and legal entity, API credentials in a managed vault, webhook signature verification, replay protection, provider idempotency contract, failure/retry policy, monitoring and security review.
3. Written Finance rules for payment allocation, partial payments, deposits, refunds, reversals, chargebacks, disputes, bank fees, settlement currency, receipt wording and official clearance authority.
4. Authoritative settlement files or bank/provider integration, segregation of duties, exception queue, variance workflow, accounting/ERP mapping, audit and month-end control.
5. Official receipt number format, issuance authority, retention, public verification domain, QR anti-tamper/signing policy and privacy review.
6. Registrar/Bursary rules for any link between financial balances and registration clearance. The preview makes no such link.
7. Managed PostgreSQL and reviewed migrations, access policy, MFA/SSO, security test, operational monitoring, backups/restore, privacy/retention approval and incident response.

The current local SQLite implementation must not be pointed at a production database. No provider, bank, payment network, ERP or SIS is called, and no money moves. Use synthetic data only.

## Verification

- `npm run test:finance` creates/removes synthetic applicants, accepted test applications, preview student records, signed fee schedules, test payments and settlement batches.
- The integration test checks signed-schedule enforcement, assessment/payment idempotency, client amount tampering resistance, ledger-derived balance, QR PNG generation, privacy of public verification, Bursar role restrictions, exact settlement matching and variance isolation.
- It is safe only against the local development database. Test sequence rows may advance, leaving harmless gaps in future preview receipt codes.
