"use client";
import { useState } from "react";
export default function FeePublishControl({id}:{id:string}){
  const [signature,setSignature]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  async function publish(){
    setBusy(true);setStatus("");
    const response=await fetch(`/api/fees/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({signature,confirm:confirmed})});
    const result=await response.json();setBusy(false);
    if(response.ok){setStatus("Published and signed. Refreshing…");window.location.reload();}
    else setStatus(result.error||"Could not publish schedule.");
  }
  return <div className="min-w-[230px]">
    <input aria-label="Bursary signatory name" value={signature} onChange={e=>setSignature(e.target.value)} placeholder="Bursary signatory name" className="w-full border border-line rounded-lg px-2 py-1.5 text-xs" />
    <label className="flex gap-2 items-start text-[11px] mt-2"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-0.5" /><span>I confirm this draft matches the authorised Bursary schedule.</span></label>
    <button onClick={publish} disabled={busy||!confirmed||signature.trim().length<3} className="mt-2 bg-gold text-navy rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-50">{busy?"Publishing…":"Sign & publish"}</button>
    {status&&<div role="status" className="text-[11px] mt-1 text-slate-700">{status}</div>}
  </div>;
}
