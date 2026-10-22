import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./app/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

// Configure these only after ICT supplies the authoritative MIU OIDC issuer/client.
// The local credential provider remains for controlled development/bootstrap use.
const oidcProvider = process.env.MIU_IDP_ISSUER && process.env.MIU_IDP_CLIENT_ID && process.env.MIU_IDP_CLIENT_SECRET
  ? [{
      id: "miu-oidc",
      name: "MIU Identity",
      type: "oidc" as const,
      issuer: process.env.MIU_IDP_ISSUER,
      clientId: process.env.MIU_IDP_CLIENT_ID,
      clientSecret: process.env.MIU_IDP_CLIENT_SECRET,
      checks: ["pkce", "state"] as ["pkce", "state"],
    } as any]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      name: "MIU Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password || email.length > 254 || password.length > 1024) return null;

        // HMAC the email+IP key so the throttle does not store raw login identifiers.
        const forwarded = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
        const ip = forwarded || request?.headers?.get("x-real-ip") || "unknown";
        const throttleKey = createHmac("sha256", process.env.AUTH_SECRET!).update(`${ip}:${email}`).digest("hex");
        const now = new Date();
        const throttle = await prisma.authThrottle.findUnique({ where: { key: throttleKey } });
        if (throttle?.lockedUntil && throttle.lockedUntil > now) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const applicantVerified = user?.role !== "APPLICANT" || Boolean(user.emailVerified && user.phoneVerified);
        const valid = Boolean(user?.passwordHash && user.isActive && applicantVerified && await bcrypt.compare(password, user.passwordHash));
        if (!valid || !user) {
          const withinWindow = throttle && now.getTime() - throttle.windowStartedAt.getTime() < WINDOW_MS;
          const failures = withinWindow ? throttle!.failures + 1 : 1;
          const windowStartedAt = withinWindow ? throttle!.windowStartedAt : now;
          await prisma.authThrottle.upsert({
            where: { key: throttleKey },
            update: {
              failures,
              windowStartedAt,
              lockedUntil: failures >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null,
            },
            create: {
              key: throttleKey,
              failures,
              windowStartedAt,
              lockedUntil: failures >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null,
            },
          });
          return null;
        }

        await prisma.authThrottle.deleteMany({ where: { key: throttleKey } });
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "auth.login",
            entity: "User",
            entityId: user.id,
            ip: ip === "unknown" ? null : ip,
            userAgent: request?.headers?.get("user-agent") || null,
          },
        });
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now } });
        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      },
    }),
    ...oidcProvider,
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role;
      } else if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: String(token.email).toLowerCase() } });
        token.role = dbUser?.isActive ? dbUser.role : "DISABLED";
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
