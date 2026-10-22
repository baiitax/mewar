# MIU Platform — Phase 6: Production-Readiness Plan

**Status:** Planning and gap assessment only. No production approval has been given. The current application remains a development preview and must not be connected to real applicant, student, staff or financial data.

**Assessment date:** 22 October 2026  
**Decision:** **NO-GO for production** until the gates below have named approvers, signed evidence and verified implementation.

## 1. Purpose and boundaries

Phase 6 converts the known release blockers in Phases 2–5 into an approval-and-evidence process. It does not enable production routes, choose vendors on MIU's behalf, infer institutional policy, or certify security. Production feature flags are not a substitute for an integration, test report or signed approval.

Keep the following behavior unchanged until a separate release is designed, reviewed and approved:

- Applicant registration/OTP and applicant write paths remain gated.
- Offer acceptance and student-record creation remain development-only.
- Phase 5 assessments, simulated payments, settlement comparison, QR receipts and preview clearance remain development-only; **no money moves**.
- ERP, staff/student mail, LMS and other portals remain restricted SSO notices, not legacy login links.
- No official matriculation number, course registration, financial clearance or student account is issued by this preview.
- Use synthetic data only. Do not import real personal data or production credentials into the local SQLite workspace.

## 2. Current baseline and known blockers

| Area | Current workspace state | Production implication |
|---|---|---|
| Runtime/data | Next.js preview on port 3001; Prisma uses local SQLite. Six local migrations are present. | No production deployment or PostgreSQL migration set exists. A provider-string change is insufficient; produce and review a separate PostgreSQL migration and restore plan. |
| Authentication | Auth.js credentials preview; optional OIDC hook has no MIU issuer/client configuration. MFA fields are only a stub. | No institution-wide SSO, verified staff identity, MFA or joiner/mover/leaver process. |
| Admissions | Synthetic applicant registration/OTP and application status workflow. No approved live intake, eligibility, offer-letter policy or delivered email/SMS provider. | Keep real intake unavailable until policy, delivery and privacy controls are approved and tested. |
| Documents | Format/signature checks run in memory; bytes are discarded. No durable storage, malware scanning, quarantine or retrieval authorization. | Do not accept real application documents. |
| Student records | Synthetic `MIU-TEST-STU-…` identity and preview enrollment only. Session/curriculum placeholders are unconfigured. | No official matriculation, curriculum, SIS/SSO or LMS provisioning. |
| Finance | Signed-schedule-only synthetic assessment/payment and test reconciliation. Local database currently has no fee schedule values. | No payment provider, merchant account, bank settlement, official receipt, refund/chargeback policy or registration clearance. |
| Authoritative content | Programme accreditation references, current signed fee schedule, approved calendar, DPO-approved privacy notice and other authoritative documents have not been supplied in this workspace. | Public claims and operational rules must remain withheld or explicitly pending until verified. |
| Security/operations | Preview authentication throttling and application audit records exist; deployment controls, independent security review, operational monitoring and restore evidence are not established. | This is not a security certification or production service. |
| Dependencies | Last `npm audit --omit=dev` found 0 production dependency findings; full audit reported 7 development-dependency findings (2 moderate, 5 high), not remediated. | Review the complete audit, remediate or formally accept findings, and re-run against the exact release lockfile. |

## 3. Release gates

Every gate requires an accountable MIU owner, written approval, evidence stored in an institutional repository, and technical verification in a production-like staging environment. A checkbox without evidence does not close a gate.

### G0 — Governance, scope and accountability — **BLOCKED**

- Name the executive sponsor, service owner, product owner, data controller/contact, technical owner, security owner and operational support team.
- Approve the launch scope: public website only, applicant intake, student records, finance, or another explicitly limited set of services.
- Define who may approve a production release, who accepts residual risk, and who can stop/roll back the service.
- Approve data classification and permitted use of each environment; development, test, staging and production must be separated.

**Evidence to close:** signed scope/owner record, RACI, risk acceptance route, environment/data policy and a named release authority.

