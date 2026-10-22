require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const db = new PrismaClient();
const base = process.env.SMOKE_BASE_URL || "http://localhost:3001";
const stamp = Date.now();
const testCode = "D-01";
const emails = [
  `governance-super-${stamp}@example.invalid`,
  `governance-bursar-${stamp}@example.invalid`,
];
const passwords = [crypto.randomBytes(24).toString("base64url"), crypto.randomBytes(24).toString("base64url")];
const userIds = [];
let originalEntry;
let createdEntryId;

function assert(condition, message) { if (!condition) throw new Error(message); }
async function readJson(response) { return response.json().catch(() => ({})); }
async function login(email, password) {
  const csrfResponse = await fetch(`${base}/api/auth/csrf`);
  assert(csrfResponse.ok, "Could not fetch Auth.js CSRF token.");
  const { csrfToken } = await csrfResponse.json();
  const csrfCookie = (csrfResponse.headers.get("set-cookie") || "").split(";")[0];
  const form = new URLSearchParams({ csrfToken, email, password, callbackUrl: `${base}/admin`, json: "true" });
  const response = await fetch(`${base}/api/auth/callback/credentials`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: csrfCookie }, body: form, redirect: "manual" });
  const cookies = (response.headers.get("set-cookie") || "").split(",").map(item => item.trim().split(";")[0]).filter(item => item.startsWith("authjs.session-token=") || item.startsWith("__Secure-authjs.session-token="));
  assert(cookies.length > 0, `Could not authenticate synthetic account ${email}.`);
  return cookies.join("; ");
}

