import { prisma } from "@/app/lib/db";
import { getApplicantIdentity } from "@/app/lib/applicant-session";
import { applicationSession, intakeIsEnabled, makeApplicationNumber, isPreviewMode } from "@/app/lib/applicant-portal";

export const runtime = "nodejs";

export async function GET() {
  const applicant = await getApplicantIdentity();
  if (!applicant) return Response.json({ error: "Applicant sign-in required." }, { status: 401 });
  const applications = await prisma.application.findMany({
    where: { applicantId: applicant.id },
    include: { programme: { select: { title: true, slug: true, school: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return Response.json({ data: applications.map(app => ({ id: app.id, appNo: app.appNo, session: app.session, status: app.status, entryMode: app.entryMode, programme: app.programme, submittedAt: app.submittedAt, updatedAt: app.updatedAt })) });
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Applicant write endpoints are disabled in this preview build; production release approval and integrations are required." }, { status: 503 });
  const applicant = await getApplicantIdentity();
  if (!applicant) return Response.json({ error: "Applicant sign-in required." }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const programmeId = typeof body?.programmeId === "string" ? body.programmeId : "";
  if (!programmeId || programmeId.length > 100) return Response.json({ error: "Choose a programme." }, { status: 400 });
  const programme = await prisma.programme.findUnique({ where: { id: programmeId }, select: { id: true, title: true, isActive: true, isAcceptingApplications: true } });
  if (!programme || !intakeIsEnabled(programme)) return Response.json({ error: "This programme is not available in the current application window." }, { status: 403 });
  const session = applicationSession();
  if (!session) return Response.json({ error: "No approved application session is configured." }, { status: 503 });
  const existing = await prisma.application.findUnique({ where: { applicantId_programmeId_session: { applicantId: applicant.id, programmeId, session } } });
  if (existing) return Response.json({ id: existing.id, appNo: existing.appNo, status: existing.status, session: existing.session, resume: true }, { status: 200 });

  const now = new Date();
  const year = now.getUTCFullYear();
  try {
    const created = await prisma.$transaction(async tx => {
      const sequence = await tx.applicationSequence.upsert({
        where: { year },
        update: { nextNumber: { increment: 1 } },
        create: { year, nextNumber: 1 },
      });
      const appNo = makeApplicationNumber(year, sequence.nextNumber);
      const application = await tx.application.create({
        data: {
          applicantId: applicant.id,
          programmeId,
          session,
          appNo,
          status: "DRAFT",
          entryMode: "UTME",
          documents: JSON.stringify({ preview: isPreviewMode(), checklistVersion: "unconfigured", filesStored: false }),
        },
        select: { id: true, appNo: true, status: true, session: true },
      });
      await tx.applicationEvent.create({ data: { applicationId: application.id, fromStatus: null, toStatus: "DRAFT", changedById: applicant.userId, note: "Draft created." } });
      await tx.auditLog.create({ data: { userId: applicant.userId, action: "applicant.application.create", entity: "Application", entityId: application.id } });
      return application;
    });
    return Response.json({ ...created, resume: false }, { status: 201 });
  } catch (error: any) {
    // The compound unique key closes the duplicate-application race if two requests arrive together.
    if (error?.code === "P2002") {
      const duplicate = await prisma.application.findUnique({ where: { applicantId_programmeId_session: { applicantId: applicant.id, programmeId, session } } });
      if (duplicate) return Response.json({ id: duplicate.id, appNo: duplicate.appNo, status: duplicate.status, session: duplicate.session, resume: true }, { status: 200 });
    }
    throw error;
  }
}
