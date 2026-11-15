import { mkdir, readFile, writeFile, access } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const LOCAL_PREFIX = "local:";

export function storageRoot() {
  const configured = process.env.STORAGE_LOCAL_PATH || "./uploads";
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function isLocalStorageRef(fileUrl: string) {
  return typeof fileUrl === "string" && fileUrl.startsWith(LOCAL_PREFIX);
}

export function localRefToAbsolute(fileUrl: string) {
  if (!isLocalStorageRef(fileUrl)) return null;
  const rel = fileUrl.slice(LOCAL_PREFIX.length).replace(/^[/\\]+/, "");
  const abs = path.resolve(storageRoot(), rel);
  const root = path.resolve(storageRoot());
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error("Invalid storage path");
  }
  return abs;
}

export async function writePrivateFile(buffer: Buffer, originalName: string, mimeType?: string) {
  const safe = String(originalName || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 80);
  const rel = path.join(randomUUID(), safe || "file");
  const abs = path.join(storageRoot(), rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return {
    fileUrl: `${LOCAL_PREFIX}${rel.replace(/\\/g, "/")}`,
    mimeType: mimeType || "application/octet-stream",
    size: buffer.length,
    name: safe,
  };
}

export async function readPrivateFile(fileUrl: string) {
  const abs = localRefToAbsolute(fileUrl);
  if (!abs) throw new Error("Not a local storage reference");
  await access(abs);
  return readFile(abs);
}
