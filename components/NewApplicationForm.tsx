"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewApplicationForm({ programmes, sessionLabel }: { programmes: { id: string; title: string; school: string }[]; sessionLabel: string }) {
  const router = useRouter();
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    if (!programmeId) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ programmeId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not create a draft.");
      router.push(`/portal/applications/${payload.id}`);
      router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <div>
    {programmes.length ? <>
      <label htmlFor="new-programme" className="text-sm font-semibold">Programme</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <select id="new-programme" value={programmeId} onChange={e=>setProgrammeId(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
          {programmes.map(programme=><option key={programme.id} value={programme.id}>{programme.title} — {programme.school}</option>)}
        </select>
        <button onClick={start} disabled={busy || !programmeId} className="rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy?"Opening…":"Start a draft →"}</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Preview session: {sessionLabel}. One draft per programme/session.</p>
    </> : <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No programmes are open for this intake. Check back when the Registry opens an approved application window.</div>}
    {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
  </div>;
}
