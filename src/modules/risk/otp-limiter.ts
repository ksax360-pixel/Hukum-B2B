/**
 * Shared OTP rate limiter (risk register M2) — phone + IP + purpose.
 * Process-local with durable PhoneOtp counts as secondary check.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_PHONE = Number(process.env.OTP_MAX_PER_PHONE_HOUR || 5);
const MAX_PER_IP = Number(process.env.OTP_MAX_PER_IP_HOUR || 20);

function key(parts: string[]) {
  return parts.join("|");
}

function touch(k: string, max: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const cur = buckets.get(k);
  if (!cur || cur.resetAt < now) {
    buckets.set(k, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: max - 1 };
  }
  if (cur.count >= max) return { ok: false, remaining: 0 };
  cur.count += 1;
  return { ok: true, remaining: max - cur.count };
}

export function checkOtpRateLimit(opts: {
  phone: string;
  ip?: string;
  purpose: string;
}): { ok: boolean; reason?: string; remainingPhone: number; remainingIp: number } {
  const phoneDigits = String(opts.phone || "").replace(/\D/g, "");
  const phoneRes = touch(key(["otp", opts.purpose, phoneDigits]), MAX_PER_PHONE);
  const ipRes = opts.ip
    ? touch(key(["otp-ip", opts.purpose, opts.ip]), MAX_PER_IP)
    : { ok: true, remaining: MAX_PER_IP };
  if (!phoneRes.ok) {
    return {
      ok: false,
      reason: "Too many OTP requests for this number. Try again later.",
      remainingPhone: 0,
      remainingIp: ipRes.remaining,
    };
  }
  if (!ipRes.ok) {
    return {
      ok: false,
      reason: "Too many OTP requests from this network. Try again later.",
      remainingPhone: phoneRes.remaining,
      remainingIp: 0,
    };
  }
  return {
    ok: true,
    remainingPhone: phoneRes.remaining,
    remainingIp: ipRes.remaining,
  };
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Never expose demo OTP in production (risk M2). Opt-in only via ALLOW_DEMO_OTP=true. */
export function shouldExposeDemoOtp() {
  if (process.env.FORCE_HIDE_DEMO_OTP === "true") return false;
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_OTP !== "true") return false;
  if (process.env.NODE_ENV === "production" && process.env.SMS_PROVIDER) return false;
  if (process.env.NODE_ENV === "production" && process.env.HIDE_DEMO_OTP === "true") return false;
  return process.env.NODE_ENV !== "production" || !process.env.SMS_PROVIDER;
}
