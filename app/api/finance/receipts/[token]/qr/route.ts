import QRCode from "qrcode";
import { makeReceiptVerificationUrl } from "@/app/lib/finance-preview";
import { prisma } from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Preview receipt QR codes are disabled in production." }, { status: 503 });
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) return Response.json({ error: "Receipt not found." }, { status: 404 });
  const payment = await prisma.financePayment.findUnique({ where: { receiptToken: token }, select: { id: true, status: true, providerName: true } });
  if (!payment || payment.status !== "PREVIEW_CAPTURED" || payment.providerName !== "PREVIEW_SIMULATOR") {
    return Response.json({ error: "Receipt not found." }, { status: 404 });
  }
  let verifyUrl: string;
  try { verifyUrl = makeReceiptVerificationUrl(request, token); }
  catch { return Response.json({ error: "Receipt verification URL is not configured." }, { status: 500 }); }
  const png = await QRCode.toBuffer(verifyUrl, { errorCorrectionLevel: "M", margin: 1, width: 256 });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
