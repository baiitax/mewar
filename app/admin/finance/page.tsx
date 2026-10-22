import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { FINANCE_STAFF_ROLES, summarizeLedger } from "@/app/lib/finance-preview";
import SettlementReconcileForm from "@/components/SettlementReconcileForm";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  if (process.env.NODE_ENV === "production") redirect("/admin");
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (!FINANCE_STAFF_ROLES.has(role)) redirect("/login?error=role");

  const [assessments, batches] = await Promise.all([
    prisma.feeAssessment.findMany({
      include: {
        feeSchedule: { select: { session: true, version: true, bursarSignature: true, programme: { select: { title: true } } } },
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
      include: { _count: { select: { payments: true } }, payments: { select: { providerReference: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const rows = assessments.map(assessment => ({ assessment, ledger: summarizeLedger(assessment.ledgerEntries) }));
  const unreconciledPayments = rows.flatMap(({ assessment }) => assessment.payment && !assessment.payment.settlementBatch
    ? [{ providerReference: assessment.payment.providerReference, amount: assessment.payment.amount, currency: assessment.payment.currency, studentId: assessment.enrollment.studentRecord.previewStudentId }]
    : []);
  const paidCount = rows.filter(({ assessment }) => Boolean(assessment.payment)).length;
  const pendingCount = rows.filter(({ ledger }) => ledger.balance > 0).length;

  return <section className="py-8"><div className="container max-w-7xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="kicker">Restricted · Bursary / Platform Admin</div><h1 className="text-2xl font-extrabold">Finance ledger preview</h1><p className="mt-1 text-sm text-slate-600">Signed in as <b>{String((session.user as any).email)}</b> · {role}</p></div><Link href="/admin" className="rounded-full border border-line px-4 py-2 text-xs font-bold">← Admin dashboard</Link></div>
    <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>Development-only finance simulator — no real money or provider integration.</b><p className="mt-1 text-xs leading-5">All balances and receipts are synthetic. Assessments can be created only from currently effective, signed Bursary schedules. A ledger-derived preview indicator does not constitute official payment or registration clearance. No live payment, bank settlement, refund, dispute, or accounting journal is processed.</p></div>

    <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Preview assessments</div><div className="mt-1 text-2xl font-extrabold text-navy">{assessments.length}</div><div className="text-xs text-slate-500">Latest 100 shown below</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Synthetic payment events</div><div className="mt-1 text-2xl font-extrabold text-navy">{paidCount}</div><div className="text-xs text-slate-500">Not provider-confirmed funds</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Ledger balances pending</div><div className="mt-1 text-2xl font-extrabold text-navy">{pendingCount}</div><div className="text-xs text-slate-500">Calculated from ledger rows</div></div></div>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div className="kicker">Append-style ledger</div><h2 className="mt-1 text-xl font-bold">Assessments, payments and derived balance</h2>
      {!rows.length ? <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No preview fee assessments exist. An accepted preview applicant can prepare one only if a currently effective signed fee schedule exists for their programme and session.</p> : <div className="mt-4 overflow-auto"><table className="w-full min-w-[1180px] border-collapse text-xs"><thead><tr className="bg-navy text-white"><th className="p-2 text-left">Preview student / application</th><th className="p-2 text-left">Programme / session</th><th className="p-2 text-right">Charge</th><th className="p-2 text-right">Credit</th><th className="p-2 text-right">Balance</th><th className="p-2 text-left">Ledger status</th><th className="p-2 text-left">Synthetic payment</th><th className="p-2 text-left">Settlement</th></tr></thead><tbody>
        {rows.map(({ assessment, ledger })=><tr key={assessment.id} className="border-b border-line align-top"><td className="p-2"><b className="font-mono text-navy">{assessment.enrollment.studentRecord.previewStudentId}</b><span className="mt-1 block">{assessment.enrollment.studentRecord.user.name || "Applicant"}</span><span className="block text-slate-500">{assessment.enrollment.studentRecord.sourceApplication.appNo}</span></td><td className="p-2">{assessment.feeSchedule.programme.title}<span className="mt-1 block text-slate-500">{assessment.feeSchedule.session} · schedule v{assessment.feeSchedule.version}</span><span className="block text-slate-500">Signed by {assessment.feeSchedule.bursarSignature || "—"}</span></td><td className="p-2 text-right">{assessment.currency} {ledger.charges.toLocaleString("en-NG")}</td><td className="p-2 text-right">{assessment.currency} {ledger.credits.toLocaleString("en-NG")}</td><td className="p-2 text-right font-bold">{assessment.currency} {ledger.balance.toLocaleString("en-NG")}</td><td className="p-2"><span className="badge bg-amber-50 text-amber-900">{ledger.clearance.replaceAll("_", " ")}</span><span className="mt-1 block text-slate-500">Derived; not official</span></td><td className="p-2">{assessment.payment?<><span className="font-bold">{assessment.payment.receiptCode}</span><span className="mt-1 block break-all font-mono text-[10px] text-slate-500">{assessment.payment.providerReference}</span><span className="mt-1 block text-slate-600">{assessment.payment.status}</span></>:<span className="text-slate-500">No synthetic payment</span>}</td><td className="p-2">{assessment.payment?.settlementBatch?<><span className={`badge ${assessment.payment.settlementBatch.status==="MATCHED"?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`}>{assessment.payment.settlementBatch.status}</span><span className="mt-1 block font-mono text-slate-500">{assessment.payment.settlementBatch.providerBatchReference}</span></>:assessment.payment?<span className="text-amber-800">Awaiting synthetic batch</span>:<span className="text-slate-500">—</span>}</td></tr>)}
      </tbody></table></div>}
    </section>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div className="kicker">Settlement comparison</div><h2 className="mt-1 text-xl font-bold">Synthetic batch reconciliation</h2><p className="mt-2 text-sm text-slate-600">Select one or more test payment references, enter a synthetic batch reference and the reported test total. A variance is recorded without changing the ledger credit.</p><SettlementReconcileForm payments={unreconciledPayments} /></section>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"><div className="kicker">Reconciliation history</div><h2 className="mt-1 text-xl font-bold">Preview batches ({batches.length})</h2>
      {!batches.length ? <p className="mt-3 text-sm text-slate-500">No synthetic settlement batches have been recorded.</p> : <div className="mt-3 overflow-auto"><table className="w-full min-w-[720px] border-collapse text-xs"><thead><tr className="bg-slate-100"><th className="p-2 text-left">Batch reference</th><th className="p-2 text-right">Reported</th><th className="p-2 text-right">Matched ledger total</th><th className="p-2 text-center">Events</th><th className="p-2 text-center">Result</th><th className="p-2">Recorded</th></tr></thead><tbody>{batches.map(batch=><tr key={batch.id} className="border-b border-line"><td className="p-2 font-mono font-semibold">{batch.providerBatchReference}</td><td className="p-2 text-right">{batch.currency} {batch.reportedAmount.toLocaleString("en-NG")}</td><td className="p-2 text-right">{batch.currency} {batch.matchedAmount.toLocaleString("en-NG")}</td><td className="p-2 text-center">{batch._count.payments}</td><td className="p-2 text-center"><span className={`badge ${batch.status==="MATCHED"?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`}>{batch.status}</span></td><td className="p-2 text-center">{batch.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" })}</td></tr>)}</tbody></table></div>}
    </section>
  </div></section>;
}
