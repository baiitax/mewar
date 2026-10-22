"use client";

import { useState, type FormEvent } from "react";

type Status = "OPEN" | "OWNER_ASSIGNED" | "IN_PROGRESS" | "READY_FOR_REVIEW" | "BLOCKED";
type Entry = {
  id: string | null;
  accountableOwnerLabel: string | null;
  ownerOffice: string | null;
  ownerRole: string | null;
  status: Status;
  decisionSummary: string | null;
  evidenceReference: string | null;
  updatedAt: string | null;
};
type Decision = {
  code: string;
  title: string;
  authority: string;
  prompt: string;
  evidence: string;
  entry: Entry;
};

export default function GovernanceRegister({ decisions }: { decisions: Decision[] }) {
  const [rows, setRows] = useState(decisions);
  const tracked = rows.filter(row => row.entry.status !== "OPEN").length;
  const ready = rows.filter(row => row.entry.status === "READY_FOR_REVIEW").length;

  function saveRow(code: string, entry: Entry) {
    setRows(current => current.map(row => row.code === code ? { ...row, entry } : row));
  }

  return <>
    <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>Development-only tracking utility — not an MIU approval system.</b><p className="mt-1 text-xs leading-5">Use fictional SYNTHETIC/TEST labels only. Do not enter real staff names, applicant data, credentials, policy text, URLs or confidential documents. This tool has no e-signature, identity proof, institutional authority or production effect. Use MIU's approved records system for actual decisions.</p></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Decision prompts</div><div className="mt-1 text-2xl font-extrabold text-navy">{rows.length}</div><div className="text-xs text-slate-500">D-01 through D-11</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Tracked in preview</div><div className="mt-1 text-2xl font-extrabold text-navy">{tracked}</div><div className="text-xs text-slate-500">Owner assigned or work started</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Ready for authority review</div><div className="mt-1 text-2xl font-extrabold text-navy">{ready}</div><div className="text-xs text-slate-500">Not approved; no gate is unlocked</div></div></div>
    <div className="mt-6 space-y-4">{rows.map(decision => <DecisionCard key={decision.code} decision={decision} onSave={saveRow} />)}</div>
    <p className="mt-5 text-xs text-slate-500">The register records only preview tracking state and an internal reference string. It cannot verify documents, record an approval/signature or change production readiness flags.</p>
  </>;
}

function DecisionCard({ decision, onSave }: { decision: Decision; onSave: (code: string, entry: Entry) => void }) {
  const [entry, setEntry] = useState(decision.entry);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/governance/${decision.code}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save preview tracking.");
      const saved: Entry = { ...entry, ...payload.data, updatedAt: payload.data.updatedAt };
      setEntry(saved);
      onSave(decision.code, saved);
      setMessage("Preview tracking saved. No MIU approval or release status was recorded.");
    } catch (reason: any) {
      setError(reason.message || "Could not save preview tracking.");
    } finally { setBusy(false); }
  }

  function update(field: keyof Entry, value: string) {
    setEntry(current => ({ ...current, [field]: value || null }));
  }

  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="kicker">{decision.code} · MIU decision required</div><h2 className="mt-1 text-lg font-bold">{decision.title}</h2><p className="mt-1 text-xs text-slate-500">Proposed authority: {decision.authority}</p></div><span className={`badge ${entry.status === "BLOCKED" ? "bg-red-50 text-red-800" : entry.status === "READY_FOR_REVIEW" ? "bg-blue-50 text-blue-800" : "bg-slate-50 text-slate-700"}`}>{entry.status.replaceAll("_", " ")}</span></div>
    <p className="mt-3 text-sm text-slate-700">{decision.prompt}</p>
    <p className="mt-2 text-xs text-slate-500"><b>Evidence expected (reference only):</b> {decision.evidence}</p>

    <form onSubmit={submit} className="mt-4 border-t border-slate-200 pt-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs font-semibold text-slate-700">Synthetic owner label<input maxLength={120} value={entry.accountableOwnerLabel || ""} onChange={event => update("accountableOwnerLabel", event.target.value)} placeholder="SYNTHETIC: Owner label" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-700">Accountable office<input maxLength={120} value={entry.ownerOffice || ""} onChange={event => update("ownerOffice", event.target.value)} placeholder="e.g. Synthetic Registry Unit" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-700">Owner role<input maxLength={120} value={entry.ownerRole || ""} onChange={event => update("ownerRole", event.target.value)} placeholder="e.g. Policy owner" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr]">
        <label className="text-xs font-semibold text-slate-700">Tracking state<select value={entry.status} onChange={event => update("status", event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"><option value="OPEN">Open</option><option value="OWNER_ASSIGNED">Owner assigned</option><option value="IN_PROGRESS">In progress</option><option value="READY_FOR_REVIEW">Ready for authority review</option><option value="BLOCKED">Blocked</option></select></label>
        <label className="text-xs font-semibold text-slate-700">Synthetic tracking note<textarea maxLength={1200} rows={2} value={entry.decisionSummary || ""} onChange={event => update("decisionSummary", event.target.value)} placeholder="SYNTHETIC: short status note only; no real policy text." className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
      </div>
      <label className="mt-3 block text-xs font-semibold text-slate-700">Internal evidence reference (no URL or attachment)<input maxLength={180} value={entry.evidenceReference || ""} onChange={event => update("evidenceReference", event.target.value)} placeholder="e.g. TEST-REF-001" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800">{error}</p>}
      {message && <p role="status" className="mt-3 rounded-lg bg-green-50 p-2 text-xs text-green-900">{message}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] text-slate-500">{entry.updatedAt ? `Last preview update: ${new Date(entry.updatedAt).toLocaleString("en-NG")}` : "Not yet updated"}</span><button type="submit" disabled={busy} className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save preview tracking"}</button></div>
    </form>
  </article>;
}
