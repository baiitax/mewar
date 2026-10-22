import Link from "next/link";
import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export default async function FeesPage(){
  const session = "2026/27";
  const fees = await prisma.feeSchedule.findMany({
    where:{ session, isPublished:true, approvalStatus:"APPROVED", bursarSignedAt:{not:null}, bursarSignature:{not:null} },
    include:{ programme:true },
    orderBy:[{ programme:{ title:"asc" }},{ version:"desc" }],
  });
  const latestByProgramme = new Map<string, (typeof fees)[number]>();
  for(const fee of fees){
    if(!latestByProgramme.has(fee.programmeId)) latestByProgramme.set(fee.programmeId, fee);
  }
  const published = [...latestByProgramme.values()];
  const signers = [...new Set(published.map(f=>f.bursarSignature).filter(Boolean))];
  return (
    <section className="py-8"><div className="container">
      <div className="kicker">Fees Structure • Authoritative Bursary Schedule</div>
      <h1 className="text-2xl font-bold">Fees for {session}</h1>
      <p className="text-sm text-slate-600 mt-2 max-w-3xl">Only schedules entered, approved and signed by the Bursary are shown here. The page reads directly from the platform fee ledger; it does not use brochure estimates or manually typed marketing figures.</p>
      <div className="bg-white border border-line rounded-xl p-4 mt-5">
        {published.length ? <>
          <div className="flex flex-wrap gap-2 items-center"><strong>Approved schedule — {session}</strong><span className="bg-green-50 border border-green-200 px-2 py-1 rounded-full text-xs font-bold text-green-700">Bursary-signed</span><span className="bg-slate-50 border border-line px-2 py-1 rounded-full text-xs">{published.length} programme{published.length===1?"":"s"}</span></div>
          <div className="overflow-auto mt-3"><table className="w-full text-sm border-collapse border border-line"><thead><tr className="bg-navy text-white"><th className="p-2 text-left">Programme</th><th className="p-2">Tuition</th><th className="p-2">Hostel</th><th className="p-2">Feeding</th><th className="p-2">Total</th><th className="p-2">Effective from</th></tr></thead>
            <tbody>{published.map(f=><tr key={f.id} className="border-b border-line"><td className="p-2 font-medium">{f.programme.title}<span className="block text-xs text-slate">{f.programme.school}</span></td><td className="p-2 text-center">₦{f.tuition.toLocaleString("en-NG")}</td><td className="p-2 text-center">₦{f.hostel.toLocaleString("en-NG")}</td><td className="p-2 text-center">₦{f.feeding.toLocaleString("en-NG")}</td><td className="p-2 text-center font-bold">₦{f.total.toLocaleString("en-NG")}</td><td className="p-2 text-center">{f.effectiveFrom.toLocaleDateString("en-NG")}</td></tr>)}</tbody>
          </table></div>
          <p className="text-xs text-slate mt-3">Signatory: {signers.join("; ")} • API: <Link href="/api/fees?session=2026%2F27" className="font-bold underline">view published fee data</Link>.</p>
        </> : <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="font-bold text-amber-900">Official fee schedule not yet published</div>
          <p className="text-sm text-amber-900 mt-1">No Bursary-approved and signed {session} schedule is present in the platform database. To avoid misleading applicants, this page does not display estimates. Please contact the Bursary for the current signed schedule.</p>
          <Link href="/contact" className="inline-block mt-3 bg-navy text-white px-4 py-2 rounded-full text-sm font-bold">Contact the Bursary →</Link>
        </div>}
      </div>
      <div className="mt-4 bg-slate-50 border border-line rounded-xl p-4 text-sm"><h2 className="font-bold">Fee publication controls</h2><ul className="text-xs text-slate-700 mt-2 list-disc pl-5 space-y-1"><li>Amounts are stored per programme and academic session.</li><li>Drafts are private; only approved records with a Bursary signatory are returned by the public API.</li><li>Every publish action is recorded in the audit log.</li></ul><p className="mt-3 text-xs">Authorised Bursary staff can manage drafts via the restricted <Link href="/admin/fees" className="font-bold underline">fee administration workspace</Link>.</p></div>
    </div></section>
  );
}
