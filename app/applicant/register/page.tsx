import Link from "next/link";
import ApplicantRegisterForm from "@/components/ApplicantRegisterForm";

export default function ApplicantRegistrationPage() {
  return <section className="py-8 md:py-12"><div className="container max-w-5xl">
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-navy px-6 py-7 text-white md:px-9">
        <div className="text-xs font-bold uppercase tracking-[.18em] text-amber-300">Applicant Portal · Identity</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Create an applicant account</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/75">A private applicant identity for saving and resuming a test application draft.</p>
      </div>
      <div className="grid gap-7 p-5 md:grid-cols-[1fr_300px] md:p-9">
        <div>
          <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>Development preview only — not an open admissions intake.</b><p className="mt-1 text-xs leading-5">Do not enter real personal information. OTP is simulated locally and displayed on screen; no message is sent. No application is submitted to the University from this preview.</p></div>
          <ApplicantRegisterForm />
        </div>
        <aside className="space-y-4 text-sm">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><h2 className="font-bold text-navy">What this preview does</h2><ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-slate-600"><li>Verifies an email and phone using development-only codes.</li><li>Creates one applicant identity with duplicate email/phone checks.</li><li>Lets you create and resume programme-specific draft applications.</li><li>Provides illustrative checklist and file-format tests.</li></ul></div>
          <div className="rounded-2xl border border-slate-200 p-4"><h2 className="font-bold text-navy">Before a live intake</h2><p className="mt-2 text-xs leading-5 text-slate-600">MIU must approve the intake, application checklist, privacy notice, email/SMS OTP, secure document storage and malware scanning. JAMB CAPS remains an official external process.</p></div>
          <p className="text-xs text-slate-500">Already registered? <Link href="/login" className="font-bold text-navy underline">Sign in</Link>.</p>
        </aside>
      </div>
    </div>
  </div></section>;
}
