import Link from "next/link";
export default function WhyChoose() {
  const items = [
    ["Academic catalogue", "Explore public programme entries across several subject areas. Ask Registry for current curricula and approval records."],
    ["International outlook", "MIU describes an international perspective in its academic mission. Contact the University for current exchange, language and partnership opportunities."],
    ["Campus information", "Campus-area figures and amenity availability are not verified in this preview. Confirm location, services and access with MIU before making plans."],
    ["Admissions", "Current intake status and entry criteria must be confirmed with Admissions. The Applicant Portal here is only a development preview."],
    ["Fees", "Only Bursary-approved, signed fee schedules are displayed. No estimate or brochure amount is used as a published fee."],
    ["Scholarships", "Current scholarship rates, funded places and eligibility are not configured in this website. Request official terms from MIU."],
  ];
  return <section className="py-8"><div className="container max-w-5xl"><div className="kicker">About MIU Nigeria</div><h1 className="mt-1 text-3xl font-extrabold">Explore Mewar International University Nigeria</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Use this page as a starting point for public University information. Confirm current approvals, services and admissions details from an authoritative MIU source.</p><div className="mt-6 grid gap-4 md:grid-cols-2">{items.map(([title,description])=><article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-navy">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div><div className="mt-6 flex flex-wrap gap-2"><Link href="/programmes" className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white">Explore programmes →</Link><Link href="/contact" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-navy">Contact MIU</Link></div></div></section>;
}
