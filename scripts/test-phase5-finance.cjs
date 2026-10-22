require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const db = new PrismaClient();
const base = process.env.SMOKE_BASE_URL || "http://localhost:3001";
const stamp = Date.now();
const baseYear = 2500 + crypto.randomInt(0, 700);
const programmeIdRef = { value: null };
const userIds = [];
const applicantIds = [];
const applicationIds = [];
const studentRecordIds = [];
const enrollmentIds = [];
const feeScheduleIds = [];
const sessionCodes = [];
const batchReferences = [];
const applicantFixtures = [];
let staffUserId;
let staffCookie;

function assert(condition, message) { if (!condition) throw new Error(message); }
async function json(response) { return response.json().catch(() => ({})); }
async function login(email, password) {
  const csrfResponse = await fetch(`${base}/api/auth/csrf`);
  assert(csrfResponse.ok, "Could not fetch Auth.js CSRF token.");
  const { csrfToken } = await csrfResponse.json();
  const csrfCookie = (csrfResponse.headers.get("set-cookie") || "").split(";")[0];
  const form = new URLSearchParams({ csrfToken, email, password, callbackUrl: `${base}/portal`, json: "true" });
  const response = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: csrfCookie },
    body: form,
    redirect: "manual",
  });
  const cookies = (response.headers.get("set-cookie") || "")
    .split(",")
    .map(item => item.trim().split(";")[0])
    .filter(item => item.startsWith("authjs.session-token=") || item.startsWith("__Secure-authjs.session-token="));
  assert(cookies.length > 0, `Sign-in did not create a session for ${email}.`);
  return cookies.join("; ");
}

async function postJson(path, body, cookie) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(body),
      });
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function makeFixture(index, includeSchedule) {
  const year = baseYear + index;
  const sessionCode = `${year}/${String((year + 1) % 100).padStart(2, "0")}`;
  sessionCodes.push(sessionCode);
  const email = `phase5-finance-${stamp}-${index}@example.invalid`;
  const password = crypto.randomBytes(24).toString("base64url");
  const user = await db.user.create({
    data: {
      email,
      name: `Synthetic Finance Applicant ${index + 1}`,
      role: "APPLICANT",
      isActive: true,
      emailVerified: new Date(),
      phoneVerified: true,
      passwordHash: await bcrypt.hash(password, 10),
      applicant: { create: {} },
    },
    include: { applicant: true },
  });
  userIds.push(user.id);
  applicantIds.push(user.applicant.id);
  const application = await db.application.create({
    data: {
      applicantId: user.applicant.id,
      programmeId: programmeIdRef.value,
      session: sessionCode,
      appNo: `MIU-APP-PH5-${stamp}-${index}-${crypto.randomBytes(3).toString("hex")}`,
      status: "OFFER_ACCEPTED",
      entryMode: "UTME",
    },
  });
  applicationIds.push(application.id);
  const academicSession = await db.academicSession.create({ data: { code: sessionCode, name: `Synthetic finance test ${sessionCode}`, status: "PREVIEW_ONLY", isPreview: true } });
  const studentRecord = await db.studentRecord.create({
    data: {
      userId: user.id,
      sourceApplicationId: application.id,
      previewStudentId: `MIU-TEST-STU-${new Date().getUTCFullYear()}-${String(900000 + index).slice(-6)}`,
      status: "PREVIEW_PROVISIONED",
    },
  });
  studentRecordIds.push(studentRecord.id);
  const enrollment = await db.studentEnrollment.create({
    data: {
      studentRecordId: studentRecord.id,
      programmeId: programmeIdRef.value,
      academicSessionCode: academicSession.code,
      status: "PREVIEW_PENDING",
      curriculumStatus: "UNCONFIGURED",
    },
  });
  enrollmentIds.push(enrollment.id);

  let feeScheduleId;
  if (includeSchedule) {
    const now = new Date();
    const total = 260000 + index * 7000;
    const schedule = await db.feeSchedule.create({
      data: {
        programmeId: programmeIdRef.value,
        session: sessionCode,
        tuition: total - 60000,
        hostel: 50000,
        feeding: 10000,
        total,
        currency: "NGN",
        isPublished: true,
        publishedAt: now,
        bursarSignature: "Synthetic Test Bursar",
        bursarSignedAt: now,
        approvalStatus: "APPROVED",
        version: 1,
        effectiveFrom: new Date(now.getTime() - 60_000),
      },
    });
    feeScheduleId = schedule.id;
    feeScheduleIds.push(schedule.id);
  }
  const cookie = await login(email, password);
  const fixture = { email, password, cookie, applicationId: application.id, userId: user.id, sessionCode, feeScheduleId };
  applicantFixtures.push(fixture);
  return fixture;
}

