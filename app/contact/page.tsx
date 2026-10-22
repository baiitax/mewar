import Link from "next/link";
export default function ContactPage(){
  return <section className="py-8"><div className="container max-w-5xl">
    <div className="kicker">Get in touch</div><h1 className="mt-1 text-3xl font-extrabold">Contact MIU Nigeria</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Please call ahead to confirm office availability, current admissions information and campus visit arrangements. Current staff/counsellor assignments are not verified in this preview.</p>
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="font-bold">Address</div><p className="mt-2 text-sm">KM 21 Abuja–Keffi Expressway<br/>Towards Masaka, Nasarawa State</p><p className="mt-2 text-xs text-slate-500">Campus-area figures and visitor arrangements are pending current confirmation.</p><a href="https://maps.google.com/?q=KM+21+Abuja+Keffi+Road+Masaka" target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold">Open map →</a></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="font-bold">Phone</div><a href="tel:+2348183012911" className="mt-2 inline-block text-lg font-extrabold">+234 818 301 2911</a><p className="mt-2 text-xs text-slate-500">Call ahead to confirm availability and request the appropriate University office.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="font-bold">Email</div><p className="mt-2 text-sm"><a href="mailto:info@miu.edu.ng" className="underline">info@miu.edu.ng</a><br/><a href="mailto:admission@miu.edu.ng" className="underline">admission@miu.edu.ng</a></p><p className="mt-2 text-xs text-slate-500">Ask to be routed to Admissions, Bursary, Registry or the privacy contact.</p></div>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-950">Enquiry form is not connected</h2><p className="mt-2 text-sm leading-6 text-amber-900">This preview does not collect general enquiries and has no approved privacy notice. Do not send personal, JAMB, identity or financial information through this website. Contact MIU using the published channels above.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-bold text-navy">Current Admissions contacts</h2><p className="mt-2 text-sm leading-6 text-slate-600">A verified counsellor roster and production messaging workflow were not supplied for this build. Please contact MIU’s general Admissions address or phone and ask for the current official contact.</p><Link href="/admissions/apply" className="mt-3 inline-block rounded-full bg-navy px-4 py-2 text-sm font-bold text-white">Applicant Portal preview →</Link></div>
    </div>
  </div></section>;
}
