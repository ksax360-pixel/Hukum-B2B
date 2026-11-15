import { ok, fail } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { persistUpload } from "@/lib/persist-upload";
import type { UploadKind } from "@/lib/upload-paths";
import { sniffImage } from "@/lib/sniff-image";

const KINDS: UploadKind[] = ["product", "company_logo", "company_cover"];

/** Supplier image upload (product photos, logo, cover). Returns a /api/media URL. */
export async function POST(req: Request) {
  try {
    const session = await requireSession("products:create");
    if (!session.vendorId) return fail("Supplier account required", 403);
    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "product") as UploadKind;
    if (!(file instanceof File)) return fail("No file", 400);
    if (!KINDS.includes(kind)) return fail("Unknown upload kind", 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    // Trust the bytes, not the browser's label.
    const mimeType = sniffImage(buffer);
    if (!mimeType) return fail("Use a JPG, PNG or WebP image", 415);
    const productId = String(form.get("productId") || "").replace(/[^a-f\d]/gi, "").slice(0, 24) || undefined;
    const saved = await persistUpload({ kind, buffer, originalName: `image.${mimeType.split("/")[1].replace("jpeg", "jpg")}`, mimeType, vendorId: session.vendorId, productId });
    return ok({ url: saved.url }, "Uploaded", 201);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
