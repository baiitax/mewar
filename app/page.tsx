import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/app/lib/db";

export const dynamic="force-dynamic";

const stats = [
  { k: "12", l: "Programme catalogue entries" },
  { k: "4", l: "Academic subject groupings" },
  { k: "Confirm", l: "Current intake with Registry" },
  { k: "Signed only", l: "Bursary fee schedules" },
];

const programmes = [
  { title: "BSc Software Engineering", badge: "4 Years • BSc", desc: "Cloud, algorithms, system analysis — with internships.", img: "/assets/students-lab.jpg", href: "/programmes/software-engineering" },
  { title: "BSc Cyber Security", badge: "4 Years • BSc", desc: "Cryptography, network, cloud, blockchain & cybercrime.", img: "/assets/students-lab.jpg", href: "/programmes/cyber-security" },
  { title: "BSc Computer Science", badge: "4 Years • BSc", desc: "Core CS + French, chemistry & practical physics.", img: "/assets/students-lab.jpg", href: "/programmes/computer-science" },
  { title: "BSc Industrial Chemistry", badge: "4 Years • BSc", desc: "Polymer, petroleum, environmental + 12-wk IT.", img: "/assets/hero-campus.jpg", href: "/programmes/industrial-chemistry" },
  { title: "BSc Biotechnology", badge: "4 Years • BSc", desc: "Health, agriculture & industrial biotech labs.", img: "/assets/library.jpg", href: "/programmes/biotechnology" },
  { title: "BSc Physics with Electronics", badge: "4 Years • BSc", desc: "Advanced physics & electronics for industry.", img: "/assets/hero-campus.jpg", href: "/programmes/physics-with-electronics" },
];

