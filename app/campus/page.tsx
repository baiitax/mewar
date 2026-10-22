import Link from "next/link";
import Image from "next/image";
export default function CampusPage(){
  return (
    <>
      <section className="relative bg-navy text-white py-8">
        <div className="absolute inset-0 opacity-30"><Image src="/assets/hero-campus.jpg" alt="Campus" fill className="object-cover" /></div><div className="absolute inset-0 bg-gradient-to-br from-navy/80 via-navy/50 to-transparent" />
        <div className="container relative"><div className="inline-flex bg-gold/20 border border-gold/40 px-3 py-1 rounded-full text-xs font-semibold">Life @ MIU</div><h1 className="font-jakarta font-extrabold text-[28px] mt-3">A Campus Built for <span className="text-gold">Learning & Living</span></h1><p className="text-white/90 max-w-[600px] mt-2 text-sm">Located at KM 21 Abuja–Keffi Expressway, Masaka, Nasarawa State. Campus size and listed facility operating status require current Estates verification.</p></div>
      </section>
      <section className="py-8"><div className="container grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold">Academic Facilities</h3><p className="text-xs text-slate mt-1">The items below are described in public MIU materials; current availability and access conditions should be confirmed with the University.</p><ul className="text-sm mt-2 list-disc pl-5 space-y-1"><li>Classrooms and laboratories</li><li>Central Library and restricted e-learning service</li><li>Language learning, research and innovation activities</li><li>Central Mosque and student support</li></ul><div className="relative h-[180px] rounded-xl overflow-hidden border border-line mt-3"><Image src="/assets/library.jpg" alt="Library" fill className="object-cover" /></div></div>
        <div className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold">Residential & Convenience</h3><p className="text-xs text-slate mt-1">Public materials describe residence and campus amenities; confirm present operating status, availability, costs and travel arrangements before relying on them.</p><ul className="text-sm mt-2 list-disc pl-5 space-y-1"><li>Hostel accommodation and dining facilities</li><li>Student support and campus amenities</li><li>International arrival assistance described in admissions information</li></ul><div className="relative h-[180px] rounded-xl overflow-hidden border border-line mt-3"><Image src="/assets/students-lab.jpg" alt="Campus students" fill className="object-cover" /></div></div>
      </div>
      <div className="container grid md:grid-cols-3 gap-3 mt-6">
        <Link href="/campus/sports" className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold text-sm">Sports & Facilities</h3><p className="text-xs text-slate">Swimming, cricket, squash, football, horse-riding, boating, tennis</p></Link>
        <Link href="/campus/student-affairs" className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold text-sm">Deanship of Student Affairs</h3><p className="text-xs text-slate">Services & facilities, differently-abled support, clubs, online forms</p></Link>
        <Link href="/campus/library" className="bg-white border border-line rounded-xl p-4"><h3 className="font-bold text-sm">Central Library</h3><p className="text-xs text-slate">Physical services and restricted digital learning; confirm access requirements</p></Link>
      </div></section>
    </>
  );
}
