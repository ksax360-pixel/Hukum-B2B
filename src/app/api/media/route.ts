import { access, readFile } from "fs/promises";
import path from "path";
import { absoluteFromRelative, isPublicRelative } from "@/lib/upload-paths";
import { storageRoot } from "@/lib/storage";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Serve public uploads. Checks Hukum storage root first, then Backend uploads
 * (seller uploads often land there while the marketplace reads this route).
 */
export async function GET(req: Request) {
  const rel = String(new URL(req.url).searchParams.get("path") || "").replace(/^[/\\]+/, "");
  const type = TYPES[path.extname(rel).toLowerCase()];
  if (!rel || !type || rel.includes("..") || !isPublicRelative(rel)) {
    return new Response("Not found", { status: 404 });
  }

  const candidates = [
    absoluteFromRelative(rel),
    path.resolve("/root/Hijra-B2b/Backend/uploads", rel),
    path.resolve(storageRoot(), rel),
  ];

  for (const abs of candidates) {
    try {
      await access(abs);
      const buf = await readFile(abs);
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      /* try next root */
    }
  }

  return new Response("Not found", { status: 404 });
}