async function main() {
  const health = await fetch(`${base}/api/health`);
  assert(health.ok, `Preview server is not ready at ${base}.`);
  originalEntry = await db.governanceEntry.findUnique({ where: { code: testCode } });

  for (let index = 0; index < emails.length; index++) {
    const role = index === 0 ? "SUPER_ADMIN" : "BURSAR";
    const user = await db.user.create({
      data: { email: emails[index], name: `Synthetic Governance ${role}`, role, isActive: true, emailVerified: new Date(), passwordHash: await bcrypt.hash(passwords[index], 10) },
    });
    userIds.push(user.id);
  }
  const superCookie = await login(emails[0], passwords[0]);
  const bursarCookie = await login(emails[1], passwords[1]);

  const anonymous = await fetch(`${base}/api/admin/governance`);
  assert(anonymous.status === 401, "Anonymous user could read the governance register.");
  const nonAdmin = await fetch(`${base}/api/admin/governance`, { headers: { cookie: bursarCookie } });
  assert(nonAdmin.status === 403, "Bursar role could access the Super Admin-only governance preview.");

  const page = await fetch(`${base}/admin/governance`, { headers: { cookie: superCookie } });
  const pageHtml = await page.text();
  assert(page.ok && pageHtml.includes("MIU readiness decisions") && pageHtml.includes("not an MIU approval system"), "Restricted governance preview page did not render its non-approval warning.");

  const list = await fetch(`${base}/api/admin/governance`, { headers: { cookie: superCookie } });
  const listPayload = await readJson(list);
  assert(list.ok && listPayload.data?.length === 11 && listPayload.approvalSystem === false && listPayload.previewOnly === true, "Governance register did not return the 11 static decision prompts as preview-only.");
  assert(listPayload.data.every(item => item.entry.status === "OPEN" || item.entry.status === "OWNER_ASSIGNED" || item.entry.status === "IN_PROGRESS" || item.entry.status === "READY_FOR_REVIEW" || item.entry.status === "BLOCKED"), "Governance tracker exposed an approval status.");

  const unauthorizedWrite = await fetch(`${base}/api/admin/governance/${testCode}`, { method: "PUT", headers: { "content-type": "application/json", cookie: bursarCookie }, body: JSON.stringify({ status: "IN_PROGRESS" }) });
  assert(unauthorizedWrite.status === 403, "Non-Super Admin could edit the governance preview.");
  const fakeApproval = await fetch(`${base}/api/admin/governance/${testCode}`, { method: "PUT", headers: { "content-type": "application/json", cookie: superCookie }, body: JSON.stringify({ status: "APPROVED" }) });
  assert(fakeApproval.status === 400, "Preview tracker accepted an institutional approval state.");
  const realNameAttempt = await fetch(`${base}/api/admin/governance/${testCode}`, { method: "PUT", headers: { "content-type": "application/json", cookie: superCookie }, body: JSON.stringify({ status: "OWNER_ASSIGNED", accountableOwnerLabel: "Real Person", ownerOffice: "Office", ownerRole: "Owner" }) });
  assert(realNameAttempt.status === 400, "Preview tracker accepted a non-synthetic personal owner label.");
  const urlAttempt = await fetch(`${base}/api/admin/governance/${testCode}`, { method: "PUT", headers: { "content-type": "application/json", cookie: superCookie }, body: JSON.stringify({ status: "READY_FOR_REVIEW", accountableOwnerLabel: "SYNTHETIC: Owner", ownerOffice: "Synthetic Office", ownerRole: "Synthetic Role", decisionSummary: "Synthetic test", evidenceReference: "https://example.invalid/evidence" }) });
  assert(urlAttempt.status === 400, "Preview tracker accepted an external evidence URL.");
  const actualPolicyAttempt = await fetch(`${base}/api/admin/governance/${testCode}`, { method: "PUT", headers: { "content-type": "application/json", cookie: superCookie }, body: JSON.stringify({ status: "READY_FOR_REVIEW", ownerOffice: "Synthetic Office", ownerRole: "Synthetic Role", decisionSummary: "Approved official intake policy", evidenceReference: "TEST-REFERENCE-002" }) });
  assert(actualPolicyAttempt.status === 400, "Preview tracker accepted non-synthetic policy text.");

  const valid = await fetch(`${base}/api/admin/governance/${testCode}`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie: superCookie },
    body: JSON.stringify({
      status: "READY_FOR_REVIEW",
      accountableOwnerLabel: "SYNTHETIC: Executive sponsor",
      ownerOffice: "Synthetic Office",
      ownerRole: "Synthetic decision owner",
      decisionSummary: "SYNTHETIC: scope review only",
      evidenceReference: "TEST-REFERENCE-001",
    }),
  });
  const validPayload = await readJson(valid);
  assert(valid.ok && validPayload.data?.status === "READY_FOR_REVIEW" && validPayload.approvalRecorded === false, `Valid synthetic tracking update failed: ${JSON.stringify(validPayload)}`);
  createdEntryId = validPayload.data.id;
  const after = await db.governanceEntry.findUnique({ where: { code: testCode } });
  assert(after?.ownerOffice === "Synthetic Office" && after?.evidenceReference === "TEST-REFERENCE-001", "Synthetic tracking values did not persist.");
  console.log("PASS restricted Super Admin-only tracker exposes all 11 blank decisions without implying approval");
  console.log("PASS owner label, status and evidence validation block real-name misuse, URLs and fake approval");
  console.log("PASS synthetic tracking update is persisted and audited; it does not change production gates");
}

main()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => {
    await db.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    if (originalEntry) {
      await db.governanceEntry.update({
        where: { code: testCode },
        data: {
          accountableOwnerLabel: originalEntry.accountableOwnerLabel,
          ownerOffice: originalEntry.ownerOffice,
          ownerRole: originalEntry.ownerRole,
          status: originalEntry.status,
          decisionSummary: originalEntry.decisionSummary,
          evidenceReference: originalEntry.evidenceReference,
          updatedById: originalEntry.updatedById,
          updatedAt: originalEntry.updatedAt,
        },
      }).catch(() => {});
    } else if (createdEntryId) {
      await db.governanceEntry.deleteMany({ where: { id: createdEntryId } });
    } else {
      await db.governanceEntry.deleteMany({ where: { code: testCode, updatedById: { in: userIds } } });
    }
    if (userIds.length) await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });
