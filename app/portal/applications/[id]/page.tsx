import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { decryptApplicantIdentifier, intakeIsEnabled, statusLabel } from "@/app/lib/applicant-portal";
import ApplicationEditor from "@/components/ApplicationEditor";
import AcceptPreviewOffer from "@/components/AcceptPreviewOffer";
import FinancePreviewPanel from "@/components/FinancePreviewPanel";
import { isCurrentlySignedFeeSchedule, summarizeLedger } from "@/app/lib/finance-preview";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ApplicationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=%2Fportal");
  if ((session.user as any).role !== "APPLICANT") redirect("/admin");
  const userId = (session.user as any).id as string;
  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, applicant: { userId } },
    include: {
      programme: { select: { id: true, title: true, school: true } },
      applicant: { include: { user: { select: { name: true, email: true, phone: true } } } },
      events: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, fromStatus: true, toStatus: true, applicantMessage: true, createdAt: true } },
      studentRecord: { include: { enrollments: true } },
    },
  });
  if (!application) notFound();
  const catalogue = await prisma.programme.findMany({ where: { isActive: true }, select: { id: true, title: true, school: true, isActive: true, isAcceptingApplications: true }, orderBy: { school: "asc" } });
  const programmes = catalogue.filter(intakeIsEnabled).map(({ id, title, school }) => ({ id, title, school }));
  if (!programmes.some(programme => programme.id === application.programmeId)) programmes.unshift(application.programme);
  const initial = {
    id: application.id, appNo: application.appNo, session: application.session, status: application.status,
    entryMode: application.entryMode, programmeId: application.programmeId,
    fullName: application.applicant.user.name || "", email: application.applicant.user.email,
    phone: application.applicant.user.phone || "",
    dateOfBirth: application.applicant.dateOfBirth?.toISOString().slice(0, 10) || "",
    gender: application.applicant.gender || "", stateOfOrigin: application.applicant.stateOfOrigin || "",
    nationality: application.applicant.nationality || "Nigeria",
    jambRegNo: decryptApplicantIdentifier(application.applicant.jambRegNoEncrypted) || "",
    jambScore: application.jambScore ?? "",
    olevel: parseOlevel(application.olevel),
  };
  const events = application.events.map(event => ({ ...event, createdAt: event.createdAt.toISOString() }));
  const enrollment = application.studentRecord?.enrollments.find(item => item.programmeId === application.programmeId && item.academicSessionCode === application.session) || application.studentRecord?.enrollments[0];
  const previewRecord = application.studentRecord ? {
    previewStudentId: application.studentRecord.previewStudentId,
    enrollmentSession: enrollment?.academicSessionCode || null,
    curriculumStatus: enrollment?.curriculumStatus || "UNCONFIGURED",
    officialMatricNo: application.studentRecord.officialMatricNo,
  } : null;

  let financePanel: { scheduleAvailable: boolean; initialAssessment: any } | null = null;
  if (process.env.NODE_ENV !== "production" && application.status === "OFFER_ACCEPTED" && application.studentRecord && enrollment) {
    const [signedSchedule, assessment] = await Promise.all([
      prisma.feeSchedule.findFirst({
        where: { programmeId: application.programmeId, session: application.session, isPublished: true, approvalStatus: "APPROVED", bursarSignedAt: { not: null }, bursarSignature: { not: null } },
        orderBy: { version: "desc" },
      }),
      prisma.feeAssessment.findUnique({
        where: { enrollmentId: enrollment.id },
        include: { feeSchedule: true, ledgerEntries: true, payment: true },
      }),
    ]);
    const scheduleAvailable = Boolean(signedSchedule && isCurrentlySignedFeeSchedule(signedSchedule));
    const ledger = assessment ? summarizeLedger(assessment.ledgerEntries) : null;
    financePanel = {
      scheduleAvailable,
      initialAssessment: assessment ? {
        id: assessment.id,
        amount: assessment.amount,
        currency: assessment.currency,
        isPreview: assessment.isPreview,
        feeSchedule: { session: assessment.feeSchedule.session, version: assessment.feeSchedule.version, signedBy: assessment.feeSchedule.bursarSignature, signedAt: assessment.feeSchedule.bursarSignedAt?.toISOString() ?? null, tuition: assessment.feeSchedule.tuition, hostel: assessment.feeSchedule.hostel, feeding: assessment.feeSchedule.feeding },
        ledger: { charged: ledger!.charges, paid: ledger!.credits, balance: ledger!.balance, clearance: ledger!.clearance },
        payment: assessment.payment ? {
          status: assessment.payment.status,
          providerReference: assessment.payment.providerReference,
          receiptCode: assessment.payment.receiptCode,
          receiptToken: assessment.payment.receiptToken,
          amount: assessment.payment.amount,
          currency: assessment.payment.currency,
          createdAt: assessment.payment.createdAt.toISOString(),
        } : null,
      } : null,
    };
  }

  return <section className="py-7 md:py-10"><div className="container max-w-4xl">
    <Link href="/portal" className="text-sm font-bold text-navy underline">← Back to Applicant Portal</Link>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5"><div><div className="kicker">Application · {application.session}</div><h1 className="mt-1 text-2xl font-extrabold">{application.programme.title}</h1><p className="mt-1 font-mono text-xs text-slate-500">{application.appNo}</p></div><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy">{statusLabel(application.status)}</span></div>
    <div className="mt-5"><AcceptPreviewOffer applicationId={application.id} status={application.status} initialRecord={previewRecord} /><ApplicationEditor initial={initial} programmes={programmes} events={events} /></div>
    {financePanel && <FinancePreviewPanel applicationId={application.id} scheduleAvailable={financePanel.scheduleAvailable} initialAssessment={financePanel.initialAssessment} />}
  </div></section>;
}

function parseOlevel(value: string | null): { subject: string; grade: string }[] {
  if (!value) return [];
  try { const rows = JSON.parse(value); return Array.isArray(rows) ? rows.filter(row=>row&&typeof row.subject==="string"&&typeof row.grade==="string") : []; }
  catch { return []; }
}
