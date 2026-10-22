"use client";

import { useState } from "react";

type PreviewPayment = {
  status: string;
  providerReference: string;
  receiptCode: string;
  receiptToken: string;
  amount: number;
  currency: string;
  createdAt: string;
};

type PreviewAssessment = {
  id: string;
  amount: number;
  currency: string;
  isPreview: boolean;
  feeSchedule: { session: string; version: number; signedBy: string | null; signedAt: string | null; tuition: number; hostel: number; feeding: number };
  ledger: { charged: number; paid: number; balance: number; clearance: string };
  payment: PreviewPayment | null;
};

export default function FinancePreviewPanel({ applicationId, scheduleAvailable, initialAssessment }: {
  applicationId: string;
  scheduleAvailable: boolean;
  initialAssessment: PreviewAssessment | null;
}) {
  const [assessment, setAssessment] = useState(initialAssessment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function prepareAssessment() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/applications/${applicationId}/preview-assessment`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not prepare the preview assessment.");
      setAssessment(payload.data);
      setMessage(payload.message || "Preview assessment ready.");
    } catch (reason: any) {
      setError(reason.message || "Could not prepare the preview assessment.");
    } finally { setBusy(false); }
  }

  async function simulatePayment() {
    setBusy(true); setError(""); setMessage("");
    try {
      const key = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await fetch(`/api/applications/${applicationId}/preview-payment`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idempotencyKey: key }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not record the synthetic payment.");
      setAssessment(current => current ? {
        ...current,
        ledger: payload.data.ledger,
        payment: {
          status: payload.data.status,
          providerReference: payload.data.providerReference,
          receiptCode: payload.data.receiptCode,
          receiptToken: payload.data.receiptToken,
          amount: payload.data.amount,
          currency: payload.data.currency,
          createdAt: payload.data.createdAt,
        },
      } : current);
      setMessage(payload.message || "Synthetic preview payment recorded.");
    } catch (reason: any) {
      setError(reason.message || "Could not record the synthetic payment.");
    } finally { setBusy(false); }
  }

  return <section className="mt-6 rounded-2xl border border-amber-300 bg-white p-5 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="kicker">Phase 5 · Finance preview</div><h2 className="mt-1 text-xl font-bold">Preview fee account</h2><p className="mt-2 max-w-2xl text-sm text-slate-600">Charges can be prepared only from a currently effective, Bursary-signed schedule. The simulator records no real payment and grants no official clearance.</p></div><span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">TEST ONLY</span></div>

    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><b>No money is taken.</b> Do not use real financial or personal information. A preview receipt is not proof of funds, a tax document, Bursary confirmation or registration clearance.</div>
    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {message && <div role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">{message}</div>}

    {!assessment ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4">
      {scheduleAvailable ? <><p className="text-sm text-slate-600">A signed schedule is available for this programme and session. Preparing an assessment snapshots its published total; this does not initiate a payment.</p><button type="button" onClick={prepareAssessment} disabled={busy} className="mt-3 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Preparing…" : "Prepare preview assessment"}</button></> : <p className="text-sm text-slate-600">No currently effective, signed Bursary schedule is available for this programme and session. No amount is shown or invented.</p>}
    </div> : <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><div className="text-xs text-slate-500">Signed fee schedule</div><div className="mt-1 font-semibold text-navy">{assessment.feeSchedule.session} · v{assessment.feeSchedule.version}</div><div className="text-xs text-slate-500">Signed by {assessment.feeSchedule.signedBy || "Bursary"}</div></div>
          <div><div className="text-xs text-slate-500">Preview assessment total</div><div className="mt-1 text-xl font-extrabold text-navy">{assessment.currency} {assessment.amount.toLocaleString("en-NG")}</div></div>
        </div>
        <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 p-3 text-xs sm:grid-cols-3"><div><span className="text-slate-500">Tuition</span><b className="mt-1 block text-slate-800">{assessment.currency} {assessment.feeSchedule.tuition.toLocaleString("en-NG")}</b></div><div><span className="text-slate-500">Hostel</span><b className="mt-1 block text-slate-800">{assessment.currency} {assessment.feeSchedule.hostel.toLocaleString("en-NG")}</b></div><div><span className="text-slate-500">Feeding</span><b className="mt-1 block text-slate-800">{assessment.currency} {assessment.feeSchedule.feeding.toLocaleString("en-NG")}</b></div></div>
        <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3"><div><div className="text-xs text-slate-500">Ledger charges</div><b>{assessment.currency} {assessment.ledger.charged.toLocaleString("en-NG")}</b></div><div><div className="text-xs text-slate-500">Ledger credits</div><b>{assessment.currency} {assessment.ledger.paid.toLocaleString("en-NG")}</b></div><div><div className="text-xs text-slate-500">Balance · derived status</div><b>{assessment.currency} {assessment.ledger.balance.toLocaleString("en-NG")} · {assessment.ledger.clearance.replaceAll("_", " ")}</b></div></div>
        {!assessment.payment && assessment.ledger.balance > 0 && <button type="button" onClick={simulatePayment} disabled={busy} className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Recording preview…" : "Simulate full payment (test only)"}</button>}
        {assessment.payment && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm"><b className="text-green-900">Synthetic payment event recorded</b><p className="mt-1 font-mono text-xs text-slate-700">{assessment.payment.providerReference}</p><p className="mt-1 text-xs text-slate-600">Payment status: {assessment.payment.status.replaceAll("_", " ")} · no external provider called</p></div>}
      </div>
      {assessment.payment && <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-4 text-center"><div className="text-xs font-bold text-navy">PREVIEW RECEIPT</div><img src={`/api/finance/receipts/${assessment.payment.receiptToken}/qr`} alt="QR code for synthetic preview receipt" width="160" height="160" className="my-2 h-40 w-40" /><div className="font-mono text-xs font-bold text-navy">{assessment.payment.receiptCode}</div><a href={`/finance/verify/${assessment.payment.receiptToken}`} className="mt-2 text-xs font-bold text-navy underline">Verify preview token →</a></div>}
    </div>}
    {assessment && <p className="mt-4 text-xs font-bold text-amber-900">Ledger-derived indicator: {assessment.ledger.clearance.replaceAll("_", " ")} only. This does not clear the student for any official university service or registration.</p>}
  </section>;
}
