# MIU Platform — Phase 4: Student Records Preview

**Status:** Development-only continuation of the Applicant Portal MVP. This is not official matriculation, an active student system, SIS, or LMS integration.

## Preview flow

1. An Admissions/Registrar/Super Admin test user marks an application `OFFERED` in `/admin/applications`.
2. The applicant signs in and chooses **Accept preview offer** on the application record.
3. A single transaction moves the application to `OFFER_ACCEPTED`, creates a preview-only student identity, and adds one preview enrollment record.
4. `/portal` and the application view show the synthetic identifier. `/admin/students` is a restricted Registry/Admissions/Super Admin read-only view.
5. The actual `/portals/student` page remains a restricted SSO notice. The user's role is not changed, and no new student login is created.

## Data controls

- **Student identity:** `StudentRecord` is linked uniquely to both one user and the accepted source application. A retry returns the existing record rather than issuing a duplicate.
- **Identifier:** generated values use `MIU-TEST-STU-YYYY-000001`. The explicit `TEST` label is intentional: MIU has not supplied the official matriculation format. `officialMatricNo` remains `NULL`.
- **Academic session:** `AcademicSession` records created by the preview are marked `isPreview=true` and `PREVIEW_ONLY`; official source reference and approval date remain empty.
- **Curriculum:** a `CurriculumVersion` placeholder is created with `isPreview=true`, `UNCONFIGURED` status and no courses. `CurriculumCourse` provides a future course-to-approved-curriculum structure, but no course catalogue, Senate source or registration rows are loaded.
- **Enrollment:** `StudentEnrollment` uses `PREVIEW_PENDING` with `curriculumStatus=UNCONFIGURED`. No course registration or official fee/registration clearance is inferred. Phase 5 adds a separate synthetic finance ledger and settlement comparison; its derived clearance labels remain preview-only (see [`phase-5-finance-preview.md`](./phase-5-finance-preview.md)).
- **Audit:** offer acceptance changes the application status and writes an application event and an audit entry. The preview does not provision an account, role, mailbox, external identity or learning-management account.

## Routes

- `POST /api/applications/:id/accept-offer` — applicant-owned, idempotent, development-only acceptance/provisioning.
- `GET /api/admin/students` — restricted read-only list for `SUPER_ADMIN`, `REGISTRAR` and `ADMISSIONS`.
- `/admin/students` — restricted Registry preview showing student IDs, sessions, curriculum readiness and missing official sources.
- `/portal` — applicant view may display the user's own test student ID after acceptance.
- `/portals/student` — remains a restricted notice; it is not converted into a student service.

## Release gates

All offer-acceptance and student-provisioning writes return `503` in a production build. No environment flag alone opens them. A future SIS release needs:

1. Approved offer letter, applicant acceptance, withdrawal, deadline and deposit/clearance policy.
2. Registry-approved matriculation number format, uniqueness policy, cohort rules and assignment/reissue procedure.
3. Approved academic session calendar and effective dates.
4. Senate-approved programme curricula, course catalogue/versioning, credit/semester/level rules, prerequisites and enrollment process.
5. Formal mapping from applicant identity to student identity and SSO/IdP role lifecycle; no conversion of the preview Applicant role is performed here.
6. Authorised SIS/ERP/IdP interfaces, service accounts, idempotency contract, retries, reconciliation, monitoring and change control.
7. Institution-approved LMS integration and course-shell provisioning rules. No LMS request is made by this implementation.
8. Registrar/Academic Affairs approval, privacy/retention review, access-control review, managed PostgreSQL migration, backup/restore and security assessment.

## Verification

- `npm run test:students` creates a synthetic offered application and reviewer, verifies offer acceptance, uniqueness/idempotence, preview-only session/curriculum flags, student portal restriction and staff access, then removes the synthetic records.
- The student-number sequence intentionally advances during test runs, so a harmless gap may remain in future preview IDs.
- Continue to run `npm run lint`, `npm run build`, `npm run test:smoke`, `npm run test:fees`, `npm run test:applicants`, and `npm run test:finance`.
