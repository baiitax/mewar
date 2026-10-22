import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { summarizeLedger } from "@/app/lib/finance-preview";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview Receipt Verification | MIU", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default async function PreviewReceiptVerificationPage({ params }: { params: Promise<{ token: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) notFound();
  const payment = await prisma.financePayment.findUnique({
    where: { receiptToken: token },
    include: {
      feeAssessment: {
        include: {
          feeSchedule: { include: { programme: { select: { title: true, slug: true } } } },
          ledgerEntries: true,
        },
      },
    },
  });
  if (!payment || payment.providerName !== "PREVIEW_SIMULATOR" || payment.status !== "PREVIEW_CAPTURED" || !payment.feeAssessment.isPreview) notFound();

  const ledger = summarizeLedger(payment.feeAssessment.ledgerEntries);
  return <main className="min-h-[70vh] bg-slate-50 py-10"><div className="container max-w-3xl">
    <Link href="/" className="text-sm font-bold text-navy underline">MIU home</Link>
    <article className="mt-5 overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm">
      <div className="bg-amber-50 px-5 py-5 md:px-7"><div className="kicker">Public token check · synthetic preview</div><h1 className="mt-2 text-2xl font-extrabold">Preview receipt record found</h1><p className="mt-2 text-sm font-semibold text-amber-950">This record was created by the development simulator. It does not prove that money was received.</p></div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_220px] md:p-7">
        <div>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-slate-500">Preview receipt code</dt><dd className="font-mono font-bold text-navy">{payment.receiptCode}</dd></div>
            <div><dt className="text-xs text-slate-500">Synthetic provider reference</dt><dd className="font-mono text-xs text-slate-700">{payment.providerReference}</dd></div>
            <div><dt className="text-xs text-slate-500">Programme</dt><dd className="font-semibold text-navy">{payment.feeAssessment.feeSchedule.programme.title}</dd></div>
            <div><dt className="text-xs text-slate-500">Academic session · signed schedule version</dt><dd className="font-semibold text-slate-800">{payment.feeAssessment.feeSchedule.session} · v{payment.feeAssessment.feeSchedule.version}</dd></div>
            <div><dt className="text-xs text-slate-500">Synthetic amount</dt><dd className="text-xl font-extrabold text-navy">{payment.currency} {payment.amount.toLocaleString("en-NG")}</dd></div>
            <div><dt className="text-xs text-slate-500">Recorded</dt><dd className="text-slate-700">{payment.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })}</dd></div>
            <div><dt className="text-xs text-slate-500">Preview ledger balance</dt><dd className="font-semibold text-slate-800">{payment.currency} {ledger.balance.toLocaleString("en-NG")} · {ledger.clearance.replaceAll("_", " ")}</dd></div>
          </dl>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center"><img src={`/api/finance/receipts/${payment.receiptToken}/qr`} alt="QR code for preview receipt verification" width="180" height="180" className="h-44 w-44" /><p className="mt-2 text-[11px] font-semibold text-slate-600">Scans to this token check · no student identity is shown</p></div>
      </div>
      <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-xs leading-5 text-amber-950 md:px-7"><b>Not an official payment receipt, proof of funds, tax document, bursary clearance or registration clearance.</b> The preview does not contact a payment provider or move money. No student name, email or student ID is exposed on this public verification page.</div>
    </article>
  </div></main>;
}