async function main() {
  const health = await fetch(`${base}/api/health`);
  assert(health.ok, `Preview server is not ready at ${base}.`);
  const programme = await db.programme.findFirst({ where: { isActive: true }, select: { id: true } });
  assert(programme?.id, "No active programme exists for the finance preview test.");
  programmeIdRef.value = programme.id;

  const staffEmail = `phase5-bursar-${stamp}@example.invalid`;
  const staffPassword = crypto.randomBytes(24).toString("base64url");
  const staff = await db.user.create({
    data: { email: staffEmail, name: "Synthetic Test Bursar", role: "BURSAR", isActive: true, emailVerified: new Date(), passwordHash: await bcrypt.hash(staffPassword, 10) },
  });
  staffUserId = staff.id;
  staffCookie = await login(staffEmail, staffPassword);

  const first = await makeFixture(0, true);
  const second = await makeFixture(1, true);
  const missingSchedule = await makeFixture(2, false);

  const assessmentResponse = await postJson(`/api/applications/${first.applicationId}/preview-assessment`, {}, first.cookie);
  const assessmentPayload = await json(assessmentResponse);
  assert(assessmentResponse.status === 201, `Signed fee assessment failed: ${JSON.stringify(assessmentPayload)}`);
  const assessment = assessmentPayload.data;
  assert(assessment.amount === 260000 && assessment.currency === "NGN" && assessment.feeSchedule.signedBy === "Synthetic Test Bursar", "Assessment did not snapshot the exact signed schedule total.");
  assert(assessment.feeSchedule.tuition === 200000 && assessment.feeSchedule.hostel === 50000 && assessment.feeSchedule.feeding === 10000, "Assessment did not preserve the signed schedule component breakdown.");
  assert(assessment.ledger.charged === 260000 && assessment.ledger.paid === 0 && assessment.ledger.balance === 260000 && assessment.ledger.clearance === "PREVIEW_PENDING", "Initial debit ledger entry or derived balance is incorrect.");

  const repeatAssessment = await postJson(`/api/applications/${first.applicationId}/preview-assessment`, {}, first.cookie);
  const repeatAssessmentPayload = await json(repeatAssessment);
  assert(repeatAssessment.ok && repeatAssessmentPayload.resumed === true && repeatAssessmentPayload.data.id === assessment.id, "Assessment retry was not idempotent.");
  const chargeRows = await db.financeLedgerEntry.findMany({ where: { feeAssessmentId: assessment.id } });
  assert(chargeRows.length === 1 && chargeRows[0].direction === "DEBIT" && chargeRows[0].amount === assessment.amount, "A retry created duplicate fee charges.");
  console.log("PASS signed fee assessment snapshots exact Bursary schedule; charge ledger is idempotent");

  const noScheduleResponse = await postJson(`/api/applications/${missingSchedule.applicationId}/preview-assessment`, {}, missingSchedule.cookie);
  const noSchedulePayload = await json(noScheduleResponse);
  assert(noScheduleResponse.status === 409 && /no amount has been invented/i.test(noSchedulePayload.error || ""), "An unsigned/missing fee schedule did not block assessment creation.");
  const ownerGuard = await postJson(`/api/applications/${first.applicationId}/preview-assessment`, {}, second.cookie);
  assert(ownerGuard.status === 404, "A different applicant could inspect or create another applicant's assessment.");
  console.log("PASS no signed schedule means no assessment; applicant ownership is enforced");

  const accountPage = await fetch(`${base}/portal/applications/${first.applicationId}`, { headers: { cookie: first.cookie } });
  const accountHtml = await accountPage.text();
  assert(accountPage.ok && accountHtml.includes("Finance preview") && accountHtml.includes("260,000"), "Applicant finance preview panel did not render the signed assessment.");

  const idempotencyKey = `phase5-pay-${crypto.randomUUID()}`;
  const warmPaymentRoute = await postJson(`/api/applications/${first.applicationId}/preview-payment`, {}, first.cookie);
  assert(warmPaymentRoute.status === 400, "Preview payment route should reject a missing idempotency key before capture.");
  const concurrentCaptures = await Promise.all([
    postJson(`/api/applications/${first.applicationId}/preview-payment`, { idempotencyKey, amount: 1 }, first.cookie),
    postJson(`/api/applications/${first.applicationId}/preview-payment`, { idempotencyKey, amount: 1 }, first.cookie),
  ]);
  const concurrentPayloads = await Promise.all(concurrentCaptures.map(json));
  assert(concurrentCaptures.every(response => response.ok), `Concurrent synthetic payment retry failed: ${JSON.stringify(concurrentPayloads)}`);
  const capturePayload = concurrentPayloads.find(payload => payload.data?.ledger?.paid === assessment.amount) || concurrentPayloads[0];
  assert(concurrentCaptures.some(response => response.status === 201), "One concurrent request should create the synthetic payment.");
  const captured = capturePayload.data;
  assert(concurrentPayloads.every(payload => payload.data?.id === captured.id), "Concurrent duplicate provider events created different payment records.");
  assert(captured.previewOnly === true && captured.provider === "PREVIEW_SIMULATOR" && captured.status === "PREVIEW_CAPTURED", "Payment was not clearly marked synthetic.");
  assert(captured.amount === assessment.amount, "Client-supplied amount altered the assessment; capture must use the signed ledger balance.");
  assert(captured.ledger.balance === 0 && captured.ledger.clearance === "PREVIEW_CLEARED", "Clearance indicator was not derived from the balanced ledger.");
  assert(/^MIU-TEST-PAY-\d{4}-[A-F0-9]{12}$/.test(captured.providerReference) && /^MIU-TEST-REC-\d{4}-\d{6}$/.test(captured.receiptCode), "Synthetic provider reference or receipt code is malformed.");

  const retryCapture = await postJson(`/api/applications/${first.applicationId}/preview-payment`, { idempotencyKey, amount: 1 }, first.cookie);
  const retryCapturePayload = await json(retryCapture);
  assert(retryCapture.ok && retryCapturePayload.resumed === true && retryCapturePayload.data.id === captured.id, "Repeated payment event was not idempotent.");
  const differentKeyRetry = await postJson(`/api/applications/${first.applicationId}/preview-payment`, { idempotencyKey: `phase5-pay-${crypto.randomUUID()}` }, first.cookie);
  const differentKeyPayload = await json(differentKeyRetry);
  assert(differentKeyRetry.ok && differentKeyPayload.data.id === captured.id, "A second key caused a duplicate payment for a fully credited assessment.");
  const ledgerAfterPayment = await db.financeLedgerEntry.findMany({ where: { feeAssessmentId: assessment.id }, orderBy: { createdAt: "asc" } });
  assert(ledgerAfterPayment.length === 2 && ledgerAfterPayment[1].direction === "CREDIT" && ledgerAfterPayment[1].amount === assessment.amount, "Payment retry duplicated or changed the ledger credit.");
  console.log("PASS synthetic payment capture is idempotent; server ignores client amount; full payment balances ledger-derived preview clearance");

  const qrResponse = await fetch(`${base}${captured.qrImageUrl}`);
  assert(qrResponse.ok && (qrResponse.headers.get("content-type") || "").includes("image/png"), `QR receipt image failed (${qrResponse.status}).`);
  const qr = Buffer.from(await qrResponse.arrayBuffer());
  assert(qr.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "Receipt QR endpoint did not return a PNG image.");
  const verifyResponse = await fetch(`${base}${captured.receiptUrl}`);
  const verifyHtml = await verifyResponse.text();
  assert(verifyResponse.ok && verifyHtml.includes("Preview receipt record found") && verifyHtml.includes("does not prove that money was received"), "Public receipt verification did not clearly label the record synthetic.");
  assert(!verifyHtml.includes(first.email) && !verifyHtml.includes("MIU-TEST-STU-"), "Public QR verification exposed applicant identity or student ID.");
  console.log("PASS scannable PNG QR and public token verification disclose no applicant identity and clearly disclaim funds");

  const unauthorizedFinance = await fetch(`${base}/api/admin/finance`, { headers: { cookie: first.cookie } });
  assert(unauthorizedFinance.status === 403, "Applicant could access Bursary finance records.");
  const adminPage = await fetch(`${base}/admin/finance`, { headers: { cookie: staffCookie } });
  assert(adminPage.ok && (await adminPage.text()).includes("Finance ledger preview"), "Restricted Bursary finance workspace did not render.");
  const financeApi = await fetch(`${base}/api/admin/finance`, { headers: { cookie: staffCookie } });
  const financeData = await json(financeApi);
  assert(financeApi.ok && financeData.data?.some(item => item.id === assessment.id), "Bursary finance API did not show its preview assessment.");

  const matchedBatchReference = `MIU-TEST-BATCH-${stamp}-A`;
  batchReferences.push(matchedBatchReference);
  const batchBody = { providerBatchReference: matchedBatchReference, reportedAmount: captured.amount, providerReferences: [captured.providerReference] };
  const matchedResponse = await postJson("/api/admin/finance", batchBody, staffCookie);
  const matchedPayload = await json(matchedResponse);
  assert(matchedResponse.status === 201 && matchedPayload.data.status === "MATCHED", `Matching synthetic settlement did not reconcile: ${JSON.stringify(matchedPayload)}`);
  const repeatBatch = await postJson("/api/admin/finance", batchBody, staffCookie);
  const repeatBatchPayload = await json(repeatBatch);
  assert(repeatBatch.ok && repeatBatchPayload.resumed === true && repeatBatchPayload.data.id === matchedPayload.data.id, "Repeated batch import was not idempotent.");
  const changedBatch = await postJson("/api/admin/finance", { ...batchBody, reportedAmount: captured.amount + 1 }, staffCookie);
  assert(changedBatch.status === 409, "Changed contents under the same batch reference were not rejected.");
  console.log("PASS Bursar-only settlement match, immutable mismatch guard and idempotent repeated batch import");

  const secondAssessmentResponse = await postJson(`/api/applications/${second.applicationId}/preview-assessment`, {}, second.cookie);
  const secondAssessmentPayload = await json(secondAssessmentResponse);
  assert(secondAssessmentResponse.status === 201, `Second synthetic schedule assessment failed: ${JSON.stringify(secondAssessmentPayload)}`);
  const secondKey = `phase5-pay-${crypto.randomUUID()}`;
  const secondCaptureResponse = await postJson(`/api/applications/${second.applicationId}/preview-payment`, { idempotencyKey: secondKey }, second.cookie);
  const secondCapturePayload = await json(secondCaptureResponse);
  assert(secondCaptureResponse.status === 201, `Second synthetic payment failed: ${JSON.stringify(secondCapturePayload)}`);
  const varianceBatchReference = `MIU-TEST-BATCH-${stamp}-B`;
  batchReferences.push(varianceBatchReference);
  const varianceResponse = await postJson("/api/admin/finance", {
    providerBatchReference: varianceBatchReference,
    reportedAmount: secondCapturePayload.data.amount + 1,
    providerReferences: [secondCapturePayload.data.providerReference],
  }, staffCookie);
  const variancePayload = await json(varianceResponse);
  assert(varianceResponse.status === 201 && variancePayload.data.status === "VARIANCE", `Synthetic settlement variance was not recorded: ${JSON.stringify(variancePayload)}`);
  const secondLedger = await db.financeLedgerEntry.findMany({ where: { feeAssessmentId: secondAssessmentPayload.data.id } });
  assert(secondLedger.length === 2 && secondLedger.reduce((sum, item) => sum + (item.direction === "DEBIT" ? item.amount : -item.amount), 0) === 0, "Settlement variance changed the payment ledger or preview clearance.");
  console.log("PASS unmatched synthetic settlement variance is recorded separately without changing ledger-derived clearance");

  const applicantReconcile = await postJson("/api/admin/finance", {}, first.cookie);
  assert(applicantReconcile.status === 403, "Applicant could submit a synthetic settlement batch.");
}

