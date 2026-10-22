require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const db = new PrismaClient();
const base = process.env.SMOKE_BASE_URL || "http://localhost:3001";
const stamp = Date.now();
const applicantEmail = `phase3-${stamp}@example.invalid`;
const applicantPhone = "08000000000";
const applicantPassword = crypto.randomBytes(24).toString("base64url");
const staffEmail = `phase3-review-${stamp}@example.invalid`;
const staffPassword = crypto.randomBytes(24).toString("base64url");
const otpKeys = [];
let applicantUserId;
let applicantId;
let staffUserId;
let applicationId;

function assert(condition, message) { if (!condition) throw new Error(message); }
async function json(response) { const body = await response.json().catch(()=>({})); return body; }
async function postJson(path, body, cookie) {
  return fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(cookie?{cookie}:{}) }, body: JSON.stringify(body) });
}
async function login(email, password) {
  const csrfResponse = await fetch(`${base}/api/auth/csrf`);
  assert(csrfResponse.ok, "Could not fetch Auth.js CSRF token.");
  const { csrfToken } = await csrfResponse.json();
  const csrfCookie = (csrfResponse.headers.get("set-cookie") || "").split(";")[0];
  const form = new URLSearchParams({ csrfToken, email, password, callbackUrl: `${base}/portal`, json: "true" });
  const response = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: csrfCookie }, body: form, redirect: "manual",
  });
  const cookies = (response.headers.get("set-cookie") || "").split(",").map(item=>item.trim().split(";")[0]).filter(item=>item.startsWith("authjs.session-token=")||item.startsWith("__Secure-authjs.session-token="));
  assert(cookies.length > 0, `Sign-in did not create a session for ${email}. Response ${response.status}.`);
  return cookies.join("; ");
}
function keyFor(channel, identifier) {
  return crypto.createHmac("sha256", process.env.AUTH_SECRET).update(`registration:${channel}:${identifier}`).digest("hex");
}

