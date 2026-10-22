import { prisma } from "@/app/lib/db";
import { getApplicantIdentity } from "@/app/lib/applicant-session";
import {
  ENTRY_MODES, decryptApplicantIdentifier, encryptApplicantIdentifier,
  hashJambRegNo, intakeIsEnabled, isPreviewMode, submissionGate, text,
} from "@/app/lib/applicant-portal";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const applicant = await getApplicantIdentity();
  if (!applicant) return Response.json({ error: "Applicant sign-in required." }, { status: 401 });
  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, applicantId: applicant.id },
    include: {
      programme: { select: { id: true, title: true, slug: true, school: true } },
      applicant: { include: { user: { select: { name: true, email: true, phone: true } } } },
      events: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, fromStatus: true, toStatus: true, applicantMessage: true, createdAt: true } },
      studentRecord: { include: { enrollments: true } },
    },
  });
  if (!application) return Response.json({ error: "Application not found." }, { status: 404 });
  return Response.json({ data: {
    id: application.id, appNo: application.appNo, session: application.session, status: application.status,
    entryMode: application.entryMode, programme: application.programme, submittedAt: application.submittedAt,
    updatedAt: application.updatedAt, fullName: application.applicant.user.name,
    email: application.applicant.user.email, phone: application.applicant.user.phone,
    dateOfBirth: application.applicant.dateOfBirth?.toISOString().slice(0, 10) || "",
    gender: application.applicant.gender || "", stateOfOrigin: application.applicant.stateOfOrigin || "",
    nationality: application.applicant.nationality || "Nigeria",
    jambRegNo: decryptApplicantIdentifier(application.applicant.jambRegNoEncrypted) || "",
    jambRegNoLast4: application.applicant.jambRegNoLast4 || "",
    jambScore: application.jambScore ?? "", olevel: safeOlevel(application.olevel),
    events: application.events.map(event => ({ id: event.id, fromStatus: event.fromStatus, toStatus: event.toStatus, applicantMessage: event.applicantMessage, createdAt: event.createdAt.toISOString() })),
    studentRecord: application.studentRecord ? {
      previewStudentId: application.studentRecord.previewStudentId,
      officialMatricNo: application.studentRecord.officialMatricNo,
      status: application.studentRecord.status,
      enrollments: application.studentRecord.enrollments.map(enrollment => ({ session: enrollment.academicSessionCode, status: enrollment.status, curriculumStatus: enrollment.curriculumStatus })),
    } : null,
  } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Applicant write endpoints are disabled in this preview build; production release approval and integrations are required." }, { status: 503 });
  const applicant = await getApplicantIdentity();
  if (!applicant) return Response.json({ error: "Applicant sign-in required." }, { status: 401 });
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const action = body?.action === "submit" ? "submit" : body?.action === "save" ? "save" : null;
  if (!action) return Response.json({ error: "Choose Save draft or Submit preview." }, { status: 400 });

  const application = await prisma.application.findFirst({ where: { id, applicantId: applicant.id }, include: { programme: true } });
  if (!application) return Response.json({ error: "Application not found." }, { status: 404 });
  if (!["DRAFT", "NEEDS_INFORMATION"].includes(application.status)) return Response.json({ error: "This application can no longer be edited." }, { status: 409 });
  const programmeId = typeof body.programmeId === "string" && body.programmeId ? body.programmeId : application.programmeId;
  const programme = await prisma.programme.findUnique({ where: { id: programmeId }, select: { id: true, title: true, isActive: true, isAcceptingApplications: true } });
  if (!programme || !intakeIsEnabled(programme)) return Response.json({ error: "The selected programme is not available for this intake." }, { status: 403 });
  if (application.programmeId !== programmeId) {
    const duplicate = await prisma.application.findUnique({ where: { applicantId_programmeId_session: { applicantId: applicant.id, programmeId, session: application.session } } });
    if (duplicate && duplicate.id !== application.id) return Response.json({ error: "You already have an application for that programme and session." }, { status: 409 });
  }

  const entryMode = body.entryMode === undefined ? application.entryMode : body.entryMode;
  if (!ENTRY_MODES.includes(entryMode)) return Response.json({ error: "Select a valid entry route." }, { status: 400 });
  const fullName = text(body.fullName, 100);
  if (!fullName || fullName.length < 2) return Response.json({ error: "Enter your full name." }, { status: 400 });
  const dobInput = body.dateOfBirth;
  const dateOfBirth = typeof dobInput === "string" && dobInput.trim() ? new Date(`${dobInput}T00:00:00.000Z`) : null;
  if (dateOfBirth && (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dobInput) || Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.toISOString().slice(0, 10) !== dobInput || dateOfBirth > new Date())) return Response.json({ error: "Enter a valid date of birth." }, { status: 400 });
  const genderInput = body.gender === "" || body.gender === null ? null : body.gender;
  if (genderInput !== null && !["Female", "Male", "Non-binary", "Prefer not to say"].includes(genderInput)) return Response.json({ error: "Select a valid gender option or leave it blank." }, { status: 400 });
  const stateOfOrigin = body.stateOfOrigin === "" || body.stateOfOrigin === null ? null : text(body.stateOfOrigin, 60);
  if (body.stateOfOrigin && !stateOfOrigin) return Response.json({ error: "State of origin is too long." }, { status: 400 });
  const nationality = body.nationality === "" || body.nationality === null ? "Nigeria" : text(body.nationality, 60);
  if (!nationality) return Response.json({ error: "Enter a valid nationality." }, { status: 400 });
  const jambRaw = typeof body.jambRegNo === "string" ? body.jambRegNo.trim().toUpperCase().replace(/[\s-]/g, "") : "";
  if (jambRaw && !/^[A-Z0-9/]{6,24}$/.test(jambRaw)) return Response.json({ error: "JAMB registration number must be 6–24 letters or numbers." }, { status: 400 });
  const jambRegNoHash = jambRaw ? hashJambRegNo(jambRaw) : null;
  if (jambRegNoHash) {
    const duplicateJamb = await prisma.applicant.findFirst({ where: { jambRegNoHash, id: { not: applicant.id } }, select: { id: true } });
    if (duplicateJamb) return Response.json({ error: "That JAMB registration number is already associated with another applicant. Contact Admissions for a duplicate-record review." }, { status: 409 });
  }
  let jambScore: number | null = null;
  if (body.jambScore !== "" && body.jambScore !== null && body.jambScore !== undefined) {
    jambScore = Number(body.jambScore);
    if (!Number.isInteger(jambScore) || jambScore < 0 || jambScore > 400) return Response.json({ error: "Enter a JAMB score from 0 to 400." }, { status: 400 });
  }
  const submittedOlevel = body.olevel;
  if (!Array.isArray(submittedOlevel) || submittedOlevel.length > 10) return Response.json({ error: "Enter no more than 10 O’level subjects." }, { status: 400 });
  const olevel: { subject: string; grade: string }[] = [];
  for (const row of submittedOlevel) {
    if (!row || typeof row !== "object") return Response.json({ error: "O’level subjects must contain a subject and grade." }, { status: 400 });
    const subject = text(row.subject, 80);
    const grade = text(row.grade, 12);
    if (subject || grade) {
      if (!subject || !grade) return Response.json({ error: "Complete both subject and grade for each O’level row." }, { status: 400 });
      olevel.push({ subject, grade });
    }
  }
  const duplicateSubjects = new Set(olevel.map(row => row.subject.toLowerCase()));
  if (duplicateSubjects.size !== olevel.length) return Response.json({ error: "Each O’level subject should appear only once." }, { status: 400 });

  if (action === "submit") {
    if (!dateOfBirth || !stateOfOrigin || !olevel.length) return Response.json({ error: "For this synthetic preview, enter date of birth, state of origin, and at least one O’level subject. These checks are not an eligibility decision." }, { status: 400 });
    if (entryMode !== "INTERNATIONAL" && !jambRaw && body.jambRegNo !== undefined) return Response.json({ error: "Enter your JAMB registration number." }, { status: 400 });
    if (entryMode !== "INTERNATIONAL" && !jambRaw && body.jambRegNo === undefined) {
      const existingIdentifier = await prisma.applicant.findUnique({ where: { id: applicant.id }, select: { jambRegNoHash: true } });
      if (!existingIdentifier?.jambRegNoHash) return Response.json({ error: "Enter your JAMB registration number." }, { status: 400 });
    }
    if (entryMode === "UTME" && jambScore === null) return Response.json({ error: "Enter your JAMB score for the UTME preview." }, { status: 400 });
    const gate = submissionGate();
    if (!gate.allowed) return Response.json({ error: "Application submission is disabled until production integrations and approvals are complete.", missing: gate.missing }, { status: 503 });
  }

  const now = new Date();
  try {
    const updated = await prisma.$transaction(async tx => {
      const profile = await tx.applicant.update({
        where: { id: applicant.id },
        data: {
          dateOfBirth, gender: genderInput, stateOfOrigin, nationality,
          ...(body.jambRegNo !== undefined ? {
            jambRegNoEncrypted: jambRaw ? encryptApplicantIdentifier(jambRaw) : null,
            jambRegNoHash,
            jambRegNoLast4: jambRaw ? jambRaw.slice(-4) : null,
          } : {}),
        },
      });
      const newStatus = action === "submit" ? "SUBMITTED" : application.status;
      const updatedApplication = await tx.application.update({
        where: { id: application.id },
        data: {
          programmeId, entryMode, jambScore, olevel: JSON.stringify(olevel),
          status: newStatus,
          ...(action === "submit" ? { submittedAt: now } : {}),
          // Preview-only bookkeeping; no file bytes or upload references are stored.
          documents: JSON.stringify({ preview: isPreviewMode(), checklistVersion: "unconfigured", filesStored: false }),
        },
        select: { id: true, appNo: true, status: true, session: true, submittedAt: true },
      });
      if (action === "submit") {
        await tx.applicationEvent.create({ data: { applicationId: application.id, fromStatus: application.status, toStatus: "SUBMITTED", changedById: applicant.userId, note: isPreviewMode() ? "Applicant submitted the preview application." : "Applicant submitted the application." } });
        await tx.auditLog.create({ data: { userId: applicant.userId, action: "applicant.application.submit", entity: "Application", entityId: application.id, before: JSON.stringify({ status: application.status }), after: JSON.stringify({ status: "SUBMITTED", preview: isPreviewMode() }) } });
      }
      await tx.user.update({ where: { id: applicant.userId }, data: { name: fullName } });
      return { ...updatedApplication, applicantId: profile.id };
    });
    return Response.json({ data: updated, message: action === "submit" ? "Preview application submitted. No admission decision is implied." : "Draft saved." });
  } catch (error: any) {
    if (error?.code === "P2002") return Response.json({ error: "A duplicate application or JAMB identifier was detected. Contact Admissions for a record review." }, { status: 409 });
    throw error;
  }
}

function safeOlevel(value: string | null): { subject: string; grade: string }[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(row => row && typeof row.subject === "string" && typeof row.grade === "string") : [];
  } catch { return []; }
}
