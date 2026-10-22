import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPage(){
  const session = await auth();
  if(!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if(!["SUPER_ADMIN","REGISTRAR","BURSAR","ADMISSIONS"].includes(role)) redirect("/login?error=role");
  const canReviewStudents = ["SUPER_ADMIN","REGISTRAR","ADMISSIONS"].includes(role);
  const canManageFinancePreview = process.env.NODE_ENV !== "production" && ["SUPER_ADMIN","BURSAR"].includes(role);
  const canManageGovernancePreview = process.env.NODE_ENV !== "production" && role === "SUPER_ADMIN";
  const [programmes, fees, users, applicants, applications, students, financeAssessments, governanceEntries, audit] = await Promise.all([
    prisma.programme.count(),
    prisma.feeSchedule.count({where:{isPublished:true,approvalStatus:"APPROVED",bursarSignedAt:{not:null},bursarSignature:{not:null}}}),
    prisma.user.count(),
    prisma.applicant.count(),
    prisma.application.count(),
    canReviewStudents ? prisma.studentRecord.count() : Promise.resolve(null),
    canManageFinancePreview ? prisma.feeAssessment.count() : Promise.resolve(null),
    canManageGovernancePreview ? prisma.governanceEntry.count() : Promise.resolve(null),
    prisma.auditLog.findMany({ orderBy:{ createdAt:"desc"}, take:6 }),
  ]);
  return (
    <section className="py-8"><div className="container">
      <div className="flex justify-between items-center"><div><div className="kicker">Admin • Foundation</div><h1 className="text-2xl font-bold">Platform Dashboard</h1><p className="text-sm text-slate-600">Signed in as {(session.user as any).email} — <span className="badge bg-navy text-white">{role}</span></p></div><Link href="/api/health" className="border border-line px-3 py-1.5 rounded-full text-xs font-bold">Health CHECK →</Link></div>
      <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
        <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">Programme catalogue entries</div><div className="text-2xl font-bold">{programmes}</div><div className="text-xs text-slate">Accreditation refs await Registrar verification • <Link href="/api/programmes" className="underline">API →</Link></div></div>
        <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">Published Bursary fee schedules</div><div className="text-2xl font-bold">{fees}</div><div className="text-xs text-slate">Signed schedules only • <Link href="/admin/fees" className="underline">Manage drafts →</Link> · <Link href="/api/fees" className="underline">API</Link></div></div>
        <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">Platform users</div><div className="text-2xl font-bold">{users}</div><div className="text-xs text-slate">Credentials/preview identity records</div></div>
        <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">Applicant identities</div><div className="text-2xl font-bold">{applicants}</div><div className="text-xs text-slate">Verified contacts · duplicate email/phone checks</div></div>
        <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">Applications</div><div className="text-2xl font-bold">{applications}</div><div className="text-xs text-slate">{canReviewStudents ? <Link href="/admin/applications" className="underline">Open restricted review →</Link> : "Restricted Admissions workspace"}</div></div>
        {canReviewStudents && <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">Preview student records</div><div className="text-2xl font-bold">{students}</div><div className="text-xs text-slate"><Link href="/admin/students" className="underline">Open Registry preview →</Link></div></div>}
        {canManageFinancePreview && <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">Preview finance assessments</div><div className="text-2xl font-bold">{financeAssessments}</div><div className="text-xs text-slate"><Link href="/admin/finance" className="underline">Open Bursary ledger preview →</Link></div></div>}
        {canManageGovernancePreview && <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">Governance preview entries</div><div className="text-2xl font-bold">{governanceEntries}</div><div className="text-xs text-slate"><Link href="/admin/governance" className="underline">Open MIU readiness tracker →</Link></div></div>}
        <div className="bg-white border border-line rounded-xl p-4"><div className="text-xs text-slate">DB</div><div className="text-sm font-bold">SQLite local development</div><div className="text-xs text-slate">Production needs managed Postgres + migration/DR sign-off</div></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold text-sm">Recent Audit Log</h3><div className="text-xs text-slate mt-2 space-y-1">{audit.map(a=>(
          <div key={a.id} className="border-b border-line py-1 flex justify-between"><span>{a.action} {a.entity?`• ${a.entity}`:""}</span><span className="text-slate">{new Date(a.createdAt).toLocaleString()}</span></div>
        ))}{audit.length===0 && <div className="text-slate">No events yet — login is logged.</div>}</div></div>
        <div className="bg-slate-50 border border-line rounded-xl p-4"><h3 className="font-bold text-sm">Next Steps (per Plan)</h3><ul className="text-xs mt-2 list-disc pl-5 space-y-1">
          <li><b>Phase 3 preview:</b> Applicant registration, dev OTP, dedup, draft/resume, document format checks and restricted status review · {canReviewStudents ? <Link href="/admin/applications" className="underline">Review applications</Link> : "Admissions-only workspace"}</li><li><b>Phase 4 preview:</b> Applicant acceptance → idempotent test student ID and session/enrollment record; no official matriculation or LMS sync · {canReviewStudents ? <Link href="/admin/students" className="underline">Registry view</Link> : "Registry-only workspace"}</li><li><b>Phase 5 preview:</b> Synthetic ledger, settlement comparison and QR receipt; no live money movement · {canManageFinancePreview ? <Link href="/admin/finance" className="underline">Bursary workspace</Link> : "Bursary-only workspace"}</li><li><b>Phase 6 planning:</b> MIU owners and approvals remain unconfirmed · {canManageGovernancePreview ? <Link href="/admin/governance" className="underline">Decision tracker</Link> : "Super Admin preview workspace"}</li><li><b>Production gates:</b> Configure MIU OIDC, enforce MFA, provision managed Postgres, and complete security review.</li>
        </ul><Link href="/admissions/fees" className="inline-block mt-3 bg-gold text-navy px-3 py-1.5 rounded-full text-xs font-bold">View public Fees page →</Link></div>
      </div>
    </div></section>
  );
}
