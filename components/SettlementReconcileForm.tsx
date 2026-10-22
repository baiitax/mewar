"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type PaymentOption = { providerReference: string; amount: number; currency: string; studentId: string };

export default function SettlementReconcileForm({ payments }: { payments: PaymentOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [batchReference, setBatchReference] = useState("");
  const [reportedAmount, setReportedAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedPayments = useMemo(() => payments.filter(payment => selected.includes(payment.providerReference)), [payments, selected]);
  const matchedAmount = selectedPayments.reduce((sum, payment) => sum + payment.amount, 0);

  function toggle(reference: string) {
    setSelected(current => current.includes(reference) ? current.filter(item => item !== reference) : [...current, reference]);
  }

  async function reconcile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ providerBatchReference: batchReference, reportedAmount: Number(reportedAmount), providerReferences: selected }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not reconcile preview settlement.");
      setMessage(`${payload.data.status}: ${payload.data.paymentCount} synthetic payment(s), reported ${payload.data.currency} ${Number(payload.data.reportedAmount).toLocaleString("en-NG")}, matched ${Number(payload.data.matchedAmount).toLocaleString("en-NG")}.`);
      setSelected([]); setReportedAmount(""); setBatchReference("");
      router.refresh();
    } catch (reason: any) {
      setError(reason.message || "Could not reconcile preview settlement.");
    } finally { setBusy(false); }
  }

  return <form onSubmit={reconcile} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Synthetic provider batch reference<input required minLength={4} maxLength={120} value={batchReference} onChange={event => setBatchReference(event.target.value)} placeholder="MIU-TEST-BATCH-001" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" /></label><label className="text-xs font-semibold text-slate-700">Reported settlement amount (NGN)<input required type="number" min="1" step="1" value={reportedAmount} onChange={event => setReportedAmount(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" /></label></div>
    <div className="mt-4"><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-xs text-slate-700">Unreconciled synthetic payment events</b><button type="button" disabled={!selected.length} onClick={() => setReportedAmount(String(matchedAmount))} className="text-xs font-bold text-navy underline disabled:opacity-40">Use selected total: NGN {matchedAmount.toLocaleString("en-NG")}</button></div>
      {!payments.length ? <p className="mt-2 text-xs text-slate-500">No synthetic payment events are awaiting reconciliation.</p> : <div className="mt-2 max-h-64 space-y-2 overflow-auto">{payments.map(payment=><label key={payment.providerReference} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs"><input type="checkbox" checked={selected.includes(payment.providerReference)} onChange={() => toggle(payment.providerReference)} className="mt-0.5" /><span className="min-w-0 flex-1"><span className="block break-all font-mono font-semibold text-navy">{payment.providerReference}</span><span className="text-slate-500">{payment.studentId} · {payment.currency} {payment.amount.toLocaleString("en-NG")}</span></span></label>)}</div>}
    </div>
    {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800">{error}</p>}
    {message && <p role="status" className="mt-3 rounded-lg bg-green-50 p-2 text-xs text-green-900">{message}</p>}
    <button type="submit" disabled={busy || !selected.length || !reportedAmount} className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Reconciling…" : "Record synthetic reconciliation"}</button>
    <p className="mt-2 text-[11px] leading-4 text-slate-500">This records only a test comparison. It does not query a provider, bank, or settlement file and cannot alter payment ledger entries.</p>
  </form>;
}
