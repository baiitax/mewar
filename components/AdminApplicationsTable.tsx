"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RecordRow = { id: string; appNo: string; session: string; status: string; entryMode: string; name: string; email: string; phone: string | null; programme: { title: string }; submittedAt: string | null; updatedAt: string };
const nextStates: Record<string,string[]> = { SUBMITTED:["UNDER_REVIEW","NEEDS_INFORMATION","OFFERED","NOT_OFFERED"], UNDER_REVIEW:["NEEDS_INFORMATION","OFFERED","NOT_OFFERED"], NEEDS_INFORMATION:["UNDER_REVIEW","OFFERED","NOT_OFFERED"] };
const label = (value: string) => value.split("_").map(word=>word.charAt(0)+word.slice(1).toLowerCase()).join(" ");

export default function AdminApplicationsTable({ rows }: { rows: RecordRow[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<Record<string,string>>({});
  const [internal, setInternal] = useState<Record<string,string>>({});
  const [message, setMessage] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const visible = filter === "ALL" ? rows : rows.filter(row=>row.status===filter);

  async function update(row: RecordRow) {
    const status = target[row.id] || "";
    if (!status) return;
    setBusy(row.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/applications/${row.id}`, { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({ status, note:internal[row.id]||"", applicantMessage:message[row.id]||"" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error||"Could not update status.");
      setNotice(`${row.appNo} moved to ${label(status)}.`); setTarget(current=>({...current,[row.id]:""}));
      setInternal(current=>({...current,[row.id]:""})); setMessage(current=>({...current,[row.id]:""}));
      router.refresh();
    } catch(e:any) { setError(e.message); }
    finally { setBusy(""); }
  }

  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="text-sm text-slate-600">Showing {visible.length} of {rows.length} records (maximum 100 recent).</div><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"><option value="ALL">All statuses</option>{["DRAFT","SUBMITTED","UNDER_REVIEW","NEEDS_INFORMATION","OFFERED","OFFER_ACCEPTED","NOT_OFFERED","WITHDRAWN"].map(status=><option key={status} value={status}>{label(status)}</option>)}</select></div>
    {error&&<div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}{notice&&<div role="status" className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    {!visible.length?<div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No applications match this filter.</div>:<div className="space-y-4">{visible.map(row=><article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold text-navy">{row.programme.title}</h2><p className="mt-1 font-mono text-xs text-slate-500">{row.appNo} · {row.session}</p></div><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-navy">{label(row.status)}</span></div>
      <div className="mt-3 grid gap-1 text-sm text-slate-700 sm:grid-cols-2"><p><b>Applicant:</b> {row.name}</p><p><b>Email:</b> {row.email}</p><p><b>Phone:</b> {row.phone||"—"}</p><p><b>Entry:</b> {label(row.entryMode)}</p><p><b>Submitted:</b> {row.submittedAt?new Date(row.submittedAt).toLocaleString():"Not submitted"}</p><p><b>Updated:</b> {new Date(row.updatedAt).toLocaleString()}</p></div>
      {nextStates[row.status]?.length>0&&<div className="mt-4 border-t border-slate-100 pt-4"><div className="grid gap-3 md:grid-cols-[190px_1fr_1fr_auto] md:items-end"><div><label className="text-xs font-bold" htmlFor={`status-${row.id}`}>Next status</label><select id={`status-${row.id}`} value={target[row.id]||""} onChange={e=>setTarget(current=>({...current,[row.id]:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Choose…</option>{nextStates[row.status].map(status=><option key={status} value={status}>{label(status)}</option>)}</select></div><div><label className="text-xs font-bold" htmlFor={`message-${row.id}`}>Message visible to applicant</label><input id={`message-${row.id}`} value={message[row.id]||""} onChange={e=>setMessage(current=>({...current,[row.id]:e.target.value}))} maxLength={500} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Required for information request or non-offer" /></div><div><label className="text-xs font-bold" htmlFor={`internal-${row.id}`}>Internal audit note</label><input id={`internal-${row.id}`} value={internal[row.id]||""} onChange={e=>setInternal(current=>({...current,[row.id]:e.target.value}))} maxLength={500} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Optional staff-only note" /></div><button onClick={()=>update(row)} disabled={!target[row.id]||busy===row.id} className="rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy===row.id?"Saving…":"Update"}</button></div></div>}
    </article>)}</div>}
  </div>;
}
