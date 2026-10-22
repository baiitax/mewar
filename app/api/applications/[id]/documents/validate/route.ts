import { prisma } from "@/app/lib/db";
import { getApplicantIdentity } from "@/app/lib/applicant-session";

export const runtime = "nodejs";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 64 * 1024;
const CATEGORIES = new Set(["OLE_LEVEL_RESULT", "JAMB_RESULT", "PASSPORT_PHOTO", "OTHER"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Document uploads are disabled; secure storage and malware scanning are not integrated." }, { status: 503 });
  const applicant = await getApplicantIdentity();
  if (!applicant) return Response.json({ error: "Applicant sign-in required." }, { status: 401 });
  const { id } = await params;
  const application = await prisma.application.findFirst({ where: { id, applicantId: applicant.id }, select: { id: true, status: true } });
  if (!application) return Response.json({ error: "Application not found." }, { status: 404 });
  if (!["DRAFT", "NEEDS_INFORMATION"].includes(application.status)) return Response.json({ error: "Document checks are closed for this application." }, { status: 409 });
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (!contentLength || contentLength > MAX_REQUEST_BYTES) return Response.json({ error: `Send one file with a request size under ${Math.ceil(MAX_REQUEST_BYTES / 1024 / 1024)} MB.` }, { status: contentLength > MAX_REQUEST_BYTES ? 413 : 411 });

  let form: FormData;
  try { form = await req.formData(); } catch { return Response.json({ error: "Could not read multipart file data." }, { status: 400 }); }
  const file = form.get("file");
  const category = String(form.get("category") || "");
  if (!(file instanceof File) || file.size <= 0) return Response.json({ error: "Choose one file to validate." }, { status: 400 });
  if (!CATEGORIES.has(category)) return Response.json({ error: "Choose a checklist category." }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return Response.json({ error: "Preview limit is 5 MB per file." }, { status: 413 });

  const extension = file.name.toLowerCase().split(".").pop() || "";
  const supported = new Set(["pdf", "png", "jpg", "jpeg"]);
  if (!supported.has(extension)) return Response.json({ error: "Preview accepts PDF, PNG, or JPEG files only." }, { status: 415 });
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const starts = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  const looksPdf = bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  const looksPng = starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const looksJpeg = starts(0xff, 0xd8, 0xff);
  const mimeMatches = (looksPdf && file.type === "application/pdf" && extension === "pdf")
    || (looksPng && file.type === "image/png" && extension === "png")
    || (looksJpeg && file.type === "image/jpeg" && ["jpg", "jpeg"].includes(extension));
  if (!mimeMatches) return Response.json({ error: "The file extension, browser MIME type, and file signature do not agree." }, { status: 415 });

  // File bytes are validated in memory and discarded. This endpoint stores nothing and has no malware scanner.
  await prisma.auditLog.create({ data: {
    userId: applicant.userId,
    action: "applicant.document.preview_validate",
    entity: "Application",
    entityId: application.id,
    after: JSON.stringify({ category, format: extension === "jpeg" ? "jpg" : extension, bytes: file.size, stored: false, scanned: false }),
  } });
  return Response.json({
    validFormat: true,
    category,
    format: extension === "jpeg" ? "jpg" : extension,
    bytes: file.size,
    stored: false,
    malwareScan: "NOT_AVAILABLE",
    notice: "This preview checked file size, extension, MIME type, and signature only. The file was discarded; it was not securely stored or malware-scanned and is not an official submission.",
  });
}
