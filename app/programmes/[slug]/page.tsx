import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/db";

const catalogue:Record<string,{school:string,dur:string,elig:string,syllabus:string[]}> = {
  "software-engineering": {school:"School of Computing",dur:"4 Years",elig:"Current entry requirements must be confirmed with Admissions.",syllabus:["Computational science and numerical methods","Cloud computing","Algorithms and complexity","Systems analysis and design","Industrial training (duration to be verified)"]},
  "cyber-security": {school:"School of Computing",dur:"4 Years",elig:"Current entry requirements must be confirmed with Admissions.",syllabus:["Cryptography and network security","Cloud security","Blockchain (elective subject to current curriculum)","Numerical methods"]},
  "computer-science": {school:"School of Computing",dur:"4 Years",elig:"Current entry requirements must be confirmed with Admissions.",syllabus:["Communication skills","General chemistry and practicals","General physics and practicals","Core computing curriculum — request the current approved course list"]},
  "industrial-chemistry": {school:"School of Sciences",dur:"4 Years",elig:"Programme-specific O-Level and JAMB requirements must be confirmed with Admissions.",syllabus:["Process science","Polymer chemistry","Industrial training","Colour and textile chemistry"]},
  "biotechnology": {school:"School of Sciences",dur:"4 Years",elig:"Programme-specific O-Level and JAMB requirements must be confirmed with Admissions.",syllabus:["General biology and practicals","General chemistry","Laboratory work and research project"]},
  "physics-with-electronics": {school:"School of Sciences",dur:"4 Years",elig:"Programme-specific O-Level and JAMB requirements must be confirmed with Admissions.",syllabus:["Electric circuits and electronics","Advanced physics","Practical laboratory work"]},
  "accounting": {school:"School of Management & Social Sciences",dur:"4 Years",elig:"Programme-specific O-Level and JAMB requirements must be confirmed with Admissions.",syllabus:["Introduction to accounting","Business studies","Principles of economics","Social sciences"]},
  "banking-finance": {school:"School of Management & Social Sciences",dur:"4 Years",elig:"Programme-specific O-Level and JAMB requirements must be confirmed with Admissions.",syllabus:["Principles of finance","Economics","Commerce and related subjects"]},
  "economics": {school:"School of Management & Social Sciences",dur:"4 Years",elig:"Programme-specific O-Level and JAMB requirements must be confirmed with Admissions.",syllabus:["Principles of economics","Quantitative methods","Policy and global economics"]},
  "public-administration": {school:"School of Management & Social Sciences",dur:"4 Years",elig:"Programme-specific O-Level and JAMB requirements must be confirmed with Admissions.",syllabus:["Communication skills","Principles of economics","Principles of administration"]},
  "entrepreneurship": {school:"School of Management & Social Sciences",dur:"4 Years",elig:"Programme-specific O-Level and JAMB requirements must be confirmed with Admissions.",syllabus:["Social psychology","Enterprise development","Entrepreneurship and start-up practice"]},
  "law": {school:"Faculty of Law",dur:"5 Years (listed programme duration; confirm current Registry record)",elig:"Current entry requirements and intake status must be confirmed with the Registrar.",syllabus:["Current approved Law curriculum has not been loaded into this build. Request the authoritative version from the Faculty/Registrar."]},
};

export const dynamic="force-dynamic";

export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const outline=catalogue[slug];
  if(!outline) notFound();
  const programme=await prisma.programme.findUnique({where:{slug}});
  if(!programme) notFound();
  const fee=await prisma.feeSchedule.findFirst({
    where:{programmeId:programme.id,session:"2026/27",isPublished:true,approvalStatus:"APPROVED",bursarSignedAt:{not:null},bursarSignature:{not:null}},
    orderBy:{version:"desc"},
  });
  const feeLabel=fee?`Bursary-approved tuition: ₦${fee.tuition.toLocaleString("en-NG")}`:"Current Bursary-approved fee not yet published";
  return <section className="py-8"><div className="container">
    <div className="kicker">{outline.school} • {outline.dur}</div><h1 className="text-2xl font-bold">{programme.title}</h1>
    <div className="flex flex-wrap gap-2 mt-2"><span className="badge bg-navy text-white">{feeLabel}</span><span className="badge">{outline.elig}</span></div>
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white border border-line rounded-xl p-4"><h2 className="font-bold">Indicative curriculum topics</h2><ul className="mt-2 space-y-1 text-sm list-disc pl-5">{outline.syllabus.map(item=><li key={item}>{item}</li>)}</ul><p className="text-xs text-slate mt-3">This summary is not a substitute for the current Senate-approved curriculum. Request the authoritative version and effective session from Academic Planning.</p></div>
      <div className="bg-white border border-line rounded-xl p-4"><h2 className="font-bold">Admissions and programme status</h2><p className="text-sm text-slate-600 mt-2">A current NUC/CLE approval reference is not loaded in this platform record. Confirm programme status with the Registrar before applying.</p><p className="text-sm text-slate-600 mt-2">Entry requirements can change by session; confirm the current criteria with Admissions.</p><Link href="/admissions/apply" className="inline-block mt-3 bg-gold text-navy px-4 py-2 rounded-full text-sm font-bold">Applicant Portal Preview →</Link>
        <div className="bg-slate-50 border border-line rounded-xl p-3 mt-3 text-xs"><b>Fees:</b> {feeLabel}. {fee&&<>Schedule signed by {fee.bursarSignature} on {fee.bursarSignedAt?.toLocaleDateString("en-NG")}.</>} View the <Link href="/admissions/fees" className="font-bold underline">session fee schedule →</Link></div>
      </div>
    </div>
  </div></section>;
}
