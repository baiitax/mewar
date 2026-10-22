require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const db = new PrismaClient();
let tempUserId;
let tempFeeId;

async function main() {
  const base = "http://localhost:3001";
  const email = `phase2-test-${Date.now()}@example.invalid`;
  const password = crypto.randomBytes(24).toString("base64url");
  const user = await db.user.create({
    data: {
      email,
      role: "BURSAR",
      passwordHash: await bcrypt.hash(password, 10),
      name: "Temporary Test Signatory",
    },
  });
  tempUserId = user.id;
  const programme = await db.programme.findFirst();

  const csrfResponse = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfResponse.json();
  const csrfCookie = (csrfResponse.headers.get("set-cookie") || "").split(";")[0];
  const form = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${base}/admin`,
    json: "true",
  });
  const loginResponse = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: csrfCookie },
    body: form,
    redirect: "manual",
  });
  const cookies = (loginResponse.headers.get("set-cookie") || "")
    .split(",")
    .map((item) => item.trim().split(";")[0])
    .filter((item) => item.startsWith("authjs.session-token=") || item.startsWith("__Secure-authjs.session-token="));
  if (!cookies.length) throw new Error("Temporary Bursar sign-in did not issue a session cookie.");
  const cookie = cookies.join("; ");

  const draftResponse = await fetch(`${base}/api/fees`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      programmeId: programme.id,
      session: "2098/99",
      tuition: 123456,
      hostel: 1000,
      feeding: 2000,
      effectiveFrom: "2098-01-01",
    }),
  });
  const draft = await draftResponse.json();
  if (!draftResponse.ok) throw new Error(`Draft failed (${draftResponse.status}): ${JSON.stringify(draft)}`);
  tempFeeId = draft.data.id;

  const publishResponse = await fetch(`${base}/api/fees/${tempFeeId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ signature: "Temporary Test Bursar", confirm: true }),
  });
  if (!publishResponse.ok) throw new Error(`Publish failed (${publishResponse.status}): ${await publishResponse.text()}`);
  const published = await fetch(`${base}/api/fees?session=2098%2F99`).then((response) => response.json());
  if (published.data.length !== 1 || published.data[0].signedBy !== "Temporary Test Bursar") {
    throw new Error("Signed schedule was not returned by public API.");
  }
  console.log("PASS Bursar-only fee draft → sign → publish; public API shows signed record.");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => {
    if (tempFeeId) {
      await db.auditLog.deleteMany({ where: { entityId: tempFeeId } });
      await db.feeSchedule.deleteMany({ where: { id: tempFeeId } });
    }
    if (tempUserId) {
      await db.auditLog.deleteMany({ where: { userId: tempUserId } });
      await db.user.deleteMany({ where: { id: tempUserId } });
    }
    await db.$disconnect();
  });