export default async function Home() {
  const currentFees=await prisma.feeSchedule.findMany({
    where:{session:"2026/27",isPublished:true,approvalStatus:"APPROVED",bursarSignedAt:{not:null},bursarSignature:{not:null}},
    include:{programme:true},orderBy:{programme:{title:"asc"}},take:3,
  });
  return (
    <>
      {/* Hero — mirrors original mewar banner */}
      <section className="relative overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Image src="/assets/hero-campus.jpg" alt="MIU campus" fill className="object-cover opacity-55" priority />
          <div className="absolute inset-0 bg-gradient-to-br from-navy/80 via-navy/50 to-navy/20" />
        </div>
        <div className="container relative py-12 md:py-16 text-white">
          <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 px-3 py-1 rounded-full text-xs font-semibold">✔ NUC-Licensed Private University • FEC Approved 3 Feb 2021 • Licence 8 Apr 2021</div>
          <h1 className="font-jakarta font-extrabold text-[28px] md:text-[42px] leading-[1.05] mt-3 max-w-[640px]">Education for <span className="text-gold">Knowledge,</span><br />Peace & Prosperity</h1>
          <p className="text-white/90 max-w-[560px] mt-3 text-[14px]">Mewar International University Nigeria brings skill-oriented international education to the Abuja–Nasarawa border — a 12-entry programme catalogue, international mentorship and opportunities for global collaboration. Confirm current programme approvals, campus facts and intake status with the University.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/admissions/apply" className="bg-gold text-navy px-5 py-2.5 rounded-full font-bold text-sm">Applicant Portal Preview →</Link>
            <Link href="/programmes" className="border border-white/60 text-white px-5 py-2.5 rounded-full font-semibold text-sm">Explore Programmes</Link>
            <Link href="/about/why-choose" className="border border-white/35 text-white px-5 py-2.5 rounded-full font-semibold text-sm">Why MIU?</Link>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {stats.map(s => (
              <div key={s.k} className="bg-white/12 border border-white/18 backdrop-blur px-4 py-3 rounded-xl text-center min-w-[130px]">
                <div className="text-gold font-extrabold text-xl">{s.k}</div><div className="text-[11px] opacity-90">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="bg-white/95 text-navy rounded-xl px-4 py-3 min-w-[220px] shadow"><div className="kicker">Intake status</div><div className="font-bold text-sm">No live intake verified in this preview</div><div className="text-xs text-slate">Confirm current dates with the Registrar</div></div>
            <div className="bg-white/95 text-navy rounded-xl px-4 py-3 min-w-[220px] shadow"><div className="kicker">Scholarships</div><div className="font-bold text-sm">Current awards are not verified here</div><div className="text-xs text-slate">Request the approved terms from MIU</div></div>
            <div className="bg-white/95 text-navy rounded-xl px-4 py-3 min-w-[220px] shadow"><div className="kicker">Reach Us</div><div className="font-bold text-sm">KM 21 Abuja–Keffi Rd, Masaka</div><div className="text-xs text-slate">+234 818 301 2911 • admission@miu.edu.ng</div></div>
          </div>
        </div>
      </section>

      {/* Programmes — mirrors original "Various Courses Offered" */}
      <section className="py-10">
        <div className="container">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div>
              <div className="kicker">Schools & Programmes</div>
              <h2 className="text-[22px] font-bold">Explore the Programme Catalogue</h2>
              <p className="text-slate text-sm max-w-[620px] mt-1">Programme outlines are indicative in this preview. Confirm the current approved curriculum, entry requirements and intake status with the Registrar.</p>
            </div>
            <Link href="/programmes" className="bg-navy text-white px-4 py-2 rounded-full text-sm font-bold">View all 12 →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {programmes.map(p => (
              <Link key={p.title} href={p.href} className="bg-white border border-line rounded-xl overflow-hidden shadow hover:shadow-lg transition hover:-translate-y-0.5">
                <div className="h-[150px] relative bg-slate-50"><Image src={p.img} alt={p.title} fill className="object-cover" /></div>
                <div className="p-3">
                  <span className="badge bg-gold/15 border-gold/30 text-amber-800">{p.badge}</span>
                  <h3 className="font-bold text-sm mt-1">{p.title}</h3>
                  <p className="text-slate text-xs mt-1">{p.desc}</p>
                  <span className="inline-block mt-2 text-xs font-bold text-navy">Syllabus & Apply →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <Link href="/programmes?school=management" className="bg-white border border-line rounded-xl p-3"><div className="badge">4 Years • BSc</div><h3 className="font-bold text-sm mt-1">BSc Accounting / Banking & Finance / Economics</h3><p className="text-xs text-slate">International banking, global economics, policy & enterprise.</p></Link>
            <Link href="/programmes?school=management" className="bg-white border border-line rounded-xl p-3"><div className="badge">4 Years • BSc</div><h3 className="font-bold text-sm mt-1">Public Admin / Entrepreneurship</h3><p className="text-xs text-slate">Bureaucracy, policy-to-action & start-up incubation.</p></Link>
            <Link href="/programmes?school=law" className="bg-navy text-white rounded-xl p-3 border border-navy"><div className="badge bg-white/15 border-white/20 text-white">5 Years • LLB</div><h3 className="font-bold text-sm mt-1 text-white">LLB — Bachelor of Laws</h3><p className="text-xs text-white/70">Confirm current accreditation and intake status with the Registrar.</p></Link>
          </div>
        </div>
      </section>

      {/* Why MIU + Fees */}
      <section className="py-10 bg-slate-50 border-y border-line">
        <div className="container grid md:grid-cols-2 gap-6">
          <div>
            <div className="kicker">Why Choose MIU Nigeria</div>
            <h2 className="text-xl font-bold">Study, research and campus life</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
              <li><b>Institutional information:</b> confirm current approvals, leadership and programme status with the University’s Registry.</li>
              <li><b>Location:</b> KM 21 Abuja–Keffi Expressway, Masaka, Nasarawa State; campus-area details are withheld pending Estates/Council confirmation.</li>
              <li><b>Programme catalogue:</b> explore Computing, Sciences, Management and Law entries; current curricula require Registry confirmation.</li>
              <li><b>Campus services:</b> facilities and availability can change; contact MIU to confirm current arrangements.</li>
              <li><b>International outlook:</b> see MIU’s public academic information for institutional context and contact the University for current opportunities.</li>
            </ul>
            <div className="flex gap-2 mt-4"><Link href="/about/why-choose" className="bg-navy text-white px-4 py-2 rounded-full text-sm font-bold">Read our story →</Link><Link href="/campus/virtual-tour" className="border border-line bg-white px-4 py-2 rounded-full text-sm font-semibold">Virtual tour</Link></div>
          </div>
          <div className="bg-white border border-line rounded-xl p-4 shadow">
            <div className="kicker">Fees — Bursary-approved source</div>
            <h3 className="font-bold">Session fee schedule 2026/27</h3>
            {currentFees.length ? <>
              <p className="text-xs text-slate">Published values below are read from the approved FeeSchedule database.</p>
              <div className="space-y-2 mt-3">{currentFees.map(f=>(
                <div key={f.id} className="flex justify-between items-center bg-slate-50 border border-line rounded-xl px-3 py-2">
                  <div><div className="font-semibold text-sm">{f.programme.title}</div><div className="text-xs text-slate">Tuition only • {f.session}</div></div>
                  <div className="font-bold text-sm">₦{f.tuition.toLocaleString("en-NG")}</div>
                </div>
              ))}</div>
            </> : <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 text-xs"><b>Awaiting Bursary sign-off.</b> No verified session schedule is published yet; this site does not show estimates.</div>}
            <Link href="/admissions/fees" className="block text-center mt-3 text-xs font-bold text-navy border border-line rounded-full py-2">Open official fee schedule →</Link>
          </div>
        </div>
      </section>

      {/* Admissions Steps — mirrors original Apply flow */}
      <section className="py-10">
        <div className="container">
          <div className="kicker">Admissions guidance</div>
          <h2 className="text-xl font-bold">Applicant Portal preview</h2>
          <p className="text-sm text-slate-600 mt-1">The development build can test identity verification, saved drafts, basic status tracking and file-format checks. It is not an open or official admissions intake.</p>
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {[
              ["Use synthetic information", "Development OTP codes are shown on screen; no email or SMS is sent."],
              ["Create an applicant account", "Email/phone uniqueness checks are enforced in this preview."],
              ["Save or resume a draft", "One test application per programme and preview session."],
              ["Check file format", "Only a technical format check runs; files are discarded and not scanned."],
              ["Review status", "Test status changes appear in the applicant dashboard."],
              ["Confirm official details", "No JAMB CAPS integration, offer decision, or production submission is connected."],
            ].map(([t,d],i)=>(
              <div key={t} className="bg-white border border-line rounded-xl p-3 flex gap-3">
                <div className="w-8 h-8 bg-navy text-gold grid place-items-center rounded-full font-bold shrink-0 text-xs">{i+1}</div>
                <div><div className="font-bold text-sm">{t}</div><div className="text-xs text-slate">{d}</div></div>
              </div>
            ))}
          </div>
          <div className="bg-gold/10 border border-gold/30 rounded-xl px-3 py-2 text-xs mt-4">ℹ <b>Production gates:</b> An approved intake, checklist, privacy notice, OTP provider, secure document store and antivirus scanner are still required.</div>
        </div>
      </section>

      {/* Campus */}
      <section className="py-10 bg-slate-50 border-y border-line">
        <div className="container grid md:grid-cols-2 gap-6">
          <div>
            <div className="kicker">Life @ MIU</div>
            <h2 className="text-xl font-bold">Campus and student-life information</h2>
            <div className="relative h-[220px] rounded-xl overflow-hidden border border-line mt-3"><Image src="/assets/library.jpg" alt="Library building image used for illustration; current campus services require confirmation" fill className="object-cover" /></div>
            <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">Campus facilities, accommodation, accessibility and student services may change. Contact MIU to confirm current availability; this preview does not certify operational status.</p>
          </div>
          <div className="bg-white border border-line rounded-xl p-4">
            <div className="kicker">Scholarships & Bursary</div>
            <h3 className="font-bold">Confirm current award terms with MIU</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3"><div className="font-bold text-sm">No current award schedule is verified in this preview.</div><p className="text-xs text-slate mt-1">Amounts, funded places, eligibility, sponsors and deadlines must be confirmed from an official MIU or sponsor notice. No award is promised here.</p><Link href="/admissions/scholarships" className="mt-3 inline-block text-xs font-bold text-navy underline">Scholarship information →</Link></div>
          </div>
        </div>
      </section>

      {/* News — mirrors original mewar news */}
      <section className="py-10">
        <div className="container grid md:grid-cols-2 gap-6">
          <div>
            <div className="kicker">News & Academic Calendar</div>
            <h2 className="text-xl font-bold">What’s Happening at MIU</h2>
            <div className="space-y-3 mt-3">
              {[
                ["25 Feb 2026 • Matriculation", "2026 Matriculation: A New Chapter Begins", "Fresh students inducted in academic regalia — 2026 cohort.", "/assets/hero-campus.jpg"],
                ["8 Apr 2021 • NUC", "Licence & Accreditation by Federal Government", "Hon. Minister + NUC ES present provisional licence at NUC HQ.", "/assets/library.jpg"],
                ["27 Apr 2024 • Registry", "Matriculation Shift Notice (Registrar)", "25 Apr → 27 Apr by 10:00 prompt — operational admin comms.", "/assets/students-lab.jpg"],
              ].map(([badge,title,desc,img])=>(
                <Link key={title} href="/news" className="flex gap-3 bg-white border border-line rounded-xl p-3">
                  <div className="w-[110px] h-[78px] relative rounded-xl overflow-hidden shrink-0 border border-line"><Image src={img} alt={title} fill className="object-cover" /></div>
                  <div><div className="badge text-[11px]">{badge}</div><div className="font-bold text-sm">{title}</div><div className="text-xs text-slate">{desc}</div></div>
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-white border border-line rounded-xl p-4">
            <div className="kicker">Academic Calendar 2026/27</div>
            <h3 className="font-bold">Current calendar status</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 text-xs"><b>Registry-approved dates are not loaded in this preview.</b> We do not display unverified calendar dates or an unsigned PDF.</div>
            <div className="text-xs mt-3"><Link href="/academics/calendar" className="font-bold text-navy">View calendar status & request the official copy →</Link></div>
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section className="py-10 bg-slate-50 border-y border-line">
        <div className="container">
          <div className="bg-white border border-line rounded-2xl p-5 md:p-7">
            <div className="kicker">Contact the University</div>
            <h2 className="mt-1 text-xl font-bold">For current admissions information</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This website preview does not collect general enquiries. Contact MIU directly to confirm official intake status, programme requirements, fees, scholarships and visitor arrangements. Do not send sensitive personal records by email.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="tel:+2348183012911" className="bg-navy text-white px-4 py-2 rounded-full text-sm font-bold">☎ +234 818 301 2911</a>
              <a href="mailto:admission@miu.edu.ng" className="border border-line bg-white px-4 py-2 rounded-full text-sm font-semibold">✉ admission@miu.edu.ng</a>
              <Link href="/contact" className="border border-line bg-white px-4 py-2 rounded-full text-sm font-semibold">Contact details →</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