### G1 — Institutional rules and authoritative content — **BLOCKED**

- **Admissions/Registry:** approved intake session and dates, programme-specific checklist and entry rules, offer/acceptance/deadline/withdrawal policy, applicant notices, and an authorized source for official outcomes.
- **Registry/Academic Affairs:** official student-number format and uniqueness/reissue rules; approved academic session dates, curriculum versions, course catalogue, enrollment rules and authoritative system of record.
- **Bursary/Finance:** signed fee schedule by programme/session, currency and unit convention, approved fee components, effective dates, payment allocation, deposits, late fees (if any), refunds/reversals/chargebacks, receipt language, settlement and clearance authority.
- **Other content owners:** verify current accreditation, campus, calendar, facilities and contact claims. Resolve known source conflicts before publishing a claim.
- **DPO/Legal:** approve public privacy notice, lawful-basis/consent wording as applicable, purpose limitation, retention/deletion schedule and privacy contact.

**Evidence to close:** current signed/approved source documents with owner, version, effective date and expiry/review date; DPO/Legal approval; approved public-facing text.

### G2 — Identity, access and staff lifecycle — **BLOCKED**

- ICT supplies MIU-approved OIDC issuer, client credentials, redirect/logout URIs, scopes, claims, signing-key rotation and test accounts.
- Approve role mapping and least privilege for Admissions, Registrar, Bursary, Super Admin and any other staff groups. Verify that UI hiding is never the authorization control.
- Implement and test MFA for staff; define account provisioning, role approval, periodic access review, suspension and offboarding.
- Set password/recovery policy for any remaining local credentials and prevent bootstrap accounts from reaching production.
- Define the trusted reverse-proxy/host/IP boundary. Review Auth.js `trustHost` behavior and all reliance on `x-forwarded-for` / forwarded host headers before deployment.

**Evidence to close:** signed role matrix, IdP configuration approval, successful positive/negative authorization tests, MFA evidence, staff roster and joiner/mover/leaver procedure.

### G3 — Hosting, database, secrets and data lifecycle — **BLOCKED**

- Select the MIU-approved production hosting environment, domain, TLS termination, DNS, WAF/network controls and data-location requirements.
- Provision managed PostgreSQL. Generate a PostgreSQL-specific migration set, review it, rehearse on a disposable database and document migration/rollback/restore procedures. Do not reuse SQLite or run `migrate dev` against production.
- Put `AUTH_SECRET`, OIDC secrets, database credentials, `APP_PII_ENCRYPTION_KEY` and separately keyed `APP_PII_DEDUP_KEY` in an approved secrets vault. Define access, rotation, recovery and incident procedures.
- Enforce production/test data separation, encryption at rest/in transit, backup encryption, retention and deletion. Prove restore into an isolated environment.
- Select private document storage and malware-scanning/quarantine services before enabling document submission. Define access logging, retention and deletion workflows.

**Evidence to close:** infrastructure diagram, approved domain/certificates, Postgres migration rehearsal, vault inventory and access logs, backup/restore report, data-retention/deletion tests and storage/scanning test evidence.

### G4 — External integrations and reconciliation — **BLOCKED**

Implement only after the owner, interface contract, credentials, test environment and operational support are approved:

- **Email/SMS OTP:** provider accounts, templates, delivery monitoring, sender authorization, rate limits, abuse handling and failure/retry behavior.
- **Documents:** private upload and retrieval, content validation, malware scan/quarantine, signed access, deletion and incident path.
- **JAMB/CAPS:** written authority, approved integration method, data minimization, reconciliation process, test cases and access audit.
- **SIS/SSO/LMS/ERP:** system-of-record mapping, identity lifecycle, idempotency/retry, reconciliation, monitoring and duplicate/conflict handling. No test student ID may be promoted to an official ID by implicit role changes.
- **Payments:** MIU-selected provider and merchant account, signed webhook verification, replay/idempotency controls, provider settlement files, refund/reversal/chargeback handling, accounting/ERP mapping and variance queue. Receipt and QR verification must use an approved MIU origin and policy.

