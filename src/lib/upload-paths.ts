import path from "path";
import { randomUUID } from "crypto";
import { storageRoot } from "@/lib/storage";

/**
 * Production folder layout (multer diskStorage destinations):
 *
 * uploads/
 *   private/documents/{vendorId}/{docType}/
 *   public/products/{vendorFolder}/{productId}/
 *   public/companies/{vendorFolder}/logo|cover/
 *   public/categories/{categoryId}/
 *   public/industries/{industryId}/
 */

export type UploadKind =
  | "document"
  | "product"
  | "company_logo"
  | "company_cover"
  | "category"
  | "industry";

export const UPLOAD_LIMITS: Record<UploadKind, { maxBytes: number; mimes: string[] }> = {
  document: {
    maxBytes: 10 * 1024 * 1024,
    mimes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  },
  product: {
    maxBytes: 5 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  company_logo: {
    maxBytes: 3 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp"],
  },
  company_cover: {
    maxBytes: 5 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp"],
  },
  category: {
    maxBytes: 3 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp"],
  },
  industry: {
    maxBytes: 3 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp"],
  },
};

export function sanitizeSegment(input: string, fallback = "unknown") {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return s || fallback;
}

export function sanitizeFilename(originalName: string) {
  const base = path.basename(String(originalName || "file"));
  const ext = path.extname(base).toLowerCase().slice(0, 10);
  const stem = path.basename(base, ext).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 60) || "file";
  return `${Date.now()}-${randomUUID().slice(0, 8)}-${stem}${ext}`;
}

export function vendorFolderName(vendorId: string, companyName?: string) {
  const slug = companyName ? sanitizeSegment(companyName, "") : "";
  const id = sanitizeSegment(vendorId, "vendor");
  return slug ? `${slug}-${id.slice(-8)}` : id;
}

export function resolveUploadRelativePath(opts: {
  kind: UploadKind;
  vendorId?: string;
  vendorFolder?: string;
  productId?: string;
  categoryId?: string;
  industryId?: string;
  docType?: string;
  filename: string;
}) {
  const file = sanitizeFilename(opts.filename);
  switch (opts.kind) {
    case "document": {
      const vendorId = sanitizeSegment(opts.vendorId || "unknown");
      const docType = sanitizeSegment(opts.docType || "other");
      return path.join("private", "documents", vendorId, docType, file);
    }
    case "product": {
      const folder = sanitizeSegment(opts.vendorFolder || opts.vendorId || "vendor");
      const productId = sanitizeSegment(opts.productId || "draft");
      return path.join("public", "products", folder, productId, file);
    }
    case "company_logo": {
      const folder = sanitizeSegment(opts.vendorFolder || opts.vendorId || "vendor");
      return path.join("public", "companies", folder, "logo", file);
    }
    case "company_cover": {
      const folder = sanitizeSegment(opts.vendorFolder || opts.vendorId || "vendor");
      return path.join("public", "companies", folder, "cover", file);
    }
    case "category": {
      const categoryId = sanitizeSegment(opts.categoryId || "category");
      return path.join("public", "categories", categoryId, file);
    }
    case "industry": {
      const industryId = sanitizeSegment(opts.industryId || opts.categoryId || "industry");
      return path.join("public", "industries", industryId, file);
    }
    default:
      throw new Error("Unknown upload kind");
  }
}

export function absoluteFromRelative(rel: string) {
  const root = path.resolve(storageRoot());
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error("Invalid upload path");
  }
  return abs;
}

export function isPublicRelative(rel: string) {
  return rel.replace(/\\/g, "/").startsWith("public/");
}

/** Public URL served by GET /api/media?path= */
export function publicMediaUrl(rel: string) {
  const normalized = rel.replace(/\\/g, "/");
  return `/api/media?path=${encodeURIComponent(normalized)}`;
}

export function privateLocalRef(rel: string) {
  return `local:${rel.replace(/\\/g, "/")}`;
}
