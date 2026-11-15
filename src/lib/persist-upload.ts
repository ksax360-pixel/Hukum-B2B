import { mkdir, writeFile, copyFile, access } from "fs/promises";
import path from "path";
import type { UploadKind } from "@/lib/upload-paths";
import {
  UPLOAD_LIMITS,
  absoluteFromRelative,
  privateLocalRef,
  publicMediaUrl,
  resolveUploadRelativePath,
  vendorFolderName,
} from "@/lib/upload-paths";

export type PersistUploadInput = {
  kind: UploadKind;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  vendorId?: string;
  vendorFolder?: string;
  productId?: string;
  categoryId?: string;
  industryId?: string;
  docType?: string;
};

export function assertUploadAllowed(kind: UploadKind, mimeType: string, size: number) {
  const limits = UPLOAD_LIMITS[kind];
  if (!limits) throw new Error(`Unknown upload kind: ${kind}`);
  if (!limits.mimes.includes(mimeType)) {
    throw Object.assign(new Error(`File type not allowed: ${mimeType}`), { status: 415 });
  }
  if (size > limits.maxBytes) {
    throw Object.assign(
      new Error(`File too large (max ${Math.round(limits.maxBytes / 1024 / 1024)}MB)`),
      { status: 413 }
    );
  }
}

/** Write a buffer into the multer disk layout under uploads/. */
export async function persistUpload(input: PersistUploadInput) {
  assertUploadAllowed(input.kind, input.mimeType, input.buffer.length);

  const relativePath = resolveUploadRelativePath({
    kind: input.kind,
    vendorId: input.vendorId,
    vendorFolder: input.vendorFolder,
    productId: input.productId,
    categoryId: input.categoryId,
    industryId: input.industryId,
    docType: input.docType,
    filename: input.originalName,
  });
  const abs = absoluteFromRelative(relativePath);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, input.buffer);

  const normalized = relativePath.replace(/\\/g, "/");
  const isPublic = normalized.startsWith("public/");

  return {
    relativePath: normalized,
    url: isPublic ? publicMediaUrl(normalized) : privateLocalRef(normalized),
    mimeType: input.mimeType,
    size: input.buffer.length,
    name: path.basename(normalized),
  };
}

/**
 * Copy a static public image (e.g. /products/helmet.jpg) into multer product storage
 * and return a /api/media URL. Used by seed scripts so Mongo products store multer paths.
 */
export async function copyPublicAssetToProductUpload(opts: {
  publicUrl: string;
  vendorId: string;
  companyName?: string;
  productId: string;
  alt?: { en?: string; ar?: string };
  isPrimary?: boolean;
  order?: number;
}) {
  const publicUrl = opts.publicUrl.startsWith("/") ? opts.publicUrl : `/${opts.publicUrl}`;
  const srcAbs = path.join(process.cwd(), "public", publicUrl.replace(/^\//, ""));
  await access(srcAbs);

  const folder = vendorFolderName(opts.vendorId, opts.companyName);
  const relativePath = resolveUploadRelativePath({
    kind: "product",
    vendorFolder: folder,
    productId: opts.productId,
    filename: path.basename(srcAbs),
  });
  const destAbs = absoluteFromRelative(relativePath);
  await mkdir(path.dirname(destAbs), { recursive: true });
  await copyFile(srcAbs, destAbs);

  const normalized = relativePath.replace(/\\/g, "/");
  return {
    url: publicMediaUrl(normalized),
    type: "image" as const,
    isPrimary: Boolean(opts.isPrimary),
    order: opts.order ?? 0,
    alt: opts.alt || { en: "", ar: "" },
    relativePath: normalized,
  };
}
