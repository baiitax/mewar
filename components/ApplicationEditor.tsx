"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Programme = { id: string; title: string; school: string };
type Subject = { subject: string; grade: string };
type InitialApplication = {
  id: string; appNo: string; session: string; status: string; entryMode: string;
  programmeId: string; fullName: string; email: string; phone: string;
  dateOfBirth: string; gender: string; stateOfOrigin: string; nationality: string;
  jambRegNo: string; jambScore: string | number; olevel: Subject[];
};
type Event = { id: string; fromStatus: string | null; toStatus: string; applicantMessage: string | null; createdAt: string };
type CheckResult = { ok: boolean; text: string };

const documents = [
  { key: "OLE_LEVEL_RESULT", label: "O’level result", detail: "Illustrative checklist item" },
  { key: "JAMB_RESULT", label: "JAMB result", detail: "Illustrative checklist item" },
  { key: "PASSPORT_PHOTO", label: "Passport photograph", detail: "Illustrative checklist item" },
  { key: "OTHER", label: "Other supporting file", detail: "Optional preview check" },
];
const grades = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];
const pretty = (value: string) => value.split("_").map(word=>word.charAt(0)+word.slice(1).toLowerCase()).join(" ");

export default function ApplicationEditor({ initial, programmes, events }: { initial: InitialApplication; programmes: Programme[]; events: Event[] }) {
  const router = useRouter();
  const [form, setForm] = useState<InitialApplication>(initial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checks, setChecks] = useState<Record<string, CheckResult>>({});
  const editable = ["DRAFT", "NEEDS_INFORMATION"].includes(initial.status);

  function change<K extends keyof InitialApplication>(key: K, value: InitialApplication[K]) {
    setForm(current=>({ ...current, [key]: value }));
  }
  function setSubject(index: number, key: keyof Subject, value: string) {
    setForm(current=>({ ...current, olevel: current.olevel.map((row,i)=>i===index?{...row,[key]:value}:row) }));
  }
  function addSubject() { setForm(current=>({...current,olevel:[...current.olevel,{subject:"",grade:""}]})); }
  function removeSubject(index: number) { setForm(current=>({...current,olevel:current.olevel.filter((_,i)=>i!==index)})); }

  async function save(action: "save" | "submit") {
    if (action === "submit" && !window.confirm("Submit this synthetic preview record? This does not send an application to MIU or make an admissions decision.")) return;
    setBusy(action); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/applications/${initial.id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save this application.");
      if (action === "submit") { router.push("/portal"); router.refresh(); }
      else { setMessage(payload.message || "Draft saved."); router.refresh(); }
    } catch (e: any) { setError(e.message); }
    finally { setBusy(""); }
  }

  async function validateFile(category: string, file?: File) {
    if (!file) return;
    setChecks(current=>({...current,[category]:{ok:false,text:"Checking file signature…"}}));
    const body = new FormData(); body.append("file", file); body.append("category", category);
    try {
      const response = await fetch(`/api/applications/${initial.id}/documents/validate`, { method: "POST", body });
      const payload = await response.json();
      setChecks(current=>({...current,[category]:{ok:response.ok,text:response.ok ? `${payload.format.toUpperCase()} format check passed (${Math.ceil(payload.bytes/1024)} KB). File discarded; no malware scan.` : payload.error || "File check failed."}}));
    } catch { setChecks(current=>({...current,[category]:{ok:false,text:"Could not run the preview file check."}})); }
  }

  return <div className="space-y-5">
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>Development preview · test data only.</b><p className="mt-1 text-xs leading-5">This is not an approved intake and no record is delivered to MIU Admissions. Do not enter real personal information or select real documents. The field checks below are not eligibility decisions.</p></div>
    {!editable && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><b>Read-only record:</b> this application is {pretty(initial.status)}. Applicant details can no longer be edited here.</div>}
    {initial.status === "NEEDS_INFORMATION" && events.filter(event=>event.applicantMessage).map(event=><div key={event.id} className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950"><b>Message from Admissions · {new Date(event.createdAt).toLocaleDateString()}</b><p className="mt-1">{event.applicantMessage}</p></div>)}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white">1</span><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Applicant profile</p><h2 className="text-lg font-bold">Personal details</h2></div></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="text-sm font-semibold">Full name</label><input value={form.fullName} onChange={e=>change("fullName",e.target.value)} disabled={!editable} maxLength={100} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100" /></div>
        <div><label className="text-sm font-semibold">Verified email</label><input value={form.email} readOnly className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></div>
        <div><label className="text-sm font-semibold">Verified phone</label><input value={form.phone} readOnly className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></div>
        <div><label className="text-sm font-semibold" htmlFor="dob">Date of birth</label><input id="dob" type="date" value={form.dateOfBirth} onChange={e=>change("dateOfBirth",e.target.value)} disabled={!editable} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100" /></div>
        <div><label className="text-sm font-semibold" htmlFor="gender">Gender <span className="font-normal text-slate-400">(optional)</span></label><select id="gender" value={form.gender} onChange={e=>change("gender",e.target.value)} disabled={!editable} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"><option value="">Prefer not to specify</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></div>
        <div><label className="text-sm font-semibold" htmlFor="state-origin">State of origin</label><input id="state-origin" value={form.stateOfOrigin} onChange={e=>change("stateOfOrigin",e.target.value)} disabled={!editable} maxLength={60} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100" placeholder="e.g. FCT" /></div>
        <div><label className="text-sm font-semibold" htmlFor="nationality">Nationality</label><input id="nationality" value={form.nationality} onChange={e=>change("nationality",e.target.value)} disabled={!editable} maxLength={60} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100" /></div>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white">2</span><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Academic record</p><h2 className="text-lg font-bold">Programme & entry details</h2></div></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="text-sm font-semibold" htmlFor="programme">Programme choice</label><select id="programme" value={form.programmeId} onChange={e=>change("programmeId",e.target.value)} disabled={!editable || !programmes.some(item=>item.id===form.programmeId)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100">{programmes.map(p=><option key={p.id} value={p.id}>{p.title} — {p.school}</option>)}{!programmes.some(item=>item.id===form.programmeId)&&<option value={form.programmeId}>{initial.programmeId} (closed to new choices)</option>}</select></div>
        <div><label className="text-sm font-semibold" htmlFor="entry-mode">Entry route</label><select id="entry-mode" value={form.entryMode} onChange={e=>change("entryMode",e.target.value)} disabled={!editable} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"><option value="UTME">UTME</option><option value="DIRECT_ENTRY">Direct Entry</option><option value="INTERNATIONAL">International</option></select></div>
        {form.entryMode !== "INTERNATIONAL" && <div><label className="text-sm font-semibold" htmlFor="jamb-reg">JAMB registration number</label><input id="jamb-reg" value={form.jambRegNo} onChange={e=>change("jambRegNo",e.target.value.toUpperCase())} disabled={!editable} autoComplete="off" maxLength={24} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100" placeholder="Synthetic test value only" /><p className="mt-1 text-xs text-slate-500">Encrypted in the preview database; deduplicated by a keyed hash.</p></div>}
        {form.entryMode === "UTME" && <div><label className="text-sm font-semibold" htmlFor="jamb-score">JAMB score</label><input id="jamb-score" type="number" min={0} max={400} value={form.jambScore} onChange={e=>change("jambScore",e.target.value)} disabled={!editable} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100" /></div>}
      </div>
      <div className="mt-6 border-t border-slate-100 pt-5"><div className="flex items-end justify-between gap-2"><div><h3 className="font-bold text-navy">O’level subjects</h3><p className="text-xs text-slate-500">Generic preview entry only; the official checklist is not configured.</p></div>{editable&&form.olevel.length<10&&<button type="button" onClick={addSubject} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-navy">+ Add subject</button>}</div>
        <div className="mt-3 space-y-2">{form.olevel.length===0&&<p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No subjects entered yet.</p>}{form.olevel.map((row,index)=><div key={index} className="grid grid-cols-[1fr_100px_auto] gap-2"><input aria-label={`Subject ${index+1}`} value={row.subject} onChange={e=>setSubject(index,"subject",e.target.value)} disabled={!editable} maxLength={80} placeholder="Subject" className="min-w-0 rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" /><select aria-label={`Grade for subject ${index+1}`} value={row.grade} onChange={e=>setSubject(index,"grade",e.target.value)} disabled={!editable} className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm disabled:bg-slate-100"><option value="">Grade</option>{grades.map(grade=><option key={grade}>{grade}</option>)}</select>{editable&&<button type="button" onClick={()=>removeSubject(index)} aria-label="Remove subject" className="rounded-lg border border-slate-200 px-3 text-sm text-slate-500">×</button>}</div>)}</div>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white">3</span><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Document checks</p><h2 className="text-lg font-bold">Illustrative checklist</h2></div></div>
      <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs leading-5 text-orange-950"><b>No secure document service is connected.</b> These labels are examples, not MIU’s approved checklist. Each selected file is inspected in memory, then discarded. No antivirus scan runs; no file is uploaded to durable storage. Do not use real documents.</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{documents.map(doc=><div key={doc.key} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-navy">{doc.label}</p><p className="text-xs text-slate-500">{doc.detail}</p></div>{editable&&<label className="cursor-pointer rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-navy">Check file<input type="file" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" className="sr-only" onChange={e=>{const file=e.currentTarget.files?.[0];void validateFile(doc.key,file);e.currentTarget.value="";}} /></label>}</div>{checks[doc.key]&&<p className={`mt-3 rounded-lg p-2 text-xs ${checks[doc.key].ok?"bg-emerald-50 text-emerald-800":"bg-slate-100 text-slate-700"}`}>{checks[doc.key].text}</p>}</div>)}</div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white">4</span><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Review</p><h2 className="text-lg font-bold">Save or submit preview</h2></div></div>
      <p className="mt-3 text-sm leading-6 text-slate-600">Submission checks only that basic test fields are present. It does not assess entry qualifications, validate a JAMB record against CAPS, transfer documents, or trigger an admissions decision.</p>
      {error&&<div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}{message&&<div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
      {editable&&<div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={()=>save("save")} disabled={!!busy} className="rounded-full border border-navy px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-50">{busy==="save"?"Saving…":"Save draft"}</button><button type="button" onClick={()=>save("submit")} disabled={!!busy} className="rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy==="submit"?"Submitting…":"Submit synthetic preview →"}</button></div>}
    </section>

    {events.length>0&&<section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-navy">Status history</h2><ol className="mt-3 space-y-3">{events.map(event=><li key={event.id} className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500"/><div className="text-sm"><p className="font-semibold text-navy">{pretty(event.toStatus)} <span className="font-normal text-slate-400">· {new Date(event.createdAt).toLocaleString()}</span></p>{event.applicantMessage&&<p className="mt-1 text-slate-600">{event.applicantMessage}</p>}</div></li>)}</ol></section>}
  </div>;
}
