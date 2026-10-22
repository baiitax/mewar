import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import FeeDraftForm from "@/components/FeeDraftForm";
import FeePublishControl from "@/components/FeePublishControl";

export const dynamic="force-dynamic";

export default async function AdminFeesPage(){
  const session=await auth();
  if(!session?.user) redirect("/login");
  const role=(session.user as any).role;
  if(!["SUPER_ADMIN","BURSAR"].includes(role)) redirect("/admin");
  const [programmes,schedules]=await Promise.all([
    prisma.programme.findMany({select:{id:true,title:true,slug:true},orderBy:{title:"asc"}}),
    prisma.feeSchedule.findMany({include:{programme:true},orderBy:[{session:"desc"},{programme:{title:"asc"}},{version:"desc"}]}),
  ]);
  return <section className="py-8"><div className="container">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="kicker">Restricted • Bursary / Platform Admin</div><h1 className="text-2xl font-bold">Fee Schedule Administration</h1><p className="text-sm text-slate-600">Signed-in role: <b>{role}</b>. Public release is gated on Bursar approval.</p></div><div className="flex gap-2">{process.env.NODE_ENV!=="production"&&<Link href="/admin/finance" className="border border-line px-4 py-2 rounded-full text-xs font-bold">Finance preview →</Link>}<Link href="/admin" className="border border-line px-4 py-2 rounded-full text-xs font-bold">← Dashboard</Link></div></div>
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-5 text-sm"><b>Source control:</b> Do not use estimates. Enter figures only from an authorised Bursary document. Drafts are private; only a Bursar may sign and publish.</div>
    <FeeDraftForm programmes={programmes} />
    <div className="bg-white border border-line rounded-xl p-4 mt-5"><h2 className="font-bold">Schedules & drafts ({schedules.length})</h2>
      {!schedules.length?<p className="text-sm text-slate-600 mt-3">No schedules or drafts are stored.</p>:<div className="overflow-auto mt-3"><table className="w-full min-w-[850px] text-xs border-collapse border border-line"><thead><tr className="bg-navy text-white"><th className="p-2 text-left">Programme</th><th className="p-2">Session / version</th><th className="p-2">Tuition</th><th className="p-2">Hostel</th><th className="p-2">Feeding</th><th className="p-2">Total</th><th className="p-2">Status</th><th className="p-2 text-left">Action</th></tr></thead><tbody>
        {schedules.map(f=><tr key={f.id} className="border-b border-line align-top"><td className="p-2 font-semibold">{f.programme.title}<span className="block font-normal text-slate">{f.programme.slug}</span></td><td className="p-2 text-center">{f.session} / v{f.version}</td><td className="p-2 text-right">₦{f.tuition.toLocaleString("en-NG")}</td><td className="p-2 text-right">₦{f.hostel.toLocaleString("en-NG")}</td><td className="p-2 text-right">₦{f.feeding.toLocaleString("en-NG")}</td><td className="p-2 text-right font-bold">₦{f.total.toLocaleString("en-NG")}</td><td className="p-2 text-center"><span className={`badge ${f.approvalStatus==="APPROVED"?"bg-green-100 text-green-800":"bg-amber-100 text-amber-900"}`}>{f.approvalStatus}{f.isPublished?" • PUBLIC":" • PRIVATE"}</span>{f.bursarSignature&&<span className="block text-slate mt-1">{f.bursarSignature}</span>}</td><td className="p-2">{f.approvalStatus==="DRAFT"&&role==="BURSAR"?<FeePublishControl id={f.id}/>:f.approvalStatus==="DRAFT"?<span className="text-slate">Awaiting Bursar sign-off</span>:<span className="text-slate">—</span>}</td></tr>)}
      </tbody></table></div>}
    </div>
    <p className="text-xs text-slate mt-4">Changes are recorded in the append-style audit log; production must use a managed Postgres database, SSO and audited backup/restore.</p>
  </div></section>;
}
