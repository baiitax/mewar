export const FINANCE_STAFF_ROLES = new Set(["SUPER_ADMIN", "BURSAR"]);

export type LedgerRow = {
  direction: string;
  amount: number;
};

export function summarizeLedger(entries: LedgerRow[]) {
  const charges = entries
    .filter(entry => entry.direction === "DEBIT")
    .reduce((total, entry) => total + entry.amount, 0);
  const credits = entries
    .filter(entry => entry.direction === "CREDIT")
    .reduce((total, entry) => total + entry.amount, 0);
  const balance = charges - credits;
  return {
    charges,
    credits,
    balance,
    clearance: balance <= 0 && charges > 0 ? "PREVIEW_CLEARED" : "PREVIEW_PENDING",
  };
}

export function isCurrentlySignedFeeSchedule(schedule: {
  isPublished: boolean;
  approvalStatus: string;
  bursarSignedAt: Date | null;
  bursarSignature: string | null;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  total: number;
  tuition: number;
  hostel: number;
  feeding: number;
  currency: string;
}, now = new Date()) {
  return schedule.isPublished
    && schedule.approvalStatus === "APPROVED"
    && Boolean(schedule.bursarSignedAt && schedule.bursarSignature?.trim())
    && schedule.currency === "NGN"
    && schedule.effectiveFrom <= now
    && (!schedule.effectiveUntil || schedule.effectiveUntil > now)
    && Number.isSafeInteger(schedule.total)
    && schedule.total > 0
    && schedule.total === schedule.tuition + schedule.hostel + schedule.feeding;
}

export function makeReceiptVerificationUrl(request: Request, token: string) {
  const configuredBase = process.env.MIU_PREVIEW_PUBLIC_URL?.trim();
  let origin: string;
  if (configuredBase) {
    const configuredUrl = new URL(configuredBase);
    if (configuredUrl.protocol !== "https:" && configuredUrl.protocol !== "http:") throw new Error("Receipt origin must use HTTP or HTTPS.");
    origin = configuredUrl.origin;
  } else {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || request.headers.get("host") || requestUrl.host;
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProto === "https" || forwardedProto === "http"
      ? forwardedProto
      : requestUrl.protocol.slice(0, -1);
    if (!host || /[\s/?#@\\]/.test(host)) throw new Error("Could not determine a safe receipt URL host.");
    origin = new URL(`${protocol}://${host}`).origin;
  }
  return new URL(`/finance/verify/${encodeURIComponent(token)}`, origin).toString();
}

export function formatPreviewReceiptCode(year: number, sequence: number) {
  return `MIU-TEST-REC-${year}-${String(sequence).padStart(6, "0")}`;
}

export function formatPreviewProviderReference(year: number, randomPart: string) {
  return `MIU-TEST-PAY-${year}-${randomPart.toUpperCase()}`;
}
