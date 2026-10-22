"use client";
import { useState } from "react";

type Programme={id:string;title:string;slug:string};
export default function FeeDraftForm({programmes}:{programmes:Programme[]}){
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setStatus("");setBusy(true);
    const target=e.currentTarget;
    const form=new FormData(target);
    const payload={programmeId:form.get("programmeId"),session:form.get("session"),tuition:Number(form.get("tuition")),hostel:Number(form.get("hostel")||0),feeding:Number(form.get("feeding")||0),effectiveFrom:form.get("effectiveFrom")};
    const response=await fetch("/api/fees",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const result=await response.json();setBusy(false);
    if(response.ok){setStatus(`Draft ${result.data.id} saved privately. A Bursar must publish it.`);target.reset();}
    else setStatus(result.error||"Could not save draft.");
  }
  return <form onSubmit={submit} className="bg-slate-50 border border-line rounded-xl p-4 mt-4">
    <h2 className="font-bold text-sm">Create a private fee draft</h2><p className="text-xs text-slate-600 mt-1">Enter figures only from the approved Bursary source document. Saving a draft never publishes it.</p>
    <div className="grid md:grid-cols-3 gap-3 mt-3">
      <label className="text-xs font-semibold">Programme<select name="programmeId" className="block w-full border border-line rounded-lg px-3 py-2 mt-1" required>{programmes.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
      <label className="text-xs font-semibold">Academic session<input name="session" defaultValue="2026/27" pattern="[0-9]{4}/[0-9]{2}" className="block w-full border border-line rounded-lg px-3 py-2 mt-1" required /></label>
      <label className="text-xs font-semibold">Effective from<input name="effectiveFrom" type="date" className="block w-full border border-line rounded-lg px-3 py-2 mt-1" required /></label>
      <label className="text-xs font-semibold">Tuition (₦)<input name="tuition" type="number" min="1" step="1" className="block w-full border border-line rounded-lg px-3 py-2 mt-1" required /></label>
      <label className="text-xs font-semibold">Hostel (₦)<input name="hostel" type="number" min="0" step="1" defaultValue="0" className="block w-full border border-line rounded-lg px-3 py-2 mt-1" /></label>
      <label className="text-xs font-semibold">Feeding (₦)<input name="feeding" type="number" min="0" step="1" defaultValue="0" className="block w-full border border-line rounded-lg px-3 py-2 mt-1" /></label>
    </div>
    <div className="flex flex-wrap items-center gap-3 mt-3"><button disabled={busy} className="bg-navy text-white rounded-full px-4 py-2 text-xs font-bold">{busy?"Saving…":"Save private draft"}</button>{status&&<span role="status" className="text-xs text-slate-700">{status}</span>}</div>
  </form>;
}
