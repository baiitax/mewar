import Link from "next/link";
export default function WhyStudy(){
  return <section className="py-8"><div className="container max-w-5xl">
    <div className="kicker">Why Study @ MIU Nigeria</div><h1 className="mt-1 text-3xl font-extrabold">Explore Mewar International University Nigeria</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">MIU’s public information presents an international academic environment in Nigeria. Confirm current programme approvals, campus services, admissions criteria and intake status directly with the University before making decisions.</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{[
      ["Academic catalogue", "Explore catalogue entries spanning Computing, Sciences, Management and Law. Current approval and curriculum records should be confirmed with Registry."],
      ["International perspective", "The University describes an international perspective in its academic mission. Contact MIU for current exchange, language and mentorship opportunities."],
      ["Campus and student services", "Campus facilities and residential services may change. Confirm availability, accessibility and current operating arrangements with MIU."],
      ["Fees and financial support", "Fee amounts are shown only when Bursary schedules are approved and signed. Current scholarship terms are not configured in this preview."],
    ].map(([title,description])=><article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-navy">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div>
    <div className="mt-6 flex flex-wrap gap-2"><Link href="/programmes" className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white">Explore catalogue →</Link><Link href="/contact" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-navy">Contact MIU</Link></div>
  </div></section>;
}
