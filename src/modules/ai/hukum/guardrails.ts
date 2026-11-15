import type { ShortlistItem } from "./types";
import {
  evaluateContactGate,
  type ContactGateInput,
  DAILY_REVEAL_CAP,
} from "@/modules/risk/contact-gate";
import { scanRestrictedText } from "@/modules/risk/restricted-goods";

export { DAILY_REVEAL_CAP };

/** Never invent prices — only pass through DB-backed shortlist fields. */
export function assertGroundedProducts(items: ShortlistItem[]): ShortlistItem[] {
  return items.map((p) => ({
    productId: p.productId,
    vendorId: p.vendorId,
    name: p.name,
    slug: p.slug,
    href: p.href,
    vendorName: p.vendorName,
    city: p.city,
    verified: Boolean(p.verified),
    paidPriority: Boolean(p.paidPriority),
    score: typeof p.score === "number" ? p.score : 0,
    // Only DB-backed price labels; never invent numbers
    priceLabel:
      p.priceLabel && /request|طلب|sar|ر\.س|\d/i.test(p.priceLabel)
        ? p.priceLabel
        : "Price on request",
  }));
}

export function canRevealContact(opts: ContactGateInput & { revealCountToday?: number; revealDayKey?: string }) {
  const r = evaluateContactGate(opts);
  return {
    allowed: r.allowed,
    identified: r.identified,
    remaining: r.remaining,
    dayKey: r.dayKey,
    reason: r.reason,
    mode: r.mode,
    cap: r.cap,
  };
}

export function detectEscalation(message: string): string | null {
  if (/complaint|fraud|scam|lawyer|police|شكوى|احتيال|محام|شرطة/i.test(message)) {
    return "complaint_or_legal";
  }
  const restricted = scanRestrictedText(message);
  if (restricted.hit && (restricted.level === "block" || restricted.level === "escalate")) {
    return "regulated_product";
  }
  if (/weapon|explosive|chem(?:ical)?\s*weapon|سلاح|متفجر|كيماوي/i.test(message)) {
    return "regulated_product";
  }
  if (/speak to (a )?human|real person|agent please|موظف|بشري|خدمة العملاء/i.test(message)) {
    return "human_requested";
  }
  return null;
}

/** Agent must never auto-accept quotes or close deals. */
export function humanControlBlockedActions() {
  return ["accept_quote", "close_deal", "send_without_approval"] as const;
}

export function withinWhatsAppWindow(lastInboundAt?: Date | string | null) {
  if (!lastInboundAt) return false;
  const t = new Date(lastInboundAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 24 * 3600 * 1000;
}

/** Fair rotation: shuffle same-score featured items so paid boost is labelled not sticky. */
export function rotateFeatured<T extends { paidPriority?: boolean; score?: number }>(items: T[]): T[] {
  const featured = items.filter((i) => i.paidPriority);
  const organic = items.filter((i) => !i.paidPriority);
  const byScore = (a: T, b: T) => (b.score || 0) - (a.score || 0);
  const organicSorted = [...organic].sort(byScore);
  if (featured.length <= 1) {
    return [...featured.sort(byScore), ...organicSorted];
  }
  // Rotate paid bucket by hour; do not re-sort across paid+organic (would undo rotation).
  const featuredSorted = [...featured].sort(byScore);
  const offset = new Date().getUTCHours() % featuredSorted.length;
  const rotated = [...featuredSorted.slice(offset), ...featuredSorted.slice(0, offset)];
  return [...rotated, ...organicSorted];
}
