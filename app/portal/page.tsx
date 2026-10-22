import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { applicationSession, intakeIsEnabled, isPreviewMode, statusLabel } from "@/app/lib/applicant-portal";
import NewApplicationForm from "@/components/NewApplicationForm";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import { redirect } from "next/navigation";

function statusClass(status: string) {
  if (["OFFERED", "OFFER_ACCEPTED"].includes(status)) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (["NOT_OFFERED", "WITHDRAWN"].includes(status)) return "bg-slate-100 text-slate-700 border-slate-200";
  if (["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION"].includes(status)) return "bg-blue-50 text-blue-800 border-blue-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

export default async function ApplicantPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=%2Fportal");
  if ((session.user as any).role !== "APPLICANT") redirect("/admin");
  const userId = (session.user as any).id as string;
  const applicant = await prisma.applicant.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, phone: true } }, applications: { include: { programme: { select: { title: true, school: true } } }, orderBy: { updatedAt: "desc" } } },
  });
  if (!applicant) redirect("/login?error=applicant-profile");
  const studentRecord = await prisma.studentRecord.findUnique({
    where: { userId },
    include: { enrollments: { include: { academicSession: true, curriculumVersion: true } } },
  });
  const catalogue = await prisma.programme.findMany({ where: { isActive: true }, select: { id: true, title: true, school: true, isActive: true, isAcceptingApplications: true }, orderBy: { school: "asc" } });
  const programmes = catalogue.filter(intakeIsEnabled).map(({ id, title, school }) => ({ id, title, school }));
  const currentSession = applicationSession() || "Not configured";

  return <section className="py-8 md:py-10"><div className="container max-w-6xl">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><div className="kicker">Applicant Portal · Private workspace</div><h1 className="mt-1 text-3xl font-extrabold">Welcome, {applicant.user.name?.split(" ")[0] || "Applicant"}</h1><p className="mt-2 text-sm text-slate-600">{applicant.user.email} · {applicant.user.phone}</p></div>
      <div className="self-start md:self-auto"><SignOutButton /></div>
    </div>
    {isPreviewMode() && <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>Development preview · synthetic data only.</b><p className="mt-1 text-xs leading-5">This portal is not an approved live admissions intake. Never add real personal details or real documents. Preview submissions do not constitute an MIU application, offer, or admission decision.</p></div>}
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Applicant reference</div><div className="mt-1 font-mono text-sm font-bold text-navy">AP-{applicant.id.slice(-8).toUpperCase()}</div><div className="mt-1 text-xs text-slate-500">Portal profile created {new Date(applicant.createdAt).toLocaleDateString()}</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Your applications</div><div className="mt-1 text-2xl font-extrabold text-navy">{applicant.applications.length}</div><div className="text-xs text-slate-500">Drafts and submitted test records</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Intake session</div><div className="mt-1 text-xl font-extrabold text-navy">{currentSession}</div><div className="text-xs text-slate-500">Preview label only; confirm official intake with Admissions</div></div>
    </div>

    {studentRecord && <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="kicker">Phase 4 · Student records preview</div><h2 className="mt-1 font-bold text-amber-950">A test student record was generated</h2></div><span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-900">{studentRecord.status.replaceAll("_"," ")}</span></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Preview student ID</div><div className="mt-1 font-mono text-sm font-bold text-navy">{studentRecord.previewStudentId}</div></div><div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Official matric number</div><div className="mt-1 text-sm font-bold text-slate-600">Not assigned</div></div><div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Curriculum</div><div className="mt-1 text-sm font-bold text-navy">{studentRecord.enrollments[0]?.curriculumStatus || "UNCONFIGURED"}</div></div></div><p className="mt-3 text-xs leading-5 text-amber-950">This synthetic record does not provide Student Portal, SIS or LMS access and is not official matriculation.</p></div>}

    <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><div className="flex items-start justify-between gap-3"><div><div className="kicker">Your records</div><h2 className="mt-1 text-xl font-bold">Applications</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{applicant.applications.length} total</span></div>
        {applicant.applications.length ? <div className="mt-4 space-y-3">{applicant.applications.map(app=><article key={app.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-navy">{app.programme.title}</p><p className="mt-1 font-mono text-xs text-slate-500">{app.appNo} · {app.session}</p></div><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(app.status)}`}>{statusLabel(app.status)}</span></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{app.entryMode.replaceAll("_", " ")} · Updated {new Date(app.updatedAt).toLocaleDateString()}</span><Link href={`/portal/applications/${app.id}`} className="font-bold text-navy underline">{["DRAFT", "NEEDS_INFORMATION"].includes(app.status)?"Continue":"View record"} →</Link></div></article>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center"><div className="text-2xl">▤</div><p className="mt-2 font-semibold text-navy">No application drafts yet</p><p className="mt-1 text-sm text-slate-500">Start a test draft below. It will be saved to this preview account.</p></div>}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"><div className="kicker">Start here</div><h2 className="mt-1 text-xl font-bold">New draft</h2><p className="mt-2 text-sm text-slate-600">Create a resumable application record and enter synthetic test details. No official checklist or application window is configured.</p><div className="mt-4"><NewApplicationForm programmes={programmes} sessionLabel={currentSession} /></div><div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><b className="text-slate-800">Data & documents:</b> JAMB registration details are encrypted in the preview database and deduplicated with a keyed hash. File checks only validate type/signature and discard the file; there is no secure storage or malware scan.</div></section>
    </div>
  </div></section>;
}
