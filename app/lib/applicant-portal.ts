import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt } from "node:crypto";

export type EntryMode = "UTME" | "DIRECT_ENTRY" | "INTERNATIONAL";
export const ENTRY_MODES: EntryMode[] = ["UTME", "DIRECT_ENTRY", "INTERNATIONAL"];
export const APPLICATION_STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION", "OFFERED", "OFFER_ACCEPTED", "NOT_OFFERED", "WITHDRAWN"] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  return secret;
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (raw.length > 40) return null;
  let phone = raw.replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (/^0\d{10}$/.test(phone)) phone = `+234${phone.slice(1)}`;
  else if (/^234\d{10}$/.test(phone)) phone = `+${phone}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return null;
  return phone;
}

export function identifierKey(channel: string, purpose: string, identifier: string): string {
  return createHmac("sha256", authSecret()).update(`${purpose}:${channel}:${identifier}`).digest("hex");
}

function piiDedupSecret(): string {
  const secret = process.env.APP_PII_DEDUP_KEY;
  if (process.env.NODE_ENV === "production" && !secret) throw new Error("APP_PII_DEDUP_KEY must be configured before deduplicating applicant identifiers in production.");
  return secret || authSecret();
}

export function hashJambRegNo(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/[\s-]/g, "");
  return createHmac("sha256", piiDedupSecret()).update(`jamb-reg:${normalized}`).digest("hex");
}

function piiKey(): Buffer {
  const supplied = process.env.APP_PII_ENCRYPTION_KEY;
  if (process.env.NODE_ENV === "production" && !supplied) {
    throw new Error("APP_PII_ENCRYPTION_KEY must be set before collecting applicant identifiers in production.");
  }
  // The AUTH_SECRET fallback is development-preview only; set a separately managed key in any real deployment.
  const source = supplied || authSecret();
  return createHash("sha256").update(`MIU-applicant-pii-v1:${source}`).digest();
}

export function encryptApplicantIdentifier(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", piiKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptApplicantIdentifier(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  try {
    const [version, ivPart, tagPart, dataPart] = encrypted.split(":");
    if (version !== "v1" || !ivPart || !tagPart || !dataPart) return null;
    const decipher = createDecipheriv("aes-256-gcm", piiKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function makeApplicationNumber(year: number, sequence: number): string {
  const serial = String(sequence).padStart(6, "0");
  const checksum = createHmac("sha256", authSecret()).update(`${year}:${serial}`).digest("hex").slice(0, 4).toUpperCase();
  return `MIU-APP-${year}-${serial}-${checksum}`;
}

export function makePreviewStudentId(year: number, sequence: number): string {
  return `MIU-TEST-STU-${year}-${String(sequence).padStart(6, "0")}`;
}

export function applicationSession(): string | null {
  if (process.env.NODE_ENV !== "production") return process.env.MIU_PREVIEW_APPLICATION_SESSION || "2026/27";
  return process.env.MIU_ACTIVE_APPLICATION_SESSION || null;
}

export function isPreviewMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function intakeIsEnabled(programme: { isActive: boolean; isAcceptingApplications: boolean }): boolean {
  if (!programme.isActive) return false;
  if (isPreviewMode()) return true; // The development sandbox is synthetic-data testing only.
  return process.env.MIU_APPLICATIONS_ENABLED === "true" && programme.isAcceptingApplications && Boolean(applicationSession());
}

export function submissionGate(): { allowed: boolean; missing: string[] } {
  if (isPreviewMode()) return { allowed: true, missing: [] };
  const required: [string, string | undefined][] = [
    ["MIU_APPLICATIONS_ENABLED=true", process.env.MIU_APPLICATIONS_ENABLED === "true" ? "ok" : undefined],
    ["MIU_ACTIVE_APPLICATION_SESSION", process.env.MIU_ACTIVE_APPLICATION_SESSION],
    ["MIU_EMAIL_OTP_READY=true", process.env.MIU_EMAIL_OTP_READY === "true" ? "ok" : undefined],
    ["MIU_SMS_OTP_READY=true", process.env.MIU_SMS_OTP_READY === "true" ? "ok" : undefined],
    ["MIU_DOCUMENT_STORAGE_READY=true", process.env.MIU_DOCUMENT_STORAGE_READY === "true" ? "ok" : undefined],
    ["MIU_ANTIVIRUS_SCAN_READY=true", process.env.MIU_ANTIVIRUS_SCAN_READY === "true" ? "ok" : undefined],
    ["MIU_PRIVACY_NOTICE_APPROVED=true", process.env.MIU_PRIVACY_NOTICE_APPROVED === "true" ? "ok" : undefined],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  return { allowed: missing.length === 0, missing };
}

export function statusLabel(status: string): string {
  return status.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
}

export function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function text(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  return result.length <= max ? result : null;
}

export function randomOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
