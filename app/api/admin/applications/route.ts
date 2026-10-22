import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";

const STAFF_ROLES = new Set(["SUPER_ADMIN", "REGISTRAR", "ADMISSIONS"]);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!STAFF_ROLES.has((session.user as any).role)) return Response.json({ error: "Admissions access required." }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where = status && ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION", "OFFERED", "OFFER_ACCEPTED", "NOT_OFFERED", "WITHDRAWN"].includes(status) ? { status } : {};
  const applications = await prisma.application.findMany({
    where,
    include: {
      programme: { select: { title: true, slug: true } },
      applicant: { include: { user: { select: { name: true, email: true, phone: true } } } },
    },
    orderBy: { updatedAt: "desc" }, take: 100,
  });
  return Response.json({ data: applications.map(app => ({
    id: app.id, appNo: app.appNo, session: app.session, status: app.status, entryMode: app.entryMode,
    programme: app.programme, name: app.applicant.user.name, email: app.applicant.user.email,
    phone: app.applicant.user.phone, submittedAt: app.submittedAt, updatedAt: app.updatedAt,
  })) });
}
