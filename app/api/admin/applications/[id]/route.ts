import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { text } from "@/app/lib/applicant-portal";

const STAFF_ROLES = new Set(["SUPER_ADMIN", "REGISTRAR", "ADMISSIONS"]);
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "NEEDS_INFORMATION", "OFFERED", "NOT_OFFERED"],
  UNDER_REVIEW: ["NEEDS_INFORMATION", "OFFERED", "NOT_OFFERED"],
  NEEDS_INFORMATION: ["UNDER_REVIEW", "OFFERED", "NOT_OFFERED"],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Application decision writes are disabled in this preview build pending formal workflow release." }, { status: 503 });
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const role = (session.user as any).role;
  if (!STAFF_ROLES.has(role)) return Response.json({ error: "Admissions access required." }, { status: 403 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const toStatus = typeof body?.status === "string" ? body.status : "";
  const note = body?.note === undefined || body?.note === "" ? null : text(body.note, 500);
  const applicantMessage = body?.applicantMessage === undefined || body?.applicantMessage === "" ? null : text(body.applicantMessage, 500);
  if (!toStatus || (body?.note && !note) || (body?.applicantMessage && !applicantMessage)) return Response.json({ error: "Enter a valid status and messages of no more than 500 characters." }, { status: 400 });
  const { id } = await params;
  const application = await prisma.application.findUnique({ where: { id }, select: { id: true, status: true, appNo: true } });
  if (!application) return Response.json({ error: "Application not found." }, { status: 404 });
  if (!ALLOWED_TRANSITIONS[application.status]?.includes(toStatus)) return Response.json({ error: `Status cannot move from ${application.status} to ${toStatus}.` }, { status: 409 });
  if (["NEEDS_INFORMATION", "NOT_OFFERED"].includes(toStatus) && !applicantMessage) return Response.json({ error: "Add an applicant-facing explanation for this decision." }, { status: 400 });
  const userId = (session.user as any).id as string | undefined;
  const updated = await prisma.$transaction(async tx => {
    const result = await tx.application.update({ where: { id }, data: { status: toStatus } });
    await tx.applicationEvent.create({ data: { applicationId: id, fromStatus: application.status, toStatus, changedById: userId || null, note, applicantMessage } });
    await tx.auditLog.create({ data: { userId: userId || null, action: "admissions.application.status", entity: "Application", entityId: id, before: JSON.stringify({ status: application.status }), after: JSON.stringify({ status: toStatus, note, applicantMessage }) } });
    return result;
  });
  return Response.json({ data: { id: updated.id, appNo: updated.appNo, status: updated.status }, message: "Application status updated." });
}
