"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const router = useRouter();
  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect:false });
      if(res?.ok){
        const session:any = await getSession();
        router.push(session?.user?.role === "APPLICANT" ? "/portal" : "/admin");
      } else setErr("Sign-in failed. Check your credentials; repeated failures are temporarily rate-limited.");
    } catch { setErr("Sign-in could not be completed. Please try again."); }
    finally { setLoading(false); }
  }
  return (
    <section className="py-12"><div className="container max-w-[440px]">
      <div className="bg-white border border-line rounded-xl p-6 shadow">
        <div className="kicker">Platform Foundation • Identity</div><h1 className="text-xl font-bold">Sign in to MIU</h1><p className="text-xs text-slate-600 mt-1">Development identity service with role-based access and security audit logging.</p>
        <form onSubmit={onSubmit} className="space-y-3 mt-4">
          <div><label className="text-xs font-semibold" htmlFor="email">Email</label><input id="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full border border-line rounded-xl px-3 py-2 text-sm" required /></div>
          <div><label className="text-xs font-semibold" htmlFor="password">Password</label><input id="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border border-line rounded-xl px-3 py-2 text-sm" required /></div>
          {err && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-xs p-2 rounded-xl">{err}</div>}
          <button disabled={loading} className="w-full bg-navy text-white py-2.5 rounded-full text-sm font-bold">{loading?"Signing in…":"Sign in →"}</button>
        </form>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs mt-4"><b>Preview only:</b> OIDC federation and MFA enrolment require the university’s approved identity-provider configuration. Do not use this preview for real applicant, student, staff or financial data. Rotate secrets and complete security review before production.</div>
        <p className="mt-4 text-sm text-slate-600">Applicant? <a href="/applicant/register" className="font-bold text-navy underline">Create a development-preview account</a>.</p>
      </div>
    </div></section>
  );
}