**Evidence to close:** approved interface contracts, non-production credentials in the vault, end-to-end test reports, reconciliation/exception tests, monitoring alerts and runbooks. Environment flags must be enabled only after these artifacts exist and have been independently checked.

### G5 — Privacy, application security and assurance — **BLOCKED**

- Complete data-flow inventory, threat model, privacy impact assessment and review of secrets, encryption, role checks, CSRF/origin controls, rate limiting, uploads, logs and public verification routes.
- Add production-grade distributed abuse prevention and alerting; validate trusted proxy/IP configuration. Confirm no personal data or credentials appear in public responses, analytics, logs or error traces.
- Run dependency, static, dynamic and infrastructure scans against the exact release candidate. Review and remediate the outstanding development-toolchain audit findings or record a formally approved exception.
- Arrange independent penetration testing and privacy/security review. Fix findings and retest before pilot.
- Confirm audit-log retention, access, tamper resistance, export and operational review. Existing application audit rows alone do not constitute a monitored or immutable audit service.

**Evidence to close:** approved threat model/PIA, signed security test report, closed or accepted findings, dependency report, access-control test matrix and audit/alerting evidence.

### G6 — Operations, continuity and support — **BLOCKED**

- Assign 24/7 or explicitly bounded support coverage and escalation contacts appropriate to service criticality.
- Define service-level targets, health/readiness checks, dashboards, alert thresholds, log retention, incident response, breach notification and disaster recovery.
- Rehearse backup restoration, database failure, IdP/provider outage, queue/retry failures, credential rotation, rollback and communications.
- Document operational procedures for admissions exceptions, duplicate identities, failed OTP, document quarantine, finance variance/refund and reconciliation.

**Evidence to close:** approved runbooks, named on-call/support roster, alert tests, restore/rollback exercise, incident tabletop and operational acceptance sign-off.

### G7 — Staging, controlled pilot and go/no-go — **NOT ELIGIBLE**

Only begin after G0–G6 are closed for the exact services in scope:

1. Deploy to a production-like staging environment with synthetic identities and provider sandbox accounts; run all regression suites and migration/restore checks.
2. Complete departmental UAT with Admissions, Registry, Bursary, ICT, DPO/Legal and support owners. Record defects, decisions and sign-offs.
3. Approve a limited pilot cohort, support window, stop conditions, rollback owner and data cleanup/retention plan. No real collection or official student provisioning until those functions separately pass their gates.
4. Hold a recorded go/no-go with evidence links, unresolved risk list and explicit service scope. Any missing evidence means **NO-GO**.
5. After launch, monitor a defined hypercare period and require post-launch review before expanding scope.

## 4. Environment and feature-flag rule

The current `.env.example` contains applicant readiness variables, but values such as `MIU_APPLICATIONS_ENABLED`, `MIU_EMAIL_OTP_READY`, `MIU_DOCUMENT_STORAGE_READY` or `MIU_PRIVACY_NOTICE_APPROVED` are **assertions, not integrations or approvals**. Do not set them to bypass a gate. The Phase 4 student-record and Phase 5 finance preview routes have explicit production blockers; do not remove those blockers as part of a configuration-only change.

Before any production build, add a release check that fails closed if a preview-only write route is enabled, a development credential/bootstrap setting is present, SQLite is configured, or required approvals/integration identifiers are absent. The release check must be tested in CI and must not rely on a person remembering a comment in `.env.example`.

## 5. Required MIU decision register

Record an approver, decision, date, document/reference and implementation ticket for each row. `TBD` means the decision has not been supplied to this workspace.

