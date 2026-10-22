import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";
import { GOVERNANCE_DECISIONS, isGovernanceStatus } from "@/app/lib/governance-register";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Governance preview writes are disabled in production." }, { status: 503 });
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if ((session.user as any).role !== "SUPER_ADMIN") return Response.json({ error: "Governance preview editing requires Super Admin." }, { status: 403 });

  const { code } = await params;
  if (!GOVERNANCE_DECISIONS.some(decision => decision.code === code)) return Response.json({ error: "Unknown governance decision code." }, { status: 404 });
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body) || !isGovernanceStatus(body.status)) {
    return Response.json({ error: "Provide a supported tracking status. This register cannot record institutional approval." }, { status: 400 });
  }

  const ownerLabel = readText(body.accountableOwnerLabel, 120, "accountable owner label");
  const ownerOffice = readText(body.ownerOffice, 120, "owner office");
  const ownerRole = readText(body.ownerRole, 120, "owner role");
  const decisionSummary = readText(body.decisionSummary, 1200, "decision tracking note");
  const evidenceReference = readText(body.evidenceReference, 180, "evidence reference");
  for (const result of [ownerLabel, ownerOffice, ownerRole, decisionSummary, evidenceReference]) {
    if (typeof result === "object" && result !== null && "error" in result) return Response.json({ error: result.error }, { status: 400 });
  }
  const safeOwnerLabel = ownerLabel as string | null;
  const safeOwnerOffice = ownerOffice as string | null;
  const safeOwnerRole = ownerRole as string | null;
  const safeSummary = decisionSummary as string | null;
  const safeEvidence = evidenceReference as string | null;

  if (safeOwnerLabel && !/^(SYNTHETIC|TEST)\b/i.test(safeOwnerLabel)) {
    return Response.json({ error: "Use a fictional SYNTHETIC or TEST owner label here. Record real names only in an MIU-approved system after privacy and security approval." }, { status: 400 });
  }
  if (safeSummary && !/^(SYNTHETIC|TEST)\s*:/i.test(safeSummary)) {
    return Response.json({ error: "Use a SYNTHETIC: or TEST: note only. Do not store real policy wording or personal information in this preview." }, { status: 400 });
  }
  if (safeEvidence && !/^(SYNTHETIC|TEST)[-:_]/i.test(safeEvidence)) {
    return Response.json({ error: "Use a fictional TEST- or SYNTHETIC- reference only; do not store real document identifiers, URLs, files, secrets or personal data." }, { status: 400 });
  }
  if (safeEvidence && /^https?:\/\//i.test(safeEvidence)) {
    return Response.json({ error: "Store only a fictional internal preview reference, not a URL, file, secret or personal data." }, { status: 400 });
  }
  if (["OWNER_ASSIGNED", "IN_PROGRESS", "READY_FOR_REVIEW"].includes(body.status) && (!safeOwnerOffice || !safeOwnerRole)) {
    return Response.json({ error: "Assign an accountable office and role before moving this tracking item forward." }, { status: 400 });
  }
  if (body.status === "READY_FOR_REVIEW" && (!safeSummary || !safeEvidence)) {
    return Response.json({ error: "Add a concise synthetic tracking note and internal evidence reference before marking ready for authority review." }, { status: 400 });
  }

  const userId = typeof (session.user as any).id === "string" ? (session.user as any).id : null;
  const before = await prisma.governanceEntry.findUnique({ where: { code } });
  const after = await prisma.$transaction(async tx => {
    const entry = await tx.governanceEntry.upsert({
      where: { code },
      create: {
        code,
        accountableOwnerLabel: safeOwnerLabel,
        ownerOffice: safeOwnerOffice,
        ownerRole: safeOwnerRole,
        status: body.status,
        decisionSummary: safeSummary,
        evidenceReference: safeEvidence,
        updatedById: userId,
      },
      update: {
        accountableOwnerLabel: safeOwnerLabel,
        ownerOffice: safeOwnerOffice,
        ownerRole: safeOwnerRole,
        status: body.status,
        decisionSummary: safeSummary,
        evidenceReference: safeEvidence,
        updatedById: userId,
      },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "governance.preview.update",
        entity: "GovernanceEntry",
        entityId: entry.id,
        before: before ? JSON.stringify({ status: before.status, ownerOffice: before.ownerOffice, ownerRole: before.ownerRole, evidenceReference: before.evidenceReference }) : null,
        after: JSON.stringify({ code, status: entry.status, ownerOffice: entry.ownerOffice, ownerRole: entry.ownerRole, evidenceReference: entry.evidenceReference, approvalRecorded: false }),
      },
    });
    return entry;
  });
  return Response.json({
    data: {
      id: after.id,
      code: after.code,
      accountableOwnerLabel: after.accountableOwnerLabel,
      ownerOffice: after.ownerOffice,
      ownerRole: after.ownerRole,
      status: after.status,
      decisionSummary: after.decisionSummary,
      evidenceReference: after.evidenceReference,
      updatedAt: after.updatedAt.toISOString(),
    },
    previewOnly: true,
    approvalRecorded: false,
    message: "Preview tracking saved. This is not an MIU approval, e-signature or production release record.",
  });
}

function readText(value: unknown, max: number, label: string): string | null | { error: string } {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return { error: `The ${label} must be text.` };
  const trimmed = value.trim();
  if (trimmed.length > max) return { error: `The ${label} must be ${max} characters or fewer.` };
  return trimmed || null;
}
