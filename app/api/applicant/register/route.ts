import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/db";
import { authSecret, identifierKey, normalizeEmail, normalizePhone, text } from "@/app/lib/applicant-portal";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Applicant registration is disabled until an approved email/SMS verification service is connected." }, { status: 503 });
  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const email = normalizeEmail(body?.email);
  const phone = normalizePhone(body?.phone);
  const name = text(body?.name, 100);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !phone || !name || name.length < 2) return Response.json({ error: "Enter a valid email, international phone number, and full name." }, { status: 400 });
  if (password.length < 12 || password.length > 128) return Response.json({ error: "Use a password between 12 and 128 characters." }, { status: 400 });

  const emailKey = identifierKey("email", "registration", email);
  const phoneKey = identifierKey("phone", "registration", phone);
  const now = new Date();
  const [emailChallenge, phoneChallenge, duplicate] = await Promise.all([
    prisma.otpChallenge.findUnique({ where: { key: emailKey } }),
    prisma.otpChallenge.findUnique({ where: { key: phoneKey } }),
    prisma.user.findFirst({ where: { OR: [{ email }, { phone }] }, select: { id: true } }),
  ]);
  if (duplicate) return Response.json({ error: "An account already uses that email or phone. Sign in, or contact Admissions if you need account help." }, { status: 409 });
  for (const [channel, challenge] of [["email", emailChallenge], ["phone", phoneChallenge]] as const) {
    if (!challenge || !challenge.verifiedAt || challenge.consumedAt || challenge.expiresAt <= now || (challenge.lockedUntil && challenge.lockedUntil > now)) {
      return Response.json({ error: `Verify your ${channel} within the code validity period before creating an account.` }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.$transaction(async tx => {
      const consumed = await tx.otpChallenge.updateMany({
        where: { key: { in: [emailKey, phoneKey] }, verifiedAt: { not: null }, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 2) throw new Error("OTP_CHALLENGE_CHANGED");
      const created = await tx.user.create({
        data: {
          email, phone, name, passwordHash, role: "APPLICANT", isActive: true,
          emailVerified: now, phoneVerified: true,
          applicant: { create: { nationality: "Nigeria" } },
        },
        select: { id: true },
      });
      await tx.auditLog.create({ data: { userId: created.id, action: "applicant.account.create", entity: "Applicant", entityId: created.id } });
      return created;
    });
    return Response.json({ registered: true, message: "Preview applicant account created. Sign in to continue.", next: "/login?registered=1" }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "OTP_CHALLENGE_CHANGED") return Response.json({ error: "A verification code expired or was already used. Verify both contacts again." }, { status: 409 });
    if (error?.code === "P2002") return Response.json({ error: "An account already uses that email or phone. Sign in, or contact Admissions if you need account help." }, { status: 409 });
    throw error;
  }
}
