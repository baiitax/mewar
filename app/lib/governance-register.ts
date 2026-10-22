export const GOVERNANCE_STATUSES = [
  "OPEN",
  "OWNER_ASSIGNED",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "BLOCKED",
] as const;

export type GovernanceStatus = typeof GOVERNANCE_STATUSES[number];

export const GOVERNANCE_DECISIONS = [
  {
    code: "D-01",
    title: "Sponsor, launch scope and go/no-go authority",
    authority: "Executive sponsor / ICT (to confirm)",
    prompt: "Name the service owner and risk acceptor; select exactly which services are in scope; define who can approve, pause or roll back a release.",
    evidence: "Signed scope, accountable owner, RACI and release-authority record.",
  },
  {
    code: "D-02",
    title: "Privacy, data classification and retention",
    authority: "DPO / Legal (to confirm)",
    prompt: "Approve purposes, lawful basis, privacy notice, data classification, access, retention/deletion, data-location and incident/breach handling rules.",
    evidence: "Approved privacy notice, retention schedule, data-flow/PIA and data-location decision.",
  },
  {
    code: "D-03",
    title: "Approved admissions intake and offer policy",
    authority: "Admissions / Registrar (to confirm)",
    prompt: "Approve the live intake/session, dates, programme checklist/eligibility, required notices and offer/acceptance/deadline/withdrawal rules.",
    evidence: "Signed intake decision, checklist version, date range and offer policy.",
  },
  {
    code: "D-04",
    title: "Authoritative student record and academic rules",
    authority: "Registry / Academic Affairs (to confirm)",
    prompt: "Define the official student number, system of record, assignment/reissue policy, academic session, curriculum/course sources and enrollment lifecycle.",
    evidence: "Approved identity, session, curriculum and enrollment policy with authoritative source references.",
  },
  {
    code: "D-05",
    title: "Identity, SSO, MFA and staff role lifecycle",
    authority: "ICT / Identity owner (to confirm)",
    prompt: "Supply the MIU IdP configuration and define claims, role mapping, MFA, staff provisioning, access reviews and offboarding.",
    evidence: "Approved OIDC/SSO configuration, role matrix, MFA and joiner/mover/leaver test record.",
  },
  {
    code: "D-06",
    title: "Hosting, domain, database and recovery",
    authority: "ICT / Operations (to confirm)",
    prompt: "Choose approved hosting, public origin, data location, PostgreSQL service, proxy/network trust boundary, secrets vault and recovery targets.",
    evidence: "Approved architecture, Postgres migration rehearsal, vault plan, backup/restore and rollback record.",
  },
  {
    code: "D-07",
    title: "OTP and document handling services",
    authority: "ICT / Admissions / Records owner (to confirm)",
    prompt: "Choose approved email/SMS and private document storage/scanning services; define delivery, abuse, quarantine, retrieval and deletion controls.",
    evidence: "Approved provider/interface records and tested end-to-end delivery, scanning, authorization and deletion evidence.",
  },
  {
    code: "D-08",
    title: "JAMB/CAPS authority and reconciliation",
    authority: "Admissions / ICT (to confirm)",
    prompt: "Confirm whether an integration is authorized, what fields may be used, who can access it, and how discrepancies are reconciled.",
    evidence: "Written authority, interface contract, security review and reconciliation test.",
  },
  {
    code: "D-09",
    title: "Fees, payment provider and Bursary controls",
    authority: "Bursary / Finance (to confirm)",
    prompt: "Approve signed schedules and units/currency, payment allocation, deposits, refunds/reversals/chargebacks, settlement, receipt wording and clearance authority.",
    evidence: "Signed fee source, provider/merchant approval, finance policy, settlement/reversal tests and receipt approval.",
  },
  {
    code: "D-10",
    title: "SIS, ERP, LMS and service interfaces",
    authority: "ICT / Registry / Academic Affairs (to confirm)",
    prompt: "Identify the authoritative systems and define identity/course mappings, service accounts, idempotency, retries, conflicts, monitoring and support.",
    evidence: "Approved interface contracts, sandbox end-to-end tests, reconciliation and operational runbooks.",
  },
  {
    code: "D-11",
    title: "Security, privacy assurance and operational acceptance",
    authority: "Security owner / DPO / Operations (to confirm)",
    prompt: "Approve the threat model, privacy/security review, penetration test, findings disposition, monitoring, incident response, support and restore exercises.",
    evidence: "Signed assessment reports, closed/accepted findings, alert/restore/incident exercises and operational acceptance.",
  },
] as const;

export function isGovernanceStatus(value: unknown): value is GovernanceStatus {
  return typeof value === "string" && (GOVERNANCE_STATUSES as readonly string[]).includes(value);
}
