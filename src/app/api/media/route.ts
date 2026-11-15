import { readFile } from "fs/promises";
import path from "path";
import { absoluteFromRelative, isPublicRelative } from "@/lib/upload-paths";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

/** Serves files under uploads/public only. Private documents never go out through here. */
export async function GET(req: Request) {
  const rel = new URL(req.url).searchParams.get("path") || "";
  const type = TYPES[path.extname(rel).toLowerCase()];
  if (!rel || !type || !isPublicRelative(rel)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(absoluteFromRelative(rel));
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
