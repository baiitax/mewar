import { auth } from "@/auth";
import { prisma } from "@/app/lib/db";

export async function getApplicantIdentity() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  if (!session?.user || role !== "APPLICANT" || typeof userId !== "string") return null;
  const applicant = await prisma.applicant.findUnique({ where: { userId }, select: { id: true, userId: true } });
  return applicant;
}
