import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";
import type { UploadKind } from "@/lib/upload-paths";
import {
  UPLOAD_LIMITS,
  absoluteFromRelative,
  resolveUploadRelativePath,
  sanitizeFilename,
} from "@/lib/upload-paths";

export type UploadContext = {
  kind: UploadKind;
  vendorId?: string;
  vendorFolder?: string;
  productId?: string;
  categoryId?: string;
  docType?: string;
};

/**
 * Multer diskStorage — destinations mirror Hukum folder layout.
 * Used by the upload route via memory+write OR when wrapping Node streams.
 */
export function createDiskStorage(ctx: UploadContext) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      try {
        const relDir = path.dirname(
          resolveUploadRelativePath({
            ...ctx,
            filename: "placeholder.bin",
          })
        );
        const abs = absoluteFromRelative(relDir);
        mkdirSync(abs, { recursive: true });
        cb(null, abs);
      } catch (e) {
        cb(e as Error, "");
      }
    },
    filename(_req, file, cb) {
      cb(null, sanitizeFilename(file.originalname));
    },
  });
}

export function createMulter(ctx: UploadContext) {
  const limits = UPLOAD_LIMITS[ctx.kind];
  return multer({
    storage: createDiskStorage(ctx),
    limits: { fileSize: limits.maxBytes, files: 8 },
    fileFilter(_req, file, cb) {
      if (!limits.mimes.includes(file.mimetype)) {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
        return;
      }
      cb(null, true);
    },
  });
}

/** Memory storage + manual write — preferred for Next.js App Router FormData. */
export function createMemoryMulter(kind: UploadKind) {
  const limits = UPLOAD_LIMITS[kind];
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: limits.maxBytes, files: 8 },
    fileFilter(_req, file, cb) {
      if (!limits.mimes.includes(file.mimetype)) {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
        return;
      }
      cb(null, true);
    },
  });
}
