import Link from "next/link";
export default function AdmissionsPage(){
  return <>
    <section className="bg-navy py-8 text-white"><div className="container">
      <div className="inline-flex rounded-full border border-gold/40 bg-gold/20 px-3 py-1 text-xs font-semibold">Admissions information · confirm current details with Registry</div>
      <h1 className="mt-3 font-jakarta text-[28px] font-extrabold leading-tight">Admissions pathways and current status</h1>
      <p className="mt-2 max-w-[700px] text-sm text-white/90">This public preview does not confirm an active intake or publish current entry thresholds. Verify programme approvals, JAMB/UTME requirements, official checklist, signed fees and dates directly with MIU before making decisions.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/admissions/apply" className="rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy">Applicant Portal preview →</Link><Link href="/admissions/requirements" className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white">Requirements information</Link></div>
    </div></section>
    <section className="py-8"><div className="container">
      <h2 className="text-xl font-bold">Admission pathways</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4"><span className="badge bg-navy text-white">UTME</span><h3 className="mt-2 font-bold">UTME entry</h3><p className="mt-1 text-xs text-slate">Current JAMB score thresholds and subject combinations are not configured in this preview. Confirm the active session’s official criteria with Admissions.</p><Link href="/admissions/jamb" className="mt-2 inline-block text-xs font-bold text-navy">JAMB information →</Link></div>
        <div className="rounded-xl border border-line bg-white p-4"><span className="badge">Direct Entry</span><h3 className="mt-2 font-bold">Direct Entry</h3><p className="text-xs text-slate">Accepted qualifications, advanced-level placement and subject requirements depend on the approved current-session rules. Request the official version from Registry.</p></div>
        <div className="rounded-xl border border-line bg-white p-4"><span className="badge bg-gold/20">International</span><h3 className="mt-2 font-bold">International applicants</h3><p className="text-xs text-slate">Contact Admissions for current equivalency, documentation and immigration guidance. The preview does not determine eligibility.</p></div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link href="/admissions/why-study" className="rounded-xl border border-line bg-white p-4"><h3 className="font-bold">Why Study @ MIU Nigeria?</h3><p className="text-xs text-slate">Explore the University’s academic profile and campus information; confirm current services directly with MIU.</p></Link>
        <Link href="/programmes" className="rounded-xl border border-line bg-white p-4"><h3 className="font-bold">Programme catalogue</h3><p className="text-xs text-slate">Browse catalogue entries. Current NUC/CLE status and approved curriculum should be confirmed with Registry.</p></Link>
        <Link href="/admissions/fees" className="rounded-xl border border-line bg-white p-4"><h3 className="font-bold">Fees · Bursary source of truth</h3><p className="text-xs text-slate">Only published, Bursary-signed schedules appear here; no estimates are shown.</p></Link>
        <Link href="/admissions/scholarships" className="rounded-xl border border-line bg-white p-4"><h3 className="font-bold">Scholarships and bursaries</h3><p className="text-xs text-slate">Current awards, eligibility and availability must be confirmed by the University; no active award schedule is configured in this preview.</p></Link>
      </div>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"><b>JAMB CAPS:</b> This site does not connect to JAMB CAPS. Applicants should use the official JAMB e-Facility and contact MIU for the University’s current process.</div>
    </div></section>
  </>;
}