main()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => {
    const discoveredAssessments = enrollmentIds.length
      ? await db.feeAssessment.findMany({ where: { enrollmentId: { in: enrollmentIds } }, select: { id: true } }).catch(() => [])
      : [];
    const assessmentIds = discoveredAssessments.map(item => item.id);
    if (assessmentIds.length) {
      await db.auditLog.deleteMany({ where: { entityId: { in: assessmentIds } } });
      await db.financeLedgerEntry.deleteMany({ where: { feeAssessmentId: { in: assessmentIds } } });
      await db.financePayment.deleteMany({ where: { feeAssessmentId: { in: assessmentIds } } });
    }
    if (batchReferences.length) {
      await db.auditLog.deleteMany({ where: { entity: "SettlementBatch", entityId: { in: batchReferences } } });
      await db.settlementBatch.deleteMany({ where: { providerBatchReference: { in: batchReferences } } });
    }
    if (assessmentIds.length) await db.feeAssessment.deleteMany({ where: { id: { in: assessmentIds } } });
    if (applicationIds.length) {
      await db.auditLog.deleteMany({ where: { entityId: { in: applicationIds } } });
      await db.applicationEvent.deleteMany({ where: { applicationId: { in: applicationIds } } });
      await db.application.deleteMany({ where: { id: { in: applicationIds } } });
    }
    if (applicantIds.length) await db.applicant.deleteMany({ where: { id: { in: applicantIds } } });
    if (userIds.length || staffUserId) {
      await db.auditLog.deleteMany({ where: { userId: { in: [...userIds, ...(staffUserId ? [staffUserId] : [])] } } });
      await db.user.deleteMany({ where: { id: { in: [...userIds, ...(staffUserId ? [staffUserId] : [])] } } });
    }
    if (feeScheduleIds.length) await db.feeSchedule.deleteMany({ where: { id: { in: feeScheduleIds } } });
    if (sessionCodes.length) await db.academicSession.deleteMany({ where: { code: { in: sessionCodes } } });
    await db.$disconnect();
  });
