import { getApplicantIdentity } from "@/app/lib/applicant-session";
import { isCurrentlySignedFeeSchedule, summarizeLedger } from "@/app/lib/finance-preview";
import { prisma } from "@/app/lib/db";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Preview fee assessments are disabled in production pending MIU Finance approval and provider integration." }, { status: 503 });
  }
  const applicant = await getApplicantIdentity();
  if (!applicant) return Response.json({ error: "Applicant sign-in required." }, { status: 401 });
  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, applicantId: applicant.id },
    include: {
      studentRecord: {
        include: {
          enrollments: {
            include: {
              academicSession: true,
              feeAssessments: {
                include: { feeSchedule: true, ledgerEntries: true, payment: true },
              },
            },
          },
        },
      },
    },
  });
  if (!application) return Response.json({ error: "Application not found." }, { status: 404 });
  if (application.status !== "OFFER_ACCEPTED") return Response.json({ error: "A preview assessment is available only after a preview offer has been accepted." }, { status: 409 });
  if (!application.studentRecord || application.studentRecord.userId !== applicant.userId
    || application.studentRecord.status !== "PREVIEW_PROVISIONED"
    || application.studentRecord.officialMatricNo !== null
    || !/^MIU-TEST-STU-\d{4}-\d{6}$/.test(application.studentRecord.previewStudentId)) {
    return Response.json({ error: "No valid synthetic preview student record is linked to this application." }, { status: 409 });
  }

  const enrollment = application.studentRecord.enrollments.find(item =>
    item.programmeId === application.programmeId
    && item.academicSessionCode === application.session
    && item.academicSession.isPreview,
  );
  if (!enrollment) return Response.json({ error: "No matching preview enrollment is available for assessment." }, { status: 409 });

  const existing = enrollment.feeAssessments[0];
  if (existing) {
    if (!existing.isPreview) return Response.json({ error: "An official finance record cannot be changed by the preview workflow." }, { status: 409 });
    return Response.json({ data: serializeAssessment(existing), resumed: true, message: "The preview assessment already exists; no second charge was posted." });
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const prior = await tx.feeAssessment.findUnique({
        where: { enrollmentId: enrollment.id },
        include: { feeSchedule: true, ledgerEntries: true, payment: true },
      });
      if (prior) {
        if (!prior.isPreview) throw new Error("OFFICIAL_ASSESSMENT");
        return { assessment: prior, created: false };
      }

      const now = new Date();
      const schedule = await tx.feeSchedule.findFirst({
        where: {
          programmeId: application.programmeId,
          session: application.session,
          isPublished: true,
          approvalStatus: "APPROVED",
          bursarSignedAt: { not: null },
          bursarSignature: { not: null },
        },
        orderBy: { version: "desc" },
      });
      if (!schedule || !isCurrentlySignedFeeSchedule(schedule, now)) throw new Error("NO_ACTIVE_SIGNED_SCHEDULE");

      const assessment = await tx.feeAssessment.create({
        data: {
          enrollmentId: enrollment.id,
          feeScheduleId: schedule.id,
          amount: schedule.total,
          currency: schedule.currency,
          isPreview: true,
        },
      });
      await tx.financeLedgerEntry.create({
        data: {
          feeAssessmentId: assessment.id,
          entryType: "FEE_CHARGE",
          direction: "DEBIT",
          amount: schedule.total,
          currency: schedule.currency,
          idempotencyKey: `fee-charge:${enrollment.id}`,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: applicant.userId,
          action: "finance.preview.assessment.create",
          entity: "FeeAssessment",
          entityId: assessment.id,
          after: JSON.stringify({ enrollmentId: enrollment.id, feeScheduleId: schedule.id, amount: schedule.total, currency: schedule.currency, isPreview: true }),
        },
      });
      return { assessment: { ...assessment, feeSchedule: schedule, ledgerEntries: [{ direction: "DEBIT", amount: schedule.total }], payment: null }, created: true };
    });

    return Response.json({
      data: serializeAssessment(result.assessment),
      resumed: !result.created,
      message: result.created
        ? "A preview assessment was created from the currently signed Bursary fee schedule. No payment has been taken."
        : "The preview assessment already exists; no second charge was posted.",
    }, { status: result.created ? 201 : 200 });
  } catch (error: any) {
    if (error?.message === "OFFICIAL_ASSESSMENT") return Response.json({ error: "An official assessment cannot be changed by the preview workflow." }, { status: 409 });
    if (error?.message === "NO_ACTIVE_SIGNED_SCHEDULE") {
      return Response.json({ error: "There is no currently effective, signed Bursary fee schedule for this programme and session. No amount has been invented or charged." }, { status: 409 });
    }
    if (error?.code === "P2002") {
      const recovered = await prisma.feeAssessment.findUnique({ where: { enrollmentId: enrollment.id }, include: { feeSchedule: true, ledgerEntries: true, payment: true } });
      if (recovered?.isPreview) return Response.json({ data: serializeAssessment(recovered), resumed: true, message: "The preview assessment already exists; no second charge was posted." });
      if (recovered) return Response.json({ error: "An official assessment cannot be changed by the preview workflow." }, { status: 409 });
    }
    throw error;
  }
}

function serializeAssessment(assessment: any) {
  const ledger = summarizeLedger(assessment.ledgerEntries);
  return {
    id: assessment.id,
    amount: assessment.amount,
    currency: assessment.currency,
    isPreview: assessment.isPreview,
    feeSchedule: {
      session: assessment.feeSchedule.session,
      version: assessment.feeSchedule.version,
      signedBy: assessment.feeSchedule.bursarSignature,
      signedAt: assessment.feeSchedule.bursarSignedAt?.toISOString() ?? null,
      tuition: assessment.feeSchedule.tuition,
      hostel: assessment.feeSchedule.hostel,
      feeding: assessment.feeSchedule.feeding,
    },
    ledger: {
      charged: ledger.charges,
      paid: ledger.credits,
      balance: ledger.balance,
      clearance: ledger.clearance,
    },
    payment: assessment.payment ? {
      receiptCode: assessment.payment.receiptCode,
      receiptToken: assessment.payment.receiptToken,
      providerReference: assessment.payment.providerReference,
      status: assessment.payment.status,
      amount: assessment.payment.amount,
      createdAt: assessment.payment.createdAt.toISOString(),
    } : null,
  };
}
