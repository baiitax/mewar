import Link from "next/link";
import Image from "next/image";
const news = [
  { slug:"2026-matriculation", date:"25 Feb 2026", cat:"Matriculation", title:"2026 Matriculation Ceremony: A New Chapter Begins", desc:"Amidst academic regalia and vibrant atmosphere, the University formally inducted fresh students. Rich traditions reaffirmed.", img:"/assets/hero-campus.jpg" },
  { slug:"license-accreditation", date:"8 Apr 2021", cat:"NUC", title:"License Accreditation Ceremony by Nigerian Government", desc:"At NUC HQ, Minister Chukwuemeka Nwajiuba & NUC ES Abubakar Rasheed present licence — making MIU the first Indian University in Africa.", img:"/assets/library.jpg" },
  { slug:"matriculation-shift", date:"22 Apr 2024", cat:"Registry", title:"Matriculation Ceremony Shift Notice", desc:"Earlier 25 Apr → shifted to Saturday 27 Apr by 10:00 prompt. Inconveniences regretted — Registrar.", img:"/assets/students-lab.jpg" },
  { slug:"scholarship-results-portal", date:"1 Mar 2022", cat:"Admissions", title:"Results Portal Launched for Special Scholarship Scheme", desc:"Directorate launches dedicated results portal for scholarship examinations — also shared via personal email.", img:"/assets/hero-campus.jpg" },
  { slug:"academic-calendar-2021", date:"1 Nov 2021", cat:"Academics", title:"Academic Calendar 2021 — Trimester Launch", desc:"Deadline 6 Nov, Orientation 8–12 Nov, Commencement 15 Nov onwards — 3 trimesters.", img:"/assets/library.jpg" },
];
export default function NewsPage(){
  return (
    <section className="py-8"><div className="container">
      <div className="kicker">News & Events</div><h1 className="text-2xl font-bold">What’s Happening at MIU</h1>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {news.map(n=>(
          <Link key={n.slug} href={`/news/${n.slug}`} className="bg-white border border-line rounded-xl overflow-hidden flex gap-3 p-3 hover:shadow">
            <div className="w-[110px] h-[78px] relative shrink-0 rounded-xl overflow-hidden border border-line"><Image src={n.img} alt={n.title} fill className="object-cover" /></div>
            <div><div className="text-[11px] font-bold text-gold uppercase">{n.date} • {n.cat}</div><div className="font-bold text-sm leading-tight">{n.title}</div><div className="text-xs text-slate mt-1">{n.desc}</div></div>
          </Link>
        ))}
      </div>
    </div></section>
  );
}
