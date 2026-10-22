import Link from "next/link";
export default function RequirementsPage(){
  return <section className="py-8"><div className="container max-w-5xl">
    <div className="kicker">Admissions · Registry source</div><h1 className="mt-1 text-3xl font-extrabold">Entry requirements information</h1>
    <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>Current thresholds are not verified in this preview.</b><p className="mt-1 text-xs leading-5">Do not rely on historic JAMB cut-offs, subject grades, scholarship terms or programme requirements shown in old material. Ask MIU Admissions/Registry for the approved criteria and effective session before applying.</p></div>
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5"><span className="badge bg-navy text-white">UTME</span><h2 className="mt-2 font-bold">UTME route</h2><p className="mt-2 text-sm text-slate-600">Confirm the session’s JAMB score, subject combination and O-level requirements for your selected programme with Admissions.</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5"><span className="badge">Direct Entry</span><h2 className="mt-2 font-bold">Direct Entry route</h2><p className="mt-2 text-sm text-slate-600">Accepted qualifications, placement level and required supporting records must be confirmed against the current approved rules.</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5"><span className="badge bg-gold/20">International</span><h2 className="mt-2 font-bold">International route</h2><p className="mt-2 text-sm text-slate-600">Contact Admissions for current certificate-equivalency, documentation and immigration guidance.</p></article>
    </div>
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-bold text-navy">Programme-specific and scholarship conditions</h2><p className="mt-2 text-sm leading-6 text-slate-600">The preview does not contain an approved subject-grade matrix or scholarship eligibility schedule. No automated eligibility decision is made by the applicant portal.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/contact" className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white">Contact Admissions →</Link><Link href="/admissions/apply" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-navy">Applicant Portal preview</Link></div></div>
  </div></section>;
}
