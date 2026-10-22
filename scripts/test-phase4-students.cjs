require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const db = new PrismaClient();
const base = process.env.SMOKE_BASE_URL || "http://localhost:3001";
const stamp = Date.now();
const applicantEmail = `phase4-student-${stamp}@example.invalid`;
const applicantPhone = `+234800${String(stamp).slice(-7)}`;
const applicantPassword = crypto.randomBytes(24).toString("base64url");
const staffEmail = `phase4-registry-${stamp}@example.invalid`;
const staffPassword = crypto.randomBytes(24).toString("base64url");
const sessionCode = process.env.MIU_PREVIEW_APPLICATION_SESSION || "2026/27";
let applicantUserId;
let applicantId;
let staffUserId;
let staffCookie;
let applicationId;
let studentRecordId;
let programmeId;
let curriculumExisted = false;
let sessionExisted = false;

function assert(condition, message) { if (!condition) throw new Error(message); }
async function readJson(response) { return response.json().catch(()=>({})); }
async function login(email, password) {
  const csrfResponse = await fetch(`${base}/api/auth/csrf`);
  assert(csrfResponse.ok, "Could not fetch Auth.js CSRF token.");
  const { csrfToken } = await csrfResponse.json();
  const csrfCookie = (csrfResponse.headers.get("set-cookie") || "").split(";")[0];
  const form = new URLSearchParams({ csrfToken, email, password, callbackUrl: `${base}/portal`, json: "true" });
  const response = await fetch(`${base}/api/auth/callback/credentials`, { method:"POST", headers:{"content-type":"application/x-www-form-urlencoded",cookie:csrfCookie}, body:form, redirect:"manual" });
  const cookies = (response.headers.get("set-cookie") || "").split(",").map(item=>item.trim().split(";")[0]).filter(item=>item.startsWith("authjs.session-token=")||item.startsWith("__Secure-authjs.session-token="));
  assert(cookies.length > 0, `Sign-in did not create a session for ${email}.`);
  return cookies.join("; ");
}

