import Link from "next/link";
import Image from "next/image";

const all = [
  { slug:"software-engineering", title:"BSc Software Engineering", school:"Computing", dur:"4 Years", badge:"BSc", desc:"Cloud, algorithms, system analysis & design — 26 credits final term." },
  { slug:"cyber-security", title:"BSc Cyber Security", school:"Computing", dur:"4 Years", badge:"BSc", desc:"Cryptography, network, cloud, blockchain & cybercrime management." },
  { slug:"computer-science", title:"BSc Computer Science", school:"Computing", dur:"4 Years", badge:"BSc", desc:"Core CS + French, chemistry & practical physics — broad-based." },
  { slug:"industrial-chemistry", title:"BSc Industrial Chemistry", school:"Sciences", dur:"4 Years", badge:"BSc", desc:"Polymer, petroleum, environmental + 12-wk IT (CHM 399)." },
  { slug:"biotechnology", title:"BSc Biotechnology", school:"Sciences", dur:"4 Years", badge:"BSc", desc:"Health, agriculture & industrial biotech labs." },
  { slug:"physics-with-electronics", title:"BSc Physics with Electronics", school:"Sciences", dur:"4 Years", badge:"BSc", desc:"Advanced physics & electronics for industry & research." },
  { slug:"accounting", title:"BSc Accounting", school:"Management", dur:"4 Years", badge:"BSc", desc:"ACC 111 Intro to Accounting I (3) — 23 credits Sem 1." },
  { slug:"banking-finance", title:"BSc Banking & Finance", school:"Management", dur:"4 Years", badge:"BSc", desc:"International banking & finance exposure." },
  { slug:"economics", title:"BSc Economics", school:"Management", dur:"4 Years", badge:"BSc", desc:"Global economics with policy & quantitative focus." },
  { slug:"public-administration", title:"BSc Public Administration", school:"Management", dur:"4 Years", badge:"BSc", desc:"GST 111, ECO 111, PUB 211 — 4-yr policy & bureaucracy." },
  { slug:"entrepreneurship", title:"BSc Entrepreneurship", school:"Management", dur:"4 Years", badge:"BSc", desc:"PSY 101 Social Psychology — enterprise & start-up incubation." },
  { slug:"law", title:"LLB (Bachelor of Laws)", school:"Law", dur:"5 Years", badge:"LLB", desc:"Nigerian legal system — admission gated pending NUC/CLE." },
];

export default async function ProgrammesPage({ searchParams }: { searchParams: Promise<{ school?: string }>}) {
  const { school: raw } = await searchParams;
  const school = raw?.toLowerCase();
  const filtered = school ? all.filter(p=>p.school.toLowerCase().includes(school) || school.includes(p.school.toLowerCase().slice(0,4))) : all;
  return (
    <section className="py-8"><div className="container">
      <div className="kicker">Academic Offering</div><h1 className="text-2xl font-bold">Programme Catalogue — 12 Listed Entries</h1>
      <p className="text-sm text-slate-600 mt-1 max-w-[720px]">Browse the catalogue and filter by school. Programme accreditation and curriculum references require current Registry confirmation; fee figures appear only after Bursary sign-off.</p>
      <div className="flex gap-2 mt-4 flex-wrap">
        <Link href="/programmes" className={`px-3 py-1.5 rounded-full text-xs font-bold border ${!school ? "bg-navy text-white" : "bg-white"}`}>All (12)</Link>
        {["Computing","Sciences","Management","Law"].map(s=>(
          <Link key={s} href={`/programmes?school=${s.toLowerCase()}`} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${school===s.toLowerCase() ? "bg-navy text-white" : "bg-white"}`}>{s}</Link>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {filtered.map(p=>(
          <Link key={p.slug} href={`/programmes/${p.slug}`} className="bg-white border border-line rounded-xl overflow-hidden shadow hover:shadow-lg transition">
            <div className="h-[140px] relative bg-slate-50"><Image src={(p.school==="Computing"||p.slug.includes("computer")) ? "/assets/students-lab.jpg" : p.slug==="law" ? "/assets/library.jpg" : "/assets/hero-campus.jpg"} alt={p.title} fill className="object-cover" /></div>
            <div className="p-3"><div className="text-[11px] font-bold text-gold uppercase">{p.school} • {p.dur} • {p.badge}</div><h3 className="font-bold text-sm mt-1">{p.title}</h3><p className="text-xs text-slate mt-1">{p.desc}</p><span className="inline-block mt-2 text-xs font-bold text-navy">Syllabus & Apply →</span></div>
          </Link>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-6 text-xs text-amber-900"><b>NUC status:</b> All 12 were NUC-accredited at takeoff (2021). Current session letters per programme are displayed on detail pages — ask Registrar for substantive licence.</div>
    </div></section>
  );
}
