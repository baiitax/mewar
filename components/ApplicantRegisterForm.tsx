"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Channel = "email" | "phone";

export default function ApplicantRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [codes, setCodes] = useState<Record<Channel, string>>({ email: "", phone: "" });
  const [verified, setVerified] = useState<Record<Channel, boolean>>({ email: false, phone: false });
  const [sent, setSent] = useState<Record<Channel, boolean>>({ email: false, phone: false });
  const [previewCodes, setPreviewCodes] = useState<Record<Channel, string>>({ email: "", phone: "" });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const identifier = (channel: Channel) => channel === "email" ? email : phone;
  function updateIdentifier(channel: Channel, value: string) {
    setError(""); setMessage("");
    if (channel === "email") setEmail(value); else setPhone(value);
    setVerified(current => ({ ...current, [channel]: false }));
    setSent(current => ({ ...current, [channel]: false }));
    setPreviewCodes(current => ({ ...current, [channel]: "" }));
  }

  async function sendCode(channel: Channel) {
    setError(""); setMessage(""); setBusy(`send-${channel}`);
    try {
      const response = await fetch("/api/applicant/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ channel, identifier: identifier(channel) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not create a verification code.");
      setSent(current => ({ ...current, [channel]: true }));
      setPreviewCodes(current => ({ ...current, [channel]: payload.previewCode || "" }));
      setMessage(payload.message || "Code created.");
    } catch (e: any) { setError(e.message); }
    finally { setBusy(""); }
  }

  async function verifyCode(channel: Channel) {
    setError(""); setMessage(""); setBusy(`verify-${channel}`);
    try {
      const response = await fetch("/api/applicant/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ channel, identifier: identifier(channel), code: codes[channel] }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not verify the code.");
      setVerified(current => ({ ...current, [channel]: true }));
      setMessage(payload.message || "Contact verified.");
    } catch (e: any) { setError(e.message); }
    finally { setBusy(""); }
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (!verified.email || !verified.phone) return setError("Verify both email and phone before creating an account.");
    if (password !== confirm) return setError("The password confirmation does not match.");
    setBusy("register");
    try {
      const response = await fetch("/api/applicant/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, phone, password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Account creation failed.");
      setMessage("Preview account created. Opening sign-in…");
      router.push(payload.next || "/login?registered=1");
    } catch (e: any) { setError(e.message); }
    finally { setBusy(""); }
  }

  return <form onSubmit={createAccount} className="space-y-5">
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2"><label className="text-sm font-semibold" htmlFor="applicant-name">Full name</label><input id="applicant-name" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" autoComplete="name" maxLength={100} required /></div>
      <div>
        <label className="text-sm font-semibold" htmlFor="applicant-email">Email address</label>
        <div className="mt-1 flex gap-2"><input id="applicant-email" value={email} onChange={e=>updateIdentifier("email",e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" type="email" autoComplete="email" maxLength={254} required /><button type="button" onClick={()=>sendCode("email")} disabled={!!busy} className="shrink-0 rounded-xl bg-navy px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy==="send-email"?"Sending…":verified.email?"Verified ✓":"Send code"}</button></div>
        {sent.email && !verified.email && <div className="mt-2 flex gap-2"><input value={codes.email} onChange={e=>setCodes(v=>({...v,email:e.target.value}))} className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-sm tracking-[.2em]" placeholder="6 digits" inputMode="numeric" maxLength={6} aria-label="Email verification code" /><button type="button" onClick={()=>verifyCode("email")} disabled={!!busy} className="rounded-xl border border-navy px-3 py-2 text-xs font-bold text-navy">{busy==="verify-email"?"Checking…":"Verify"}</button></div>}
        {previewCodes.email && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Local test code: <b className="font-mono tracking-widest">{previewCodes.email}</b> · not emailed.</p>}
        {verified.email && <p className="mt-1 text-xs font-semibold text-emerald-700">Email verified for this preview.</p>}
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="applicant-phone">Mobile number</label>
        <div className="mt-1 flex gap-2"><input id="applicant-phone" value={phone} onChange={e=>updateIdentifier("phone",e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" type="tel" autoComplete="tel" maxLength={40} placeholder="080… or +234…" required /><button type="button" onClick={()=>sendCode("phone")} disabled={!!busy} className="shrink-0 rounded-xl bg-navy px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy==="send-phone"?"Sending…":verified.phone?"Verified ✓":"Send code"}</button></div>
        {sent.phone && !verified.phone && <div className="mt-2 flex gap-2"><input value={codes.phone} onChange={e=>setCodes(v=>({...v,phone:e.target.value}))} className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-sm tracking-[.2em]" placeholder="6 digits" inputMode="numeric" maxLength={6} aria-label="Phone verification code" /><button type="button" onClick={()=>verifyCode("phone")} disabled={!!busy} className="rounded-xl border border-navy px-3 py-2 text-xs font-bold text-navy">{busy==="verify-phone"?"Checking…":"Verify"}</button></div>}
        {previewCodes.phone && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Local test code: <b className="font-mono tracking-widest">{previewCodes.phone}</b> · not sent by SMS.</p>}
        {verified.phone && <p className="mt-1 text-xs font-semibold text-emerald-700">Phone verified for this preview.</p>}
      </div>
      <div><label className="text-sm font-semibold" htmlFor="applicant-password">Password</label><input id="applicant-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><p className="mt-1 text-xs text-slate-500">At least 12 characters.</p></div>
      <div><label className="text-sm font-semibold" htmlFor="applicant-confirm">Confirm password</label><input id="applicant-confirm" value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></div>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {message && !error && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
    <button disabled={!!busy || !verified.email || !verified.phone} className="w-full rounded-full bg-gold px-5 py-3 font-bold text-navy disabled:cursor-not-allowed disabled:opacity-50">{busy==="register"?"Creating account…":"Create preview account →"}</button>
    <p className="text-xs leading-5 text-slate-500">Account creation is a development simulation. Codes are shown in this page; no email or SMS is delivered. Use synthetic test data only.</p>
  </form>;
}
