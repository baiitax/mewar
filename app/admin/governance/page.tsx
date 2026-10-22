import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { GOVERNANCE_DECISIONS } from "@/app/lib/governance-register";
import GovernanceRegister from "@/components/GovernanceRegister";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminGovernancePage() {
  if (process.env.NODE_ENV === "production") redirect("/admin");
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "SUPER_ADMIN") redirect("/login?error=role");

  const records = await prisma.governanceEntry.findMany({ orderBy: { code: "asc" } });
  const byCode = new Map(records.map(record => [record.code, record]));
  const decisions = GOVERNANCE_DECISIONS.map(decision => {
    const record = byCode.get(decision.code);
    return {
      ...decision,
      entry: record ? {
        id: record.id,
        accountableOwnerLabel: record.accountableOwnerLabel,
        ownerOffice: record.ownerOffice,
        ownerRole: record.ownerRole,
        status: record.status as "OPEN" | "OWNER_ASSIGNED" | "IN_PROGRESS" | "READY_FOR_REVIEW" | "BLOCKED",
        decisionSummary: record.decisionSummary,
        evidenceReference: record.evidenceReference,
        updatedAt: record.updatedAt.toISOString(),
      } : {
        id: null,
        accountableOwnerLabel: null,
        ownerOffice: null,
        ownerRole: null,
        status: "OPEN" as const,
        decisionSummary: null,
        evidenceReference: null,
        updatedAt: null,
      },
    };
  });

  return <section className="py-8"><div className="container max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="kicker">Restricted · Development governance tracker</div><h1 className="text-2xl font-extrabold">MIU readiness decisions</h1><p className="mt-1 text-sm text-slate-600">Signed in as {String((session.user as any).email)} · Super Admin preview access</p></div><Link href="/admin" className="rounded-full border border-line px-4 py-2 text-xs font-bold">← Admin dashboard</Link></div>
    <p className="mt-3 text-sm text-slate-600">Use the companion workshop pack for actual MIU owner assignments and approvals. This local tracker is for workflow demonstration with synthetic entries only.</p>
    <GovernanceRegister decisions={decisions} />
  </div></section>;
}
