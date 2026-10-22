import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/app/lib/db";
import { authSecret, identifierKey, normalizeEmail, normalizePhone } from "@/app/lib/applicant-portal";

export const runtime = "nodejs";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "OTP delivery is not configured." }, { status: 503 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const channel = body?.channel;
  if (channel !== "email" && channel !== "phone") return Response.json({ error: "Choose email or phone verification." }, { status: 400 });
  const identifier = channel === "email" ? normalizeEmail(body?.identifier) : normalizePhone(body?.identifier);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!identifier || !/^\d{6}$/.test(code)) return Response.json({ error: "Enter the contact and its six-digit code." }, { status: 400 });

  const key = identifierKey(channel, "registration", identifier);
  const challenge = await prisma.otpChallenge.findUnique({ where: { key } });
  const now = new Date();
  if (!challenge || challenge.consumedAt || challenge.expiresAt <= now) return Response.json({ error: "Code is invalid or expired. Request a new code." }, { status: 400 });
  if (challenge.lockedUntil && challenge.lockedUntil > now) return Response.json({ error: "Too many attempts. Request a new code later." }, { status: 429 });

  const candidate = createHmac("sha256", authSecret()).update(`${key}:${code}`).digest();
  const expected = Buffer.from(challenge.codeHash, "hex");
  const valid = expected.length === candidate.length && timingSafeEqual(expected, candidate);
  if (!valid) {
    const attempts = challenge.attempts + 1;
    await prisma.otpChallenge.update({
      where: { key },
      data: { attempts, lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + LOCK_MS) : null },
    });
    return Response.json({ error: attempts >= MAX_ATTEMPTS ? "Too many attempts. Request a new code later." : "That code is incorrect." }, { status: attempts >= MAX_ATTEMPTS ? 429 : 400 });
  }

  await prisma.otpChallenge.update({ where: { key }, data: { verifiedAt: now } });
  return Response.json({ verified: true, expiresAt: challenge.expiresAt.toISOString(), message: `${channel === "email" ? "Email" : "Phone"} verified for this development registration.` });
}