| ID | Decision required | Accountable authority (to confirm) | Current state |
|---|---|---|---|
| D-01 | Service owner, launch scope, risk acceptor and go/no-go authority | Executive sponsor / ICT | TBD |
| D-02 | Privacy notice, lawful basis, retention/deletion, privacy impact and data location | DPO / Legal | Pending approval; no production sign-off |
| D-03 | Active intake, dates, per-programme eligibility/checklist and offer/acceptance policy | Admissions / Registrar | No approved intake configured |
| D-04 | Official student ID, session, curriculum, enrollment and authoritative SIS source | Registry / Academic Affairs | Preview placeholders only |
| D-05 | OIDC/SSO, MFA, role mapping, staff roster and account lifecycle | ICT / Identity owner | No MIU IdP configuration supplied |
| D-06 | Hosting, domain, Postgres, proxy/trust policy, backups and data location | ICT / Operations | Local SQLite preview only |
| D-07 | OTP delivery and document storage/scanning provider and operating procedures | ICT / Admissions / Records owner | No provider integration |
| D-08 | JAMB/CAPS authority, interface and reconciliation | Admissions / ICT | No integration or authority supplied |
| D-09 | Signed fee schedule, currency/unit, payment provider, settlement, refund and clearance rules | Bursary / Finance | Local fee table has no approved values; no provider |
| D-10 | SIS/ERP/LMS interfaces and identity/course provisioning rules | ICT / Registry / Academic Affairs | Restricted notices; no live integrations |
| D-11 | Security assessment, penetration test, monitoring, incident response and support acceptance | Security owner / Operations | Not completed |

## 6. Recommended execution order

1. **MIU decision workshop:** confirm scope, owners, data classification and D-01 through D-04. Capture signed source documents; do not begin with feature flags.
2. **Architecture decision record:** ICT and service owners choose hosting, domain, PostgreSQL, IdP/MFA and approved providers; record data location, trust boundary and operating model.
3. **Detailed solution designs:** create separate approved designs for applicant/document processing, student identity/SIS/LMS and finance/payment/settlement. Keep each as an independently releasable scope.
4. **Build adapters and controls:** implement only against approved interfaces and sandbox credentials. Add CI release blockers and tests for every production-only route and configuration.
5. **Independent assurance:** privacy/security review, migration/restore exercise, penetration test, remediation and operational tabletop.
6. **Staging/UAT/pilot:** complete G7 evidence and recorded go/no-go for one narrow scope before any production release.

## 7. Workshop pack and in-app preview tracker

- Printable/fillable companion: [`MIU-phase-6-governance-workshop-pack.docx`](./MIU-phase-6-governance-workshop-pack.docx). It includes a 90-minute agenda, owner/authority matrix, launch-scope worksheet, D-01–D-11 decision forms, G0–G7 checklist and meeting action table. All actual owner, approval and evidence fields are blank.
- `/admin/governance` is a development-only, `SUPER_ADMIN`-restricted tracker for the eleven decision prompts. It records only synthetic preview owner labels, organizational role/office, tracking note/state and an internal evidence reference.
- The tracker has no approval/signature state, no document upload, no evidence verification and no connection to release flags. `READY_FOR_REVIEW` means only that a preview row is ready for a real authority to review elsewhere. It is not an MIU decision or approval.
- Its API returns `503` in production; its page redirects outside development. Applicant, Bursar and other non-Super-Admin roles are denied. Technical Super Admin access does not confer institutional approval authority.
- **Do not enter actual names, policy text, URLs, credentials, personal data or confidential documents into this local tracker.** Use the workshop pack and MIU's approved records system for real assignments/decisions once authorized.

## 8. Current automated baseline

The workspace has integration coverage for public smoke/protected routes, Bursary fee sign-off, applicant preview, student-record preview, finance preview and the governance tracker. During this Phase 6 implementation, `npm run lint`, `npm run build`, `npm run test:smoke`, `npm run test:fees`, `npm run test:applicants`, `npm run test:students`, `npm run test:finance` and `npm run test:governance` passed. The governance workflow is only a development tracking aid; its tests do not represent institutional approval. These are development integration tests—not production acceptance tests, penetration tests or proof that integrations are available.
