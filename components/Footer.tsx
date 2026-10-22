import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white/90 pt-10 pb-6 mt-8">
      <div className="container grid md:grid-cols-4 gap-8">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gold text-navy grid place-items-center rounded-lg font-extrabold">MIU</div>
            <div><div className="font-bold leading-none">Mewar International University</div><div className="text-[11px] opacity-80">Nigeria • NUC-Licensed</div></div>
          </Link>
          <p className="text-[13px] text-white/70 mt-3">KM 21 Abuja–Keffi Road, Masaka, Nasarawa — by the FCT border. Campus area is pending Estates/Council confirmation.</p>
          <div className="flex gap-2 mt-3">
            <a href="#" className="w-8 h-8 bg-white/10 border border-white/15 rounded-full grid place-items-center text-sm">𝕏</a>
            <a href="#" className="w-8 h-8 bg-white/10 border border-white/15 rounded-full grid place-items-center text-sm">f</a>
            <a href="#" className="w-8 h-8 bg-white/10 border border-white/15 rounded-full grid place-items-center text-sm">in</a>
            <a href="#" className="w-8 h-8 bg-white/10 border border-white/15 rounded-full grid place-items-center text-sm">▶</a>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Study</h4>
          <div className="space-y-1.5 text-[13px] text-white/80">
            <Link href="/programmes" className="block hover:text-white">All Programmes (12)</Link>
            <Link href="/admissions" className="block hover:text-white">Why Study @ MIU</Link>
            <Link href="/admissions/requirements" className="block hover:text-white">Offered Courses</Link>
            <Link href="/admissions/fees" className="block hover:text-white">Fees Structure (Bursary Source)</Link>
            <Link href="/admissions/scholarships" className="block hover:text-white">Bursary & Scholarships</Link>
            <Link href="/admissions/apply" className="block hover:text-white">Apply for Admission</Link>
            <Link href="/programmes?school=law" className="block hover:text-white">Faculty of Law — Accreditation Note</Link>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">Life @ MIU</h4>
          <div className="space-y-1.5 text-[13px] text-white/80">
            <Link href="/campus/virtual-tour" className="block hover:text-white">Virtual Tours</Link>
            <Link href="/campus/library" className="block hover:text-white">Central Library</Link>
            <Link href="/campus/hostels" className="block hover:text-white">Hostels & Mess</Link>
            <Link href="/campus/sports" className="block hover:text-white">Sports Facilities</Link>
            <Link href="/campus/student-affairs" className="block hover:text-white">Deanship of Student Affairs</Link>
            <Link href="/research" className="block hover:text-white">Research & Innovation</Link>
            <Link href="/research/incubation" className="block hover:text-white">Innovation Incubation</Link>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-white mb-3">University Portals</h4>
          <div className="space-y-1.5 text-[13px] text-white/80">
            <Link href="/portals/apply" className="block hover:text-white">Applicant Portal — development preview</Link>
            <Link href="/portals/student" className="block hover:text-white">Student Portal (SIS)</Link>
            <Link href="/portals/staff" className="block hover:text-white">Staff Portal</Link>
            <Link href="/portals/lms" className="block hover:text-white">LMS (Moodle) — Student</Link>
            <Link href="/portals/erp" className="block hover:text-white">MIU ERP Portal</Link>
            <Link href="/portals/verify" className="block hover:text-white">Verify Certificate (QR)</Link>
            <div className="text-[11px] text-white/60 mt-2">Non-applicant portals remain restricted notices. MIU’s production identity/SSO integration is not configured in this preview.</div>
          </div>
          <div className="mt-4 bg-white/10 border border-white/15 rounded-xl p-3">
            <div className="text-xs font-bold">Admissions Hotline</div>
            <a href="tel:+2348183012911" className="text-white font-bold">+234 818 301 2911</a>
            <div className="text-xs text-white/70">admission@miu.edu.ng • call ahead to confirm hours</div>
          </div>
        </div>
      </div>

      {/* Bottom bar — mirrors original */}
      <div className="container mt-8 pt-4 border-t border-white/15 flex flex-col md:flex-row justify-between gap-3 text-[12px] text-white/60">
        <span>© 2026 Mewar International University Nigeria. All rights reserved. Approved by Federal Executive Council & NUC. Promoted by Adhyay International Ltd.</span>
        <span className="flex gap-3 flex-wrap"><Link href="/about#privacy" className="hover:text-white">Privacy (NDPA 2023)</Link> <Link href="/about#privacy" className="hover:text-white">Terms</Link> <Link href="/contact" className="hover:text-white">NUC Letters</Link></span>
      </div>
    </footer>
  );
}