async function main() {
  const health = await fetch(`${base}/api/health`);
  assert(health.ok, `Preview server is not ready at ${base}.`);
  console.log("PASS preview API ready");

  // Development OTP is deliberately simulated; the response includes the test code only in NODE_ENV=development.
  const emailKey = keyFor("email", applicantEmail);
  const phoneKey = keyFor("phone", "+2348000000000");
  otpKeys.push(emailKey, phoneKey);
  const emailSend = await postJson("/api/applicant/otp/send", { channel: "email", identifier: applicantEmail });
  const emailCodePayload = await json(emailSend);
  assert(emailSend.ok && /^\d{6}$/.test(emailCodePayload.previewCode || ""), "Development email OTP was not created.");
  const phoneSend = await postJson("/api/applicant/otp/send", { channel: "phone", identifier: applicantPhone });
  const phoneCodePayload = await json(phoneSend);
  assert(phoneSend.ok && /^\d{6}$/.test(phoneCodePayload.previewCode || ""), "Development phone OTP was not created.");
  const [emailChallenge, phoneChallenge] = await Promise.all([db.otpChallenge.findUnique({where:{key:emailKey}}),db.otpChallenge.findUnique({where:{key:phoneKey}})]);
  assert(emailChallenge && emailChallenge.codeHash !== emailCodePayload.previewCode && emailChallenge.codeHash.length === 64, "OTP was not stored as a keyed digest.");
  const emailVerify = await postJson("/api/applicant/otp/verify", { channel: "email", identifier: applicantEmail, code: emailCodePayload.previewCode });
  const phoneVerify = await postJson("/api/applicant/otp/verify", { channel: "phone", identifier: applicantPhone, code: phoneCodePayload.previewCode });
  assert(emailVerify.ok && phoneVerify.ok, "Verified email/phone codes were rejected.");
  console.log("PASS development email and phone OTP verification (hashed, short-lived, one-use)");

  const register = await postJson("/api/applicant/register", { name: "Synthetic Phase Three Applicant", email: applicantEmail, phone: applicantPhone, password: applicantPassword });
  const registerPayload = await json(register);
  assert(register.status === 201 && registerPayload.registered, `Applicant registration failed: ${JSON.stringify(registerPayload)}`);
  const applicantUser = await db.user.findUnique({ where: { email: applicantEmail }, include: { applicant: true } });
  assert(applicantUser && applicantUser.role === "APPLICANT" && applicantUser.emailVerified && applicantUser.phoneVerified && applicantUser.applicant, "Applicant identity did not retain verified status/profile.");
  applicantUserId = applicantUser.id;
  applicantId = applicantUser.applicant.id;
  const duplicate = await postJson("/api/applicant/register", { name: "Synthetic Phase Three Applicant", email: applicantEmail, phone: applicantPhone, password: applicantPassword });
  assert(duplicate.status === 409, "Duplicate applicant registration was not rejected.");
  console.log("PASS applicant registration, verified identity and email/phone deduplication");

  const applicantCookie = await login(applicantEmail, applicantPassword);
  const applicantDashboard = await fetch(`${base}/portal`, { headers: { cookie: applicantCookie } });
  assert(applicantDashboard.ok && (await applicantDashboard.text()).includes("Applicant Portal"), "Authenticated applicant dashboard did not render.");
  const programme = await db.programme.findFirst({ where: { isActive: true }, select: { id: true } });
  assert(programme?.id, "No catalogue programme was available for the preview.");
  const create = await postJson("/api/applications", { programmeId: programme.id }, applicantCookie);
  const draft = await json(create);
  assert(create.status === 201 && /^MIU-APP-\d{4}-\d{6}-[A-F0-9]{4}$/.test(draft.appNo || ""), `Application draft/reference failed: ${JSON.stringify(draft)}`);
  applicationId = draft.id;
  const editorPage = await fetch(`${base}/portal/applications/${applicationId}`, { headers: { cookie: applicantCookie } });
  assert(editorPage.ok && (await editorPage.text()).includes("Personal details"), "Authenticated application editor did not render.");
  const duplicateApplication = await postJson("/api/applications", { programmeId: programme.id }, applicantCookie);
  const duplicateApplicationPayload = await json(duplicateApplication);
  assert(duplicateApplication.status === 200 && duplicateApplicationPayload.id === applicationId && duplicateApplicationPayload.resume, "Second programme/session draft did not resume the existing application.");
  console.log("PASS numbered draft creation, duplicate prevention and resume");

  const testJamb = `2026TEST${String(stamp).slice(-4)}`;
  const draftPayload = {
    action: "save", fullName: "Synthetic Phase Three Applicant", programmeId: programme.id,
    entryMode: "UTME", dateOfBirth: "2003-04-12", gender: "", stateOfOrigin: "FCT", nationality: "Nigeria",
    jambRegNo: testJamb, jambScore: "178", olevel: [{ subject: "English Language", grade: "B2" }],
  };
  const saveResponse = await fetch(`${base}/api/applications/${applicationId}`, { method: "PATCH", headers: { "content-type": "application/json", cookie: applicantCookie }, body: JSON.stringify(draftPayload) });
  const savePayload = await json(saveResponse);
  assert(saveResponse.ok, `Draft save failed: ${JSON.stringify(savePayload)}`);
  const encryptedApplicant = await db.applicant.findUnique({ where: { id: applicantId } });
  assert(encryptedApplicant.jambRegNoEncrypted?.startsWith("v1:") && encryptedApplicant.jambRegNoHash && !encryptedApplicant.jambRegNoEncrypted.includes(testJamb), "JAMB registration value was not encrypted and separately deduplicated.");
  console.log("PASS saved applicant profile, O’level data and encrypted JAMB identifier");

  const pdfForm = new FormData();
  pdfForm.append("file", new Blob(["%PDF-1.7\nsynthetic preview file"], { type: "application/pdf" }), "synthetic.pdf");
  pdfForm.append("category", "OLE_LEVEL_RESULT");
  const fileCheck = await fetch(`${base}/api/applications/${applicationId}/documents/validate`, { method: "POST", headers: { cookie: applicantCookie }, body: pdfForm });
  const filePayload = await json(fileCheck);
  assert(fileCheck.ok && filePayload.validFormat && filePayload.stored === false && filePayload.malwareScan === "NOT_AVAILABLE", `Document preview validation failed: ${JSON.stringify(filePayload)}`);
  const fakeForm = new FormData();
  fakeForm.append("file", new Blob(["not a PDF"], { type: "application/pdf" }), "fake.pdf"); fakeForm.append("category", "JAMB_RESULT");
  const fakeCheck = await fetch(`${base}/api/applications/${applicationId}/documents/validate`, { method: "POST", headers: { cookie: applicantCookie }, body: fakeForm });
  assert(fakeCheck.status === 415, "A fake PDF without the expected signature was not rejected.");
  console.log("PASS document type/signature checks; file bytes discarded, no storage or malware scan");

  const submitResponse = await fetch(`${base}/api/applications/${applicationId}`, { method: "PATCH", headers: { "content-type": "application/json", cookie: applicantCookie }, body: JSON.stringify({ ...draftPayload, action: "submit" }) });
  const submitPayload = await json(submitResponse);
  assert(submitResponse.ok && submitPayload.data?.status === "SUBMITTED", `Preview submission failed: ${JSON.stringify(submitPayload)}`);
  const applicantCannotReview = await fetch(`${base}/api/admin/applications`, { headers: { cookie: applicantCookie } });
  assert(applicantCannotReview.status === 403, "Applicant could access staff application review.");

  const staff = await db.user.create({ data: { email: staffEmail, name: "Synthetic Admissions Reviewer", role: "ADMISSIONS", isActive: true, emailVerified: new Date(), passwordHash: await bcrypt.hash(staffPassword, 10) } });
  staffUserId = staff.id;
  const staffCookie = await login(staffEmail, staffPassword);
  const staffPage = await fetch(`${base}/admin/applications`, { headers: { cookie: staffCookie } });
  assert(staffPage.ok && (await staffPage.text()).includes("Application review"), "Authenticated Admissions review page did not render.");
  const reviewList = await fetch(`${base}/api/admin/applications`, { headers: { cookie: staffCookie } });
  assert(reviewList.ok, "Authorised Admissions reviewer could not read the application queue.");
  const statusResponse = await fetch(`${base}/api/admin/applications/${applicationId}`, { method: "PATCH", headers: { "content-type": "application/json", cookie: staffCookie }, body: JSON.stringify({ status: "NEEDS_INFORMATION", note: "Internal preview note", applicantMessage: "Please review this synthetic test record." }) });
  const statusPayload = await json(statusResponse);
  assert(statusResponse.ok && statusPayload.data?.status === "NEEDS_INFORMATION", `Staff status transition failed: ${JSON.stringify(statusPayload)}`);
  const applicantRecord = await fetch(`${base}/api/applications/${applicationId}`, { headers: { cookie: applicantCookie } }).then(json);
  assert(applicantRecord.data?.status === "NEEDS_INFORMATION" && applicantRecord.data.events.some(event=>event.applicantMessage === "Please review this synthetic test record."), "Applicant status/message history was not visible to the owner.");
  assert(!JSON.stringify(applicantRecord).includes("Internal preview note"), "Staff-only note leaked to the applicant response.");
  console.log("PASS applicant status dashboard, staff RBAC and applicant-visible message/private internal note separation");
}

main()
  .catch(error=>{ console.error(error); process.exitCode = 1; })
  .finally(async()=>{
    if (applicationId) {
      await db.applicationEvent.deleteMany({ where: { applicationId } });
      await db.auditLog.deleteMany({ where: { entityId: applicationId } });
      await db.application.deleteMany({ where: { id: applicationId } });
    }
    if (applicantId) await db.applicant.deleteMany({ where: { id: applicantId } });
    if (applicantUserId || staffUserId) await db.auditLog.deleteMany({ where: { userId: { in: [applicantUserId, staffUserId].filter(Boolean) } } });
    if (applicantUserId) await db.user.deleteMany({ where: { id: applicantUserId } });
    if (staffUserId) await db.user.deleteMany({ where: { id: staffUserId } });
    if (otpKeys.length) await db.otpChallenge.deleteMany({ where: { key: { in: otpKeys } } });
    await db.$disconnect();
  });
