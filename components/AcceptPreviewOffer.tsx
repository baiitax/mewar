"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type PreviewRecord = { previewStudentId: string; enrollmentSession: string | null; curriculumStatus: string; officialMatricNo: string | null };

export default function AcceptPreviewOffer({ applicationId, status, initialRecord }: { applicationId: string; status: string; initialRecord: PreviewRecord | null }) {
  const router = useRouter();
  const [record, setRecord] = useState(initialRecord);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(status === "OFFER_ACCEPTED");

  if (status !== "OFFERED" && status !== "OFFER_ACCEPTED") return null;

  async function accept() {
    if (!window.confirm("Accept this development-preview offer? This creates a synthetic local record only; it does not accept a real MIU offer or create a live student account.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/applications/${applicationId}/accept-offer`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Preview offer could not be accepted.");
      setRecord(payload.data);
      setAccepted(true);
      setMessage(payload.message || "Preview student record created.");
      router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <section className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 md:p-6">
    <div className="kicker">Phase 4 · Student records preview</div>
    <h2 className="mt-1 text-lg font-bold text-amber-950">{accepted ? "Preview offer accepted" : "Preview offer decision"}</h2>
    <p className="mt-2 text-sm leading-6 text-amber-950">This is a synthetic workflow test, not a University offer or admission decision. Acceptance creates a local test student ID only. It does not assign an official matriculation number, enrol in courses, change your applicant role, or provision the Student Portal, SIS or LMS.</p>
    {record ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-amber-200 bg-white p-3"><div className="text-xs text-slate-500">Preview student ID</div><div className="mt-1 font-mono text-sm font-bold text-navy">{record.previewStudentId}</div></div><div className="rounded-xl border border-amber-200 bg-white p-3"><div className="text-xs text-slate-500">Academic session</div><div className="mt-1 text-sm font-bold text-navy">{record.enrollmentSession || "Not configured"}</div></div><div className="rounded-xl border border-amber-200 bg-white p-3"><div className="text-xs text-slate-500">Curriculum readiness</div><div className="mt-1 text-sm font-bold text-navy">{record.curriculumStatus}</div></div></div> : accepted ? <p className="mt-3 rounded-xl bg-white p-3 text-sm text-amber-950">The application is marked accepted but has no linked preview student record. Contact Registry for a restricted reconciliation.</p> : <button type="button" onClick={accept} disabled={busy} className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Creating preview record…" : "Accept preview offer →"}</button>}
    {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-white p-3 text-sm text-red-800">{error}</p>}
    {message && !error && <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 text-sm text-emerald-800">{message}</p>}
  </section>;
}
