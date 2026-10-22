import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { FINANCE_STAFF_ROLES, summarizeLedger } from "@/app/lib/finance-preview";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Preview finance records are not a production finance system." }, { status: 503 });
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!FINANCE_STAFF_ROLES.has((session.user as any).role)) return Response.json({ error: "Bursary access required." }, { status: 403 });

  const [assessments, batches] = await Promise.all([
    prisma.feeAssessment.findMany({
      include: {
        feeSchedule: { select: { session: true, version: true, bursarSignature: true, programme: { select: { title: true, slug: true } } } },
        enrollment: {
          include: {
            studentRecord: {
              select: {
                previewStudentId: true,
                sourceApplication: { select: { appNo: true } },
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        ledgerEntries: { orderBy: { createdAt: "asc" } },
        payment: { include: { settlementBatch: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.settlementBatch.findMany({
      include: { _count: { select: { payments: true } }, payments: { select: { providerReference: true, amount: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return Response.json({
    data: assessments.map(assessment => {
      const ledger = summarizeLedger(assessment.ledgerEntries);
      return {
        id: assessment.id,
        isPreview: assessment.isPreview,
        amount: assessment.amount,
        currency: assessment.currency,
        ledger: { charged: ledger.charges, paid: ledger.credits, balance: ledger.balance, clearance: ledger.clearance },
        student: {
          previewStudentId: assessment.enrollment.studentRecord.previewStudentId,
          name: assessment.enrollment.studentRecord.user.name,
          email: assessment.enrollment.studentRecord.user.email,
          applicationNumber: assessment.enrollment.studentRecord.sourceApplication.appNo,
        },
        programme: assessment.feeSchedule.programme,
        session: assessment.feeSchedule.session,
        feeScheduleVersion: assessment.feeSchedule.version,
        signedBy: assessment.feeSchedule.bursarSignature,
        createdAt: assessment.createdAt.toISOString(),
        payment: assessment.payment ? {
          status: assessment.payment.status,
          provider: assessment.payment.providerName,
          providerReference: assessment.payment.providerReference,
          receiptCode: assessment.payment.receiptCode,
          amount: assessment.payment.amount,
          createdAt: assessment.payment.createdAt.toISOString(),
          settlement: assessment.payment.settlementBatch ? {
            batchReference: assessment.payment.settlementBatch.providerBatchReference,
            status: assessment.payment.settlementBatch.status,
          } : null,
        } : null,
      };
    }),
    batches: batches.map(serializeBatch),
    previewOnly: true,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Synthetic settlement reconciliation is disabled in production pending approved MIU Finance controls and provider integration." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!FINANCE_STAFF_ROLES.has((session.user as any).role)) return Response.json({ error: "Bursary access required." }, { status: 403 });

  let body: any;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const providerBatchReference = typeof body?.providerBatchReference === "string" ? body.providerBatchReference.trim() : "";
  const reportedAmount = Number(body?.reportedAmount);
  const providerReferences = Array.isArray(body?.providerReferences)
    ? body.providerReferences.map((item: unknown) => typeof item === "string" ? item.trim() : "")
    : [];
  if (!/^[A-Za-z0-9._:-]{4,120}$/.test(providerBatchReference)
    || !Number.isSafeInteger(reportedAmount) || reportedAmount <= 0
    || providerReferences.length < 1 || providerReferences.length > 100
    || providerReferences.some((reference: string) => !/^MIU-TEST-PAY-\d{4}-[A-F0-9]{12}$/.test(reference))
    || new Set(providerReferences).size !== providerReferences.length) {
    return Response.json({ error: "Provide a unique preview batch reference, positive integer NGN amount, and 1–100 unique synthetic payment references." }, { status: 400 });
  }

  const canonicalReferences = [...providerReferences].sort();
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ providerBatchReference, reportedAmount, currency: "NGN", providerReferences: canonicalReferences }))
    .digest("hex");
  const prior = await prisma.settlementBatch.findUnique({
    where: { providerBatchReference },
    include: { payments: { select: { providerReference: true } } },
  });
  if (prior) {
    if (prior.requestHash !== requestHash) return Response.json({ error: "That preview batch reference was already used with different contents." }, { status: 409 });
    return Response.json({ data: serializeBatch(prior), resumed: true, message: "The same settlement import was already processed; no duplicate reconciliation was created." });
  }

  const matchingPayments = await prisma.financePayment.findMany({
    where: { providerReference: { in: providerReferences }, providerName: "PREVIEW_SIMULATOR", status: "PREVIEW_CAPTURED", currency: "NGN" },
    select: { id: true, providerReference: true, amount: true, settlementBatchId: true },
  });
  if (matchingPayments.length !== providerReferences.length) {
    return Response.json({ error: "Every reference must identify one captured synthetic preview payment." }, { status: 409 });
  }
  if (matchingPayments.some(payment => payment.settlementBatchId)) {
    return Response.json({ error: "One or more preview payments have already been reconciled." }, { status: 409 });
  }
  const matchedAmount = matchingPayments.reduce((total, payment) => total + payment.amount, 0);
  if (!Number.isSafeInteger(matchedAmount)) return Response.json({ error: "Settlement total exceeds the supported integer range." }, { status: 400 });

  try {
    const batch = await prisma.$transaction(async tx => {
      const currentPayments = await tx.financePayment.findMany({
        where: { providerReference: { in: providerReferences }, providerName: "PREVIEW_SIMULATOR", status: "PREVIEW_CAPTURED", currency: "NGN", settlementBatchId: null },
        select: { id: true, amount: true },
      });
      if (currentPayments.length !== providerReferences.length) throw new Error("PAYMENTS_CHANGED");
      const currentMatchedAmount = currentPayments.reduce((total, payment) => total + payment.amount, 0);
      const created = await tx.settlementBatch.create({
        data: {
          providerName: "PREVIEW_SIMULATOR",
          providerBatchReference,
          requestHash,
          reportedAmount,
          matchedAmount: currentMatchedAmount,
          currency: "NGN",
          status: currentMatchedAmount === reportedAmount ? "MATCHED" : "VARIANCE",
          createdById: (session.user as any).id || null,
        },
      });
      const updated = await tx.financePayment.updateMany({
        where: { id: { in: currentPayments.map(payment => payment.id) }, settlementBatchId: null },
        data: { settlementBatchId: created.id },
      });
      if (updated.count !== currentPayments.length) throw new Error("PAYMENTS_CHANGED");
      await tx.auditLog.create({
        data: {
          userId: (session.user as any).id || null,
          action: "finance.preview.settlement.reconcile",
          entity: "SettlementBatch",
          entityId: created.id,
          after: JSON.stringify({ providerBatchReference, reportedAmount, matchedAmount: currentMatchedAmount, status: created.status, paymentCount: currentPayments.length, isPreview: true }),
        },
      });
      return created;
    });
    return Response.json({ data: serializeBatch({ ...batch, payments: matchingPayments.map(payment => ({ providerReference: payment.providerReference })) }), resumed: false, message: batch.status === "MATCHED" ? "Synthetic settlement matched the selected preview payments." : "Variance recorded for this synthetic batch; the payment ledger was not altered." }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "PAYMENTS_CHANGED") return Response.json({ error: "A selected payment changed during reconciliation; refresh the Bursary workspace." }, { status: 409 });
    if (error?.code === "P2002") {
      const recovered = await prisma.settlementBatch.findUnique({ where: { providerBatchReference }, include: { payments: { select: { providerReference: true } } } });
      if (recovered?.requestHash === requestHash) return Response.json({ data: serializeBatch(recovered), resumed: true, message: "The same settlement import was already processed." });
      return Response.json({ error: "That preview batch reference was already used." }, { status: 409 });
    }
    throw error;
  }
}

function serializeBatch(batch: any) {
  const payments = batch.payments || [];
  return {
    id: batch.id,
    provider: batch.providerName,
    providerBatchReference: batch.providerBatchReference,
    reportedAmount: batch.reportedAmount,
    matchedAmount: batch.matchedAmount,
    currency: batch.currency,
    status: batch.status,
    paymentCount: batch._count?.payments ?? payments.length,
    providerReferences: payments.map((payment: any) => payment.providerReference),
    createdAt: batch.createdAt.toISOString(),
  };
}
