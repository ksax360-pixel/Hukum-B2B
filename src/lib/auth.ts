import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { hasPermission, type Permission } from "./rbac";

const COOKIE = "kt_session";

export type SessionUser = {
  id: string;
  email: string;
  roles: string[];
  vendorId?: string;
  organizationId?: string;
  preferredLanguage?: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.AUTH_TOKEN_TTL || "7d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      id: String(payload.id),
      email: String(payload.email),
      roles: (payload.roles as string[]) || [],
      vendorId: payload.vendorId ? String(payload.vendorId) : undefined,
      organizationId: payload.organizationId ? String(payload.organizationId) : undefined,
      preferredLanguage: payload.preferredLanguage ? String(payload.preferredLanguage) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * True when the request comes from another Hukum app (admin., seller.) rather than the public site.
 * Those apps authenticate with the bearer token in the login response; giving them the public
 * session cookie made an admin login replace the buyer's session on hukum-ksa.com (retest N1).
 */
async function isOtherAppOrigin(): Promise<boolean> {
  const publicHost = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!publicHost) return false;
  const origin = (await headers()).get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(publicHost).host;
  } catch {
    return false;
  }
}

export async function setSessionCookie(token: string) {
  if (await isOtherAppOrigin()) return;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    // Host-only on purpose: never set a parent `domain` (e.g. .hukum-ksa.com), or admin and
    // seller sessions leak onto the public site and vice versa.
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  // Bearer token first — used by Main Admin Panel (cross-origin).
  const hdrs = await headers();
  const auth = hdrs.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const bearer = auth.slice(7).trim();
    if (bearer) return verifySessionToken(bearer);
  }

  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(permission?: Permission) {
  const session = await getSession();
  if (!session) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  if (permission && !hasPermission(session.roles, permission)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return session;
}
