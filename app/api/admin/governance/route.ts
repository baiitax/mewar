import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { GOVERNANCE_DECISIONS } from "@/app/lib/governance-register";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "The development governance tracker is not a production approval system." }, { status: 503 });
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if ((session.user as any).role !== "SUPER_ADMIN") return Response.json({ error: "Governance preview access requires Super Admin." }, { status: 403 });

  const records = await prisma.governanceEntry.findMany({ orderBy: { code: "asc" } });
  const byCode = new Map(records.map(record => [record.code, record]));
  return Response.json({
    data: GOVERNANCE_DECISIONS.map(decision => {
      const record = byCode.get(decision.code);
      return {
        ...decision,
        entry: record ? {
          id: record.id,
          accountableOwnerLabel: record.accountableOwnerLabel,
          ownerOffice: record.ownerOffice,
          ownerRole: record.ownerRole,
          status: record.status,
          decisionSummary: record.decisionSummary,
          evidenceReference: record.evidenceReference,
          updatedAt: record.updatedAt.toISOString(),
        } : {
          id: null,
          accountableOwnerLabel: null,
          ownerOffice: null,
          ownerRole: null,
          status: "OPEN",
          decisionSummary: null,
          evidenceReference: null,
          updatedAt: null,
        },
      };
    }),
    previewOnly: true,
    approvalSystem: false,
  }, { headers: { "Cache-Control": "no-store" } });
}
