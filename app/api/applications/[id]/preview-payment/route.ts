import { randomBytes } from "node:crypto";
import { getApplicantIdentity } from "@/app/lib/applicant-session";
import { formatPreviewProviderReference, formatPreviewReceiptCode, summarizeLedger } from "@/app/lib/finance-preview";
import { prisma } from "@/app/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Preview payment capture is disabled in production. An MIU-approved payment provider and Finance controls are required." }, { status: 503 });
  }
  const applicant = await getApplicantIdentity();
  if (!applicant) return Response.json({ error: "Applicant sign-in required." }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
    return Response.json({ error: "A valid request idempotency key is required." }, { status: 400 });
  }
  const { id } = await params;

  const priorKey = await prisma.financePayment.findUnique({
    where: { idempotencyKey },
    include: {
      feeAssessment: {
        include: {
          enrollment: { include: { studentRecord: true } },
          feeSchedule: true,
          ledgerEntries: true,
        },
      },
      settlementBatch: true,
    },
  });
  if (priorKey) {
    const owner = priorKey.feeAssessment.enrollment.studentRecord;
    if (owner.userId !== applicant.userId || owner.sourceApplicationId !== id) {
      return Response.json({ error: "Idempotency key has already been used." }, { status: 409 });
    }
    return Response.json({ data: serializePayment(priorKey), resumed: true, message: "The same synthetic payment event was already processed; no duplicate ledger credit was created." });
  }

  const application = await prisma.application.findFirst({
    where: { id, applicantId: applicant.id },
    include: {
      studentRecord: {
        include: {
          enrollments: {
            include: {
              academicSession: true,
              feeAssessments: { include: { feeSchedule: true, ledgerEntries: true, payment: true } },
            },
          },
        },
      },
    },
  });
  if (!application) return Response.json({ error: "Application not found." }, { status: 404 });
  if (application.status !== "OFFER_ACCEPTED" || !application.studentRecord || application.studentRecord.userId !== applicant.userId
    || application.studentRecord.status !== "PREVIEW_PROVISIONED"
    || application.studentRecord.officialMatricNo !== null
    || !/^MIU-TEST-STU-\d{4}-\d{6}$/.test(application.studentRecord.previewStudentId)) {
    return Response.json({ error: "Only the owner of an accepted preview offer with a synthetic preview student record can use this simulator." }, { status: 409 });
  }
  const enrollment = application.studentRecord.enrollments.find(item =>
    item.programmeId === application.programmeId
    && item.academicSessionCode === application.session
    && item.academicSession.isPreview,
  );
  if (!enrollment) return Response.json({ error: "No matching preview enrollment is available." }, { status: 409 });
  const assessment = enrollment.feeAssessments[0];
  if (!assessment || !assessment.isPreview) return Response.json({ error: "Create a preview assessment from a currently signed Bursary fee schedule before simulating a payment." }, { status: 409 });

  const assessmentPayment = await prisma.financePayment.findUnique({
    where: { feeAssessmentId: assessment.id },
    include: {
      feeAssessment: {
        include: {
          enrollment: { include: { studentRecord: true } },
          feeSchedule: true,
          ledgerEntries: true,
        },
      },
      settlementBatch: true,
    },
  });
  if (assessmentPayment) {
    if (assessmentPayment.feeAssessment.enrollment.studentRecord.userId !== applicant.userId) return Response.json({ error: "Finance record not found." }, { status: 404 });
    return Response.json({ data: serializePayment(assessmentPayment), resumed: true, message: "This assessment already has a synthetic payment record; a second payment was not created." });
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const current = await tx.feeAssessment.findUnique({
        where: { id: assessment.id },
        include: {
          enrollment: { include: { studentRecord: true, academicSession: true } },
          feeSchedule: true,
          ledgerEntries: true,
          payment: { include: { settlementBatch: true } },
        },
      });
      if (!current || current.enrollment.studentRecord.userId !== applicant.userId
        || current.enrollment.studentRecord.status !== "PREVIEW_PROVISIONED"
        || current.enrollment.studentRecord.officialMatricNo !== null
        || !/^MIU-TEST-STU-\d{4}-\d{6}$/.test(current.enrollment.studentRecord.previewStudentId)
        || !current.isPreview || !current.enrollment.academicSession.isPreview) {
        throw new Error("ASSESSMENT_NOT_AVAILABLE");
      }
      if (current.payment) return { payment: current.payment, created: false };
      const balance = summarizeLedger(current.ledgerEntries);
      if (balance.charges !== current.amount || balance.credits !== 0 || balance.balance !== current.amount || current.amount <= 0) {
        throw new Error("LEDGER_NOT_PAYABLE");
      }

      const year = new Date().getUTCFullYear();
      const sequence = await tx.previewReceiptSequence.upsert({
        where: { year },
        update: { nextNumber: { increment: 1 } },
        create: { year, nextNumber: 1 },
      });
      const payment = await tx.financePayment.create({
        data: {
          feeAssessmentId: current.id,
          providerName: "PREVIEW_SIMULATOR",
          providerReference: formatPreviewProviderReference(year, randomBytes(6).toString("hex")),
          idempotencyKey,
          amount: current.amount,
          currency: current.currency,
          status: "PREVIEW_CAPTURED",
          receiptCode: formatPreviewReceiptCode(year, sequence.nextNumber),
          receiptToken: randomBytes(24).toString("hex"),
        },
      });
      await tx.financeLedgerEntry.create({
        data: {
          feeAssessmentId: current.id,
          paymentId: payment.id,
          entryType: "PREVIEW_PAYMENT",
          direction: "CREDIT",
          amount: payment.amount,
          currency: payment.currency,
          idempotencyKey: `payment-capture:${current.id}`,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: applicant.userId,
          action: "finance.preview.payment.capture",
          entity: "FinancePayment",
          entityId: payment.id,
          after: JSON.stringify({ providerName: payment.providerName, providerReference: payment.providerReference, amount: payment.amount, currency: payment.currency, receiptCode: payment.receiptCode, isPreview: true }),
        },
      });
      return { payment: { ...payment, settlementBatch: null }, created: true };
    });

    const fullPayment = await prisma.financePayment.findUnique({
      where: { id: result.payment.id },
      include: {
        feeAssessment: {
          include: {
            enrollment: { include: { studentRecord: true } },
            feeSchedule: true,
            ledgerEntries: true,
          },
        },
        settlementBatch: true,
      },
    });
    if (!fullPayment) throw new Error("CREATED_PAYMENT_NOT_FOUND");
    return Response.json({
      data: serializePayment(fullPayment),
      resumed: !result.created,
      message: result.created
        ? "Synthetic preview payment recorded. No real money moved; this is not an official receipt or clearance."
        : "The synthetic payment already exists; no duplicate ledger credit was created.",
    }, { status: result.created ? 201 : 200 });
  } catch (error: any) {
    if (error?.message === "ASSESSMENT_NOT_AVAILABLE") return Response.json({ error: "The preview assessment is not available for payment." }, { status: 409 });
    if (error?.message === "LEDGER_NOT_PAYABLE") return Response.json({ error: "The preview ledger is not in a payable state. Contact the Bursary preview administrator." }, { status: 409 });
    if (error?.code === "P2002") {
      const recovered = await prisma.financePayment.findUnique({
        where: { feeAssessmentId: assessment.id },
        include: {
          feeAssessment: {
            include: {
              enrollment: { include: { studentRecord: true } },
              feeSchedule: true,
              ledgerEntries: true,
            },
          },
          settlementBatch: true,
        },
      });
      if (recovered && recovered.feeAssessment.enrollment.studentRecord.userId === applicant.userId) {
        return Response.json({ data: serializePayment(recovered), resumed: true, message: "The synthetic payment already exists; no duplicate ledger credit was created." });
      }
      return Response.json({ error: "A duplicate payment event was detected. No second ledger credit was posted." }, { status: 409 });
    }
    throw error;
  }
}

function serializePayment(payment: any) {
  const summary = summarizeLedger(payment.feeAssessment.ledgerEntries);
  return {
    id: payment.id,
    status: payment.status,
    provider: payment.providerName,
    providerReference: payment.providerReference,
    amount: payment.amount,
    currency: payment.currency,
    receiptCode: payment.receiptCode,
    receiptToken: payment.receiptToken,
    receiptUrl: `/finance/verify/${payment.receiptToken}`,
    qrImageUrl: `/api/finance/receipts/${payment.receiptToken}/qr`,
    createdAt: payment.createdAt.toISOString(),
    ledger: {
      charged: summary.charges,
      paid: summary.credits,
      balance: summary.balance,
      clearance: summary.clearance,
    },
    settlement: payment.settlementBatch ? {
      batchReference: payment.settlementBatch.providerBatchReference,
      status: payment.settlementBatch.status,
      reportedAmount: payment.settlementBatch.reportedAmount,
      matchedAmount: payment.settlementBatch.matchedAmount,
    } : null,
    previewOnly: true,
  };
}
