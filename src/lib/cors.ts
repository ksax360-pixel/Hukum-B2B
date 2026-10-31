import { NextResponse } from "next/server";

const DEFAULT_ORIGINS = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",
];

export function allowedAdminOrigins() {
  const fromEnv = (process.env.ADMIN_CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ORIGINS;
}

export function resolveCorsOrigin(requestOrigin: string | null) {
  const allowed = allowedAdminOrigins();
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  // Do not echo a different allowlisted origin — browsers reject mismatches as CORS failures.
  return "";
}

export function corsHeaders(requestOrigin: string | null): HeadersInit {
  const allowOrigin = resolveCorsOrigin(requestOrigin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
}

/** Wrap a Route Handler JSON response with CORS for the admin panel. */
export function withCors(req: Request, res: NextResponse) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export function corsPreflight(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}
