/**
 * Shared contact-reveal policy (Hukum risk register C1).
 * Consent-first · WhatsApp / session as identity · daily caps · audit every reveal.
 * First contact stays on Hukum relay — never dump raw supplier numbers in agent chat.
 */

import { createHash } from "crypto";
import { connectDB } from "@/lib/db";
import { AnalyticsEvent } from "@/modules/platform/platform.model";

export const DAILY_REVEAL_CAP = Number(process.env.HUKUM_DAILY_REVEAL_CAP || 10);
export const DAILY_WA_REVEAL_CAP = Number(process.env.HUKUM_DAILY_WA_REVEAL_CAP || 5);

export type ContactGateInput = {
  phoneVerified?: boolean;
  pdplConsent?: boolean;
  userId?: string | null;
  /** Channel requesting reveal */
  channel?: "web" | "whatsapp" | "inbox";
  revealCountToday?: number;
  revealDayKey?: string;
  /** Buyer verification tier — verified buyers get full cap */
  buyerVerified?: boolean;
};

export type ContactGateResult = {
  allowed: boolean;
  identified: boolean;
  remaining: number;
  dayKey: string;
  cap: number;
  reason?: string;
  mode: "relay" | "reveal" | "blocked";
};

export function hashPhone(phone?: string | null) {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return undefined;
  return createHash("sha256").update(digits).digest("hex").slice(0, 16);
}

export function evaluateContactGate(opts: ContactGateInput): ContactGateResult {
  const today = new Date().toISOString().slice(0, 10);
  const channel = opts.channel || "web";
  const cap =
    channel === "whatsapp"
      ? DAILY_WA_REVEAL_CAP
      : opts.buyerVerified
        ? DAILY_REVEAL_CAP
        : Math.min(DAILY_REVEAL_CAP, 5); // unverified buyers: tighter
  const count = opts.revealDayKey === today ? opts.revealCountToday || 0 : 0;

  // Identity: signed-in OR (phone OTP verified AND PDPL). PDPL alone is NOT enough.
  const identified = Boolean(
    opts.userId || (opts.phoneVerified && opts.pdplConsent)
  );

  if (!identified) {
    return {
      allowed: false,
      identified: false,
      remaining: cap,
      dayKey: today,
      cap,
      reason:
        channel === "whatsapp"
          ? "Verify WhatsApp number (OTP) and PDPL consent before supplier contact."
          : "Sign in, or verify phone OTP + PDPL consent before supplier contact.",
      mode: "blocked",
    };
  }

  // PDPL consent required for every reveal — including signed-in sessions.
  if (!opts.pdplConsent) {
    return {
      allowed: false,
      identified: true,
      remaining: Math.max(0, cap - count),
      dayKey: today,
      cap,
      reason: "PDPL consent required before any contact reveal or outreach.",
      mode: "blocked",
    };
  }

  if (count >= cap) {
    return {
      allowed: false,
      identified: true,
      remaining: 0,
      dayKey: today,
      cap,
      reason: `Daily contact reveal cap reached (${cap}/${channel}).`,
      mode: "blocked",
    };
  }

  return {
    allowed: true,
    identified: true,
    remaining: Math.max(0, cap - count),
    dayKey: today,
    cap,
    mode: "relay", // agent always uses relay; inbox mutual reveal is separate
  };
}

/** Increment session counters correctly (fixes day-key bug). */
export function bumpRevealCount(session: {
  revealDayKey?: string;
  revealCountToday?: number;
}, dayKey: string, by = 1) {
  if (session.revealDayKey !== dayKey) {
    session.revealDayKey = dayKey;
    session.revealCountToday = by;
  } else {
    session.revealCountToday = (session.revealCountToday || 0) + by;
  }
  return session.revealCountToday;
}

/** Count successful reveals today (for daily caps on web reveal API). */
export async function countRevealsToday(opts: {
  userId?: string | null;
  phone?: string | null;
}): Promise<{ count: number; dayKey: string }> {
  const dayKey = new Date().toISOString().slice(0, 10);
  await connectDB();
  const start = new Date(`${dayKey}T00:00:00.000Z`);
  const filter: Record<string, unknown> = {
    type: "contact_revealed",
    createdAt: { $gte: start },
  };
  if (opts.userId) {
    // AnalyticsEvent.userId is ObjectId — skip invalid ids rather than throw.
    if (!/^[a-f\d]{24}$/i.test(String(opts.userId))) return { count: 0, dayKey };
    filter.userId = opts.userId;
  } else if (opts.phone) {
    const phoneHash = hashPhone(opts.phone);
    if (!phoneHash) return { count: 0, dayKey };
    filter["meta.phoneHash"] = phoneHash;
  } else {
    return { count: 0, dayKey };
  }
  try {
    const count = await AnalyticsEvent.countDocuments(filter);
    return { count, dayKey };
  } catch {
    return { count: 0, dayKey };
  }
}

/** Audit trail — never store raw phone; hash only. */
export async function logContactReveal(opts: {
  type?: "contact_revealed" | "click_reveal_contact" | "agent_outreach_sent" | "inbox_reveal";
  userId?: string;
  vendorId?: string;
  productId?: string;
  via: string;
  phone?: string;
  channel?: string;
  meta?: Record<string, unknown>;
}) {
  await connectDB();
  await AnalyticsEvent.create({
    type: opts.type || "contact_revealed",
    userId: opts.userId || undefined,
    vendorId: opts.vendorId || undefined,
    productId: opts.productId || undefined,
    meta: {
      via: opts.via,
      channel: opts.channel || "web",
      phoneHash: hashPhone(opts.phone),
      hukumRelay: true,
      recordedAt: new Date().toISOString(),
      ...(opts.meta || {}),
    },
  }).catch(() => undefined);
}