async function main() {
  const health = await fetch(`${base}/api/health`);
  assert(health.ok, `Preview server is not ready at ${base}.`);
  const programme = await db.programme.findFirst({ where:{isActive:true}, select:{id:true} });
  assert(programme?.id, "No active programme exists for the synthetic test.");
  programmeId = programme.id;
  sessionExisted = Boolean(await db.academicSession.findUnique({ where:{code:sessionCode} }));
  curriculumExisted = Boolean(await db.curriculumVersion.findUnique({ where:{programmeId_academicSessionCode_version:{programmeId,academicSessionCode:sessionCode,version:1} } }));

  const user = await db.user.create({
    data: {
      email: applicantEmail, phone: applicantPhone, name: "Synthetic Phase Four Applicant", role: "APPLICANT", isActive: true,
      emailVerified: new Date(), phoneVerified: true, passwordHash: await bcrypt.hash(applicantPassword, 10), applicant: { create:{} },
    },
    include: { applicant:true },
  });
  applicantUserId = user.id; applicantId = user.applicant.id;
  const application = await db.application.create({
    data: {
      applicantId, programmeId, session:sessionCode, appNo:`MIU-APP-TEST-${stamp}`,
      status:"UNDER_REVIEW", entryMode:"UTME", documents:JSON.stringify({preview:true}),
    },
  });
  applicationId = application.id;
  const staff = await db.user.create({ data:{email:staffEmail,name:"Synthetic Registry Reviewer",role:"REGISTRAR",isActive:true,emailVerified:new Date(),passwordHash:await bcrypt.hash(staffPassword,10)} });
  staffUserId = staff.id;
  staffCookie = await login(staffEmail, staffPassword);
  const offerResponse = await fetch(`${base}/api/admin/applications/${applicationId}`, { method:"PATCH", headers:{"content-type":"application/json",cookie:staffCookie}, body:JSON.stringify({status:"OFFERED",note:"Synthetic preview decision"}) });
  const offerPayload = await readJson(offerResponse);
  assert(offerResponse.ok && offerPayload.data?.status==="OFFERED", `Admissions reviewer could not mark the test record offered: ${JSON.stringify(offerPayload)}`);
  const applicantCookie = await login(applicantEmail, applicantPassword);

  const accept = await fetch(`${base}/api/applications/${applicationId}/accept-offer`, { method:"POST", headers:{cookie:applicantCookie} });
  const acceptPayload = await readJson(accept);
  assert(accept.status===201 && /^MIU-TEST-STU-\d{4}-\d{6}$/.test(acceptPayload.data?.previewStudentId||""), `Preview offer acceptance failed: ${JSON.stringify(acceptPayload)}`);
  assert(acceptPayload.data.officialMatricNo===null && acceptPayload.data.curriculumStatus==="UNCONFIGURED" && acceptPayload.data.enrollmentStatus==="PREVIEW_PENDING", "Preview provision exposed official matriculation or configured curriculum/enrollment.");
  studentRecordId = acceptPayload.data.id;
  console.log("PASS applicant accepts preview offer and receives explicitly non-official student ID");

  const retry = await fetch(`${base}/api/applications/${applicationId}/accept-offer`, { method:"POST", headers:{cookie:applicantCookie} });
  const retryPayload = await readJson(retry);
  assert(retry.ok && retryPayload.resumed===true && retryPayload.data.previewStudentId===acceptPayload.data.previewStudentId, "Repeated acceptance was not idempotent.");
  const [savedApplication, savedUser, savedStudent, savedEnrollment, academicSession, curriculum] = await Promise.all([
    db.application.findUnique({where:{id:applicationId}}),
    db.user.findUnique({where:{id:applicantUserId}}),
    db.studentRecord.findUnique({where:{sourceApplicationId:applicationId}}),
    db.studentEnrollment.findMany({where:{studentRecordId:studentRecordId}}),
    db.academicSession.findUnique({where:{code:sessionCode}}),
    db.curriculumVersion.findUnique({where:{programmeId_academicSessionCode_version:{programmeId,academicSessionCode:sessionCode,version:1}}}),
  ]);
  assert(savedApplication.status==="OFFER_ACCEPTED" && savedUser.role==="APPLICANT", "Acceptance changed the status incorrectly or promoted the preview user to a live student role.");
  assert(savedStudent.officialMatricNo===null && savedStudent.previewStudentId===acceptPayload.data.previewStudentId && savedEnrollment.length===1, "Student record/enrollment was duplicated or an official matric number was assigned.");
  assert(academicSession.isPreview && academicSession.status==="PREVIEW_ONLY" && curriculum.isPreview && curriculum.status==="UNCONFIGURED", "Academic session or curriculum was not kept clearly preview-only/unconfigured.");
  console.log("PASS idempotent provisioning; unconfigured session/curriculum; no official matric number or duplicate enrollment");

  const studentPortal = await fetch(`${base}/portals/student`, { headers:{cookie:applicantCookie} });
  assert(studentPortal.ok && (await studentPortal.text()).includes("Student Portal — Restricted Access"), "Student Portal notice did not remain restricted.");
  const applicantDashboard = await fetch(`${base}/portal`, { headers:{cookie:applicantCookie} });
  assert(applicantDashboard.ok && (await applicantDashboard.text()).includes(acceptPayload.data.previewStudentId), "Applicant dashboard did not show its preview student ID.");

  const forbiddenList = await fetch(`${base}/api/admin/students`, { headers:{cookie:applicantCookie} });
  assert(forbiddenList.status===403, "Applicant could access Registry student records.");
  const staffApi = await fetch(`${base}/api/admin/students`, { headers:{cookie:staffCookie} });
  const staffPayload = await readJson(staffApi);
  assert(staffApi.ok && staffPayload.data?.some(item=>item.previewStudentId===acceptPayload.data.previewStudentId), "Authorised Registry reviewer could not see the preview record.");
  const staffPage = await fetch(`${base}/admin/students`, { headers:{cookie:staffCookie} });
  assert(staffPage.ok && (await staffPage.text()).includes("Student records preview"), "Restricted Registry preview page did not render.");
  console.log("PASS Registry-only view; applicant cannot access staff records; Student Portal remains restricted");
}

main()
  .catch(error=>{ console.error(error); process.exitCode=1; })
  .finally(async()=>{
    if (applicationId) {
      await db.applicationEvent.deleteMany({where:{applicationId}});
      await db.auditLog.deleteMany({where:{entityId:{in:[applicationId,studentRecordId].filter(Boolean)}}});
      await db.application.deleteMany({where:{id:applicationId}}); // Cascades preview student record and enrollment.
    }
    if (studentRecordId) await db.studentEnrollment.deleteMany({where:{studentRecordId}});
    if (studentRecordId) await db.studentRecord.deleteMany({where:{id:studentRecordId}});
    if (applicantId) await db.applicant.deleteMany({where:{id:applicantId}});
    if (applicantUserId || staffUserId) await db.auditLog.deleteMany({where:{userId:{in:[applicantUserId,staffUserId].filter(Boolean)}}});
    if (applicantUserId) await db.user.deleteMany({where:{id:applicantUserId}});
    if (staffUserId) await db.user.deleteMany({where:{id:staffUserId}});
    if (!curriculumExisted && programmeId) await db.curriculumVersion.deleteMany({where:{programmeId,academicSessionCode:sessionCode,version:1}});
    if (!sessionExisted) await db.academicSession.deleteMany({where:{code:sessionCode}});
    await db.$disconnect();
  });
