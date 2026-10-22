import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import AdminApplicationsTable from "@/components/AdminApplicationsTable";
import Link from "next/link";
import { redirect } from "next/navigation";

const ACCESS = new Set(["SUPER_ADMIN", "REGISTRAR", "ADMISSIONS"]);

export default async function AdminApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (!ACCESS.has(role)) redirect("/login?error=role");
  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      include: { programme: { select: { title: true } }, applicant: { include: { user: { select: { name: true, email: true, phone: true } } } } },
      orderBy: { updatedAt: "desc" }, take: 100,
    }),
    prisma.application.count(),
  ]);
  const rows = applications.map(app=>({
    id: app.id, appNo: app.appNo, session: app.session, status: app.status, entryMode: app.entryMode,
    name: app.applicant.user.name || "Applicant", email: app.applicant.user.email, phone: app.applicant.user.phone,
    programme: app.programme, submittedAt: app.submittedAt?.toISOString() || null, updatedAt: app.updatedAt.toISOString(),
  }));

  return <section className="py-8 md:py-10"><div className="container max-w-6xl">
    <Link href="/admin" className="text-sm font-bold text-navy underline">← Admin dashboard</Link>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><div><div className="kicker">Admissions · Restricted staff workspace</div><h1 className="mt-1 text-3xl font-extrabold">Application review</h1><p className="mt-2 text-sm text-slate-600">Signed in as {String((session.user as any).email)} · {role}</p></div><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">{total} record{total===1?"":"s"}</span></div>
    <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>Preview only.</b> Applicant records and status decisions created in this workspace are synthetic test data. No counsellor roster or live notifications are configured. Review this data only for workflow testing.</div>
    <div className="mt-6"><AdminApplicationsTable rows={rows} /></div>
  </div></section>;
}
