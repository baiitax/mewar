import { createHmac } from "node:crypto";
import { prisma } from "@/app/lib/db";
import { authSecret, identifierKey, normalizeEmail, normalizePhone, randomOtp } from "@/app/lib/applicant-portal";

export const runtime = "nodejs";
const OTP_TTL_MS = 10 * 60 * 1000;
const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS = 3;

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "OTP delivery is not configured. Applicant registration is unavailable." }, { status: 503 });
  }

  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const channel = body?.channel;
  if (channel !== "email" && channel !== "phone") return Response.json({ error: "Choose email or phone verification." }, { status: 400 });
  const identifier = channel === "email" ? normalizeEmail(body?.identifier) : normalizePhone(body?.identifier);
  if (!identifier) return Response.json({ error: channel === "email" ? "Enter a valid email address." : "Enter a valid international phone number (Nigerian 080…, 234…, or +234… is accepted)." }, { status: 400 });

  const now = new Date();
  const key = identifierKey(channel, "registration", identifier);
  const existing = await prisma.otpChallenge.findUnique({ where: { key } });
  if (existing?.lockedUntil && existing.lockedUntil > now) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const withinWindow = Boolean(existing && now.getTime() - existing.sendWindowStartedAt.getTime() < SEND_WINDOW_MS);
  const sendCount = withinWindow ? existing!.sendCount + 1 : 1;
  if (sendCount > MAX_SENDS) return Response.json({ error: "Verification limit reached. Try again in 15 minutes." }, { status: 429 });

  const code = randomOtp();
  const codeHash = createHmac("sha256", authSecret()).update(`${key}:${code}`).digest("hex");
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
  await prisma.otpChallenge.upsert({
    where: { key },
    update: {
      channel, purpose: "registration", codeHash, attempts: 0, sendCount,
      sendWindowStartedAt: withinWindow ? existing!.sendWindowStartedAt : now,
      expiresAt, lockedUntil: null, verifiedAt: null, consumedAt: null,
    },
    create: { key, channel, purpose: "registration", codeHash, sendCount: 1, sendWindowStartedAt: now, expiresAt },
  });

  // Deliberately visible only in this local development preview. Never sent as a production response.
  return Response.json({
    message: `Development-only ${channel} verification code created. No email or SMS was sent.`,
    delivery: "LOCAL_PREVIEW_ONLY",
    previewCode: code,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
  });
}
