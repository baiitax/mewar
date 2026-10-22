"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about", children: [
    { label: "About MIU Nigeria", href: "/about" },
    { label: "Why Choose MIU", href: "/about/why-choose" },
    { label: "Governing Council", href: "/about/governing-council" },
    { label: "Leadership", href: "/about#leadership" },
  ]},
  { label: "Academics", href: "/programmes", children: [
    { label: "All Programmes (12)", href: "/programmes" },
    { label: "School of Computing", href: "/programmes?school=computing" },
    { label: "School of Sciences", href: "/programmes?school=sciences" },
    { label: "Management & Social Sciences", href: "/programmes?school=management" },
    { label: "Faculty of Law", href: "/programmes?school=law" },
    { label: "Academic Calendar", href: "/academics/calendar" },
  ]},
  { label: "Admissions", href: "/admissions", children: [
    { label: "Why Study @ MIU", href: "/admissions/why-study" },
    { label: "Admission Requirements", href: "/admissions/requirements" },
    { label: "Fees Structure — Bursary Source", href: "/admissions/fees" },
    { label: "Scholarships & Bursary", href: "/admissions/scholarships" },
    { label: "Apply for Admission", href: "/admissions/apply" },
    { label: "JAMB & Direct Entry", href: "/admissions#jamb" },
    { label: "International Applicants", href: "/admissions#international" },
  ]},
  { label: "Research", href: "/research", children: [
    { label: "Research Policies", href: "/research#policies" },
    { label: "Research Collaboration", href: "/research#collaboration" },
    { label: "Research Publications", href: "/research#publications" },
    { label: "University Journal", href: "/research#journal" },
    { label: "Innovation Incubation", href: "/research/incubation" },
  ]},
  { label: "Campus Life", href: "/campus", children: [
    { label: "Virtual Tour", href: "/campus/virtual-tour" },
    { label: "Central Library", href: "/campus/library" },
    { label: "Central Mosque", href: "/campus#mosque" },
    { label: "Hostels & Mess", href: "/campus/hostels" },
    { label: "Sports Facilities", href: "/campus/sports" },
    { label: "Deanship of Student Affairs", href: "/campus/student-affairs" },
    { label: "Staff Welfare Association", href: "/campus#staff-welfare" },
  ]},
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string|null>(null);
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — mirrors original */}
      <div className="bg-navy text-white/90 text-[12px] py-1.5">
        <div className="container flex justify-between items-center gap-3 flex-wrap">
          <span className="flex items-center gap-2"><span>📍</span> KM 21 Abuja–Keffi Expressway, Masaka, Nasarawa — <span className="hidden md:inline">Approved by Federal Executive Council & NUC</span></span>
          <div className="flex items-center gap-3">
            <a href="tel:+2348183012911" className="hover:underline">☎ +234 818 301 2911</a>
            <a href="mailto:info@miu.edu.ng" className="hover:underline hidden sm:inline">✉ info@miu.edu.ng</a>
            <Link href="/admissions/apply" className="bg-gold text-navy px-3 py-1 rounded-full font-bold text-[12px] hidden sm:inline">🎓 Applicant Portal Preview</Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-line">
        <div className="container flex items-center justify-between py-2.5 gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-[42px] h-[42px] bg-navy text-gold grid place-items-center rounded-[10px] font-extrabold text-[13px]">MIU</div>
            <div>
              <div className="font-jakarta font-bold text-navy text-[13px] leading-none">Mewar International University</div>
              <div className="text-[10px] tracking-[.06em] uppercase text-slate font-semibold">Nigeria • 1st Indian University in Africa</div>
            </div>
          </Link>

          {/* Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map(item => (
              <div key={item.label} className="relative group" onMouseEnter={()=>setOpenDropdown(item.label)} onMouseLeave={()=>setOpenDropdown(null)}>
                <Link href={item.href} className={`px-3 py-2 rounded-full text-[13px] font-semibold ${pathname===item.href || pathname?.startsWith(item.href+"/") ? "bg-navy text-white" : "text-slate-800 hover:bg-slate-50"}`}>
                  {item.label}
                </Link>
                {item.children && openDropdown===item.label && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="bg-white border border-line rounded-xl shadow-xl p-2 min-w-[260px]">
                      {item.children.map(ch => (
                        <Link key={ch.href} href={ch.href} className="block px-3 py-2 rounded-lg text-[13px] text-slate-700 hover:bg-slate-50 hover:text-navy font-medium">{ch.label}</Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link href="/admissions/apply" className="ml-2 bg-navy text-white px-4 py-2 rounded-full text-[13px] font-bold hover:bg-navy-2">Portal Preview →</Link>
          </nav>

          <button onClick={()=>setMobileOpen(!mobileOpen)} className="lg:hidden bg-navy text-white px-3 py-2 rounded-full text-sm font-bold">{mobileOpen ? "✕ Close" : "☰ Menu"}</button>
        </div>

        {/* Mobile */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-line bg-white max-h-[70vh] overflow-auto">
            <div className="container py-3">
              {nav.map(item => (
                <details key={item.label} className="border-b border-line">
                  <summary className="flex justify-between items-center py-2 font-semibold text-[14px] cursor-pointer list-none">
                    <Link href={item.href} onClick={()=>setMobileOpen(false)}>{item.label}</Link>
                    {item.children && <span className="text-slate text-xs">▼</span>}
                  </summary>
                  {item.children && <div className="pb-2 pl-2">{item.children.map(ch => (<Link key={ch.href} href={ch.href} onClick={()=>setMobileOpen(false)} className="block py-1.5 text-[13px] text-slate-600">{ch.label}</Link>))}</div>}
                </details>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                <Link href="/admissions/apply" onClick={()=>setMobileOpen(false)} className="bg-gold text-navy text-center py-2 rounded-full font-bold">Applicant Portal Preview →</Link>
                <Link href="/portals" onClick={()=>setMobileOpen(false)} className="border border-line text-center py-2 rounded-full font-semibold">University Portals</Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
