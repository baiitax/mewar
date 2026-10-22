import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";

const STAFF_ROLES = new Set(["SUPER_ADMIN", "REGISTRAR", "ADMISSIONS"]);

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!STAFF_ROLES.has((session.user as any).role)) return Response.json({ error: "Registry access required." }, { status: 403 });
  const records = await prisma.studentRecord.findMany({
    include: {
      user: { select: { name: true, email: true } },
      sourceApplication: { select: { appNo: true, session: true, programme: { select: { title: true, slug: true } } } },
      enrollments: {
        include: {
          academicSession: { select: { code: true, status: true, isPreview: true, officialSourceRef: true } },
          curriculumVersion: { include: { _count: { select: { courses: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ data: records.map(record => ({
    id: record.id,
    previewStudentId: record.previewStudentId,
    officialMatricNo: record.officialMatricNo,
    status: record.status,
    name: record.user.name,
    email: record.user.email,
    sourceApplication: record.sourceApplication.appNo,
    programme: record.sourceApplication.programme,
    session: record.sourceApplication.session,
    createdAt: record.createdAt,
    enrollments: record.enrollments.map(enrollment => ({
      status: enrollment.status,
      curriculumStatus: enrollment.curriculumStatus,
      session: enrollment.academicSession,
      curriculumVersion: enrollment.curriculumVersion ? {
        version: enrollment.curriculumVersion.version,
        status: enrollment.curriculumVersion.status,
        isPreview: enrollment.curriculumVersion.isPreview,
        courseCount: enrollment.curriculumVersion._count.courses,
        officialSourceRef: enrollment.curriculumVersion.officialSourceRef,
      } : null,
    })),
  })) });
}
