import { prisma } from "@/app/lib/db";
import { getApplicantIdentity } from "@/app/lib/applicant-session";
import { makePreviewStudentId } from "@/app/lib/applicant-portal";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Offer acceptance and student provisioning are disabled in this preview build pending Registry/ICT release approval." }, { status: 503 });
  const applicant = await getApplicantIdentity();
  if (!applicant) return Response.json({ error: "Applicant sign-in required." }, { status: 401 });
  const { id } = await params;

  const previous = await prisma.studentRecord.findUnique({
    where: { sourceApplicationId: id },
    include: { sourceApplication: { select: { status: true, applicantId: true } }, enrollments: true },
  });
  if (previous) {
    if (previous.sourceApplication.applicantId !== applicant.id) return Response.json({ error: "Application not found." }, { status: 404 });
    if (previous.sourceApplication.status !== "OFFER_ACCEPTED") return Response.json({ error: "Student record and application status require a restricted reconciliation." }, { status: 409 });
    return Response.json({ data: previewData(previous), resumed: true, message: "The preview student record was already provisioned; no second record was created." });
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const application = await tx.application.findFirst({
        where: { id, applicantId: applicant.id },
        include: { programme: { select: { id: true, title: true } } },
      });
      if (!application) throw new Error("APPLICATION_NOT_FOUND");
      if (application.status !== "OFFERED") throw new Error("OFFER_NOT_AVAILABLE");
      const existingStudent = await tx.studentRecord.findUnique({ where: { userId: applicant.userId }, select: { id: true, previewStudentId: true } });
      if (existingStudent) throw new Error("STUDENT_ALREADY_PROVISIONED");

      const oldSession = await tx.academicSession.findUnique({ where: { code: application.session } });
      if (oldSession && !oldSession.isPreview) throw new Error("OFFICIAL_SESSION_CANNOT_BE_USED_IN_PREVIEW");
      const academicSession = await tx.academicSession.upsert({
        where: { code: application.session },
        update: {},
        create: { code: application.session, name: `Development preview ${application.session}`, status: "PREVIEW_ONLY", isPreview: true },
      });
      const oldCurriculum = await tx.curriculumVersion.findUnique({ where: { programmeId_academicSessionCode_version: { programmeId: application.programmeId, academicSessionCode: application.session, version: 1 } } });
      if (oldCurriculum && !oldCurriculum.isPreview) throw new Error("OFFICIAL_CURRICULUM_CANNOT_BE_USED_IN_PREVIEW");
      const curriculum = await tx.curriculumVersion.upsert({
        where: { programmeId_academicSessionCode_version: { programmeId: application.programmeId, academicSessionCode: application.session, version: 1 } },
        update: {},
        create: { programmeId: application.programmeId, academicSessionCode: application.session, version: 1, status: "UNCONFIGURED", isPreview: true },
      });

      const year = new Date().getUTCFullYear();
      const sequence = await tx.studentSequence.upsert({
        where: { year },
        update: { nextNumber: { increment: 1 } },
        create: { year, nextNumber: 1 },
      });
      const previewStudentId = makePreviewStudentId(year, sequence.nextNumber);
      const student = await tx.studentRecord.create({
        data: {
          userId: applicant.userId,
          sourceApplicationId: application.id,
          previewStudentId,
          status: "PREVIEW_PROVISIONED",
          enrollments: {
            create: {
              programmeId: application.programmeId,
              academicSessionCode: academicSession.code,
              curriculumVersionId: curriculum.id,
              status: "PREVIEW_PENDING",
              curriculumStatus: curriculum.status,
            },
          },
        },
        include: { enrollments: true },
      });
      const moved = await tx.application.updateMany({ where: { id: application.id, status: "OFFERED" }, data: { status: "OFFER_ACCEPTED" } });
      if (moved.count !== 1) throw new Error("APPLICATION_STATUS_CHANGED");
      await tx.applicationEvent.create({ data: {
        applicationId: application.id,
        fromStatus: "OFFERED",
        toStatus: "OFFER_ACCEPTED",
        changedById: applicant.userId,
        note: "Applicant accepted the development-preview offer; a preview-only student record was created.",
        applicantMessage: "Your preview offer was accepted. The test student ID is not an official matriculation number, and no SIS/LMS access was provisioned.",
      } });
      await tx.auditLog.create({ data: {
        userId: applicant.userId,
        action: "student.preview.provision",
        entity: "StudentRecord",
        entityId: student.id,
        after: JSON.stringify({ previewStudentId, applicationId: application.id, session: application.session, curriculumStatus: curriculum.status, isPreview: true, officialMatricNo: null, lmsProvisioned: false }),
      } });
      return {
        id: student.id,
        previewStudentId: student.previewStudentId,
        status: student.status,
        officialMatricNo: student.officialMatricNo,
        enrollmentSession: academicSession.code,
        enrollmentStatus: student.enrollments[0]?.status,
        curriculumStatus: student.enrollments[0]?.curriculumStatus,
        curriculumVersion: curriculum.version,
      };
    });
    return Response.json({ data: result, resumed: false, message: "Development-preview student record created. This is not official matriculation or a live student account." }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "APPLICATION_NOT_FOUND") return Response.json({ error: "Application not found." }, { status: 404 });
    if (error?.message === "OFFER_NOT_AVAILABLE") return Response.json({ error: "Only an offer marked in this preview can be accepted here." }, { status: 409 });
    if (error?.message === "STUDENT_ALREADY_PROVISIONED") return Response.json({ error: "This applicant already has a preview student record. Contact Registry for a restricted reconciliation." }, { status: 409 });
    if (error?.message === "OFFICIAL_SESSION_CANNOT_BE_USED_IN_PREVIEW" || error?.message === "OFFICIAL_CURRICULUM_CANNOT_BE_USED_IN_PREVIEW") return Response.json({ error: "An official academic record cannot be used by the preview provisioning flow." }, { status: 409 });
    if (error?.message === "APPLICATION_STATUS_CHANGED") return Response.json({ error: "The application status changed; refresh and try again." }, { status: 409 });
    if (error?.code === "P2002") {
      const recovered = await prisma.studentRecord.findUnique({ where: { sourceApplicationId: id }, include: { sourceApplication: { select: { status: true, applicantId: true } }, enrollments: true } });
      if (recovered && recovered.sourceApplication.applicantId === applicant.id && recovered.sourceApplication.status === "OFFER_ACCEPTED") return Response.json({ data: previewData(recovered), resumed: true, message: "The preview student record was already provisioned; no second record was created." });
      return Response.json({ error: "A duplicate applicant or student identity was detected. Contact Registry for a restricted reconciliation." }, { status: 409 });
    }
    throw error;
  }
}

function previewData(student: any) {
  const enrollment = student.enrollments?.[0];
  return {
    id: student.id,
    previewStudentId: student.previewStudentId,
    status: student.status,
    officialMatricNo: student.officialMatricNo,
    enrollmentSession: enrollment?.academicSessionCode || null,
    enrollmentStatus: enrollment?.status || null,
    curriculumStatus: enrollment?.curriculumStatus || "UNCONFIGURED",
    curriculumVersion: null,
  };
}
