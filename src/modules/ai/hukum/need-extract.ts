import type { NeedSlots } from "./types";
import { normalizeBuyerText } from "./locale-normalize";

const CITIES: { value: string; re: RegExp }[] = [
  { value: "Riyadh", re: /\b(riyadh|رياض)\b/i },
  { value: "Jeddah", re: /\b(jeddah|جدة|جده)\b/i },
  { value: "Dammam", re: /\b(dammam|دمام)\b/i },
  { value: "Khobar", re: /\b(khobar|خبر)\b/i },
  { value: "Mecca", re: /\b(mecca|makkah|مكة)\b/i },
  { value: "Medina", re: /\b(medina|madinah|مدينة\s*المنورة)\b/i },
  { value: "Jubail", re: /\b(jubail|جبيل)\b/i },
  { value: "Neom", re: /\b(neom|نيوم)\b/i },
];

const CATEGORIES: { value: string; re: RegExp }[] = [
  { value: "safety_helmet", re: /helmet|خوذة|hard.?hat/i },
  { value: "gloves", re: /glove|قفاز/i },
  { value: "footwear", re: /boot|shoe|حذاء|جزمة/i },
  { value: "eye_protection", re: /goggle|eye.?protect|نظار/i },
  { value: "respiratory", re: /mask|respirat|كمام/i },
  { value: "hi_vis", re: /vest|سترة|reflect/i },
  { value: "fire_safety", re: /fire|extinguish|حريق|إطفاء/i },
  { value: "ppe", re: /safety|ppe|معدات.?سلامة|سلامة/i },
];

export function extractNeedSlots(message: string, prev: NeedSlots = {}): NeedSlots {
  const { normalized } = normalizeBuyerText(message);
  const next: NeedSlots = { ...prev, rawText: [prev.rawText, normalized].filter(Boolean).join(" | ").slice(-800) };

  for (const c of CITIES) {
    if (c.re.test(normalized)) {
      next.city = c.value;
      break;
    }
  }
  for (const c of CATEGORIES) {
    if (c.re.test(normalized)) {
      next.category = c.value;
      break;
    }
  }

  const qty =
    normalized.match(/\b(\d{1,6})\s*(pcs|pc|pieces|units|unit|قطعة|قطعه|حبة|حبه)?\b/i) ||
    normalized.match(/(?:qty|quantity|كمية|الكمية)\s*[:=]?\s*(\d{1,6})/i);
  if (qty) {
    const n = Number(qty[1]);
    if (n > 0) next.quantity = n;
  }

  const unit = normalized.match(/\b(pcs|pieces|carton|pallet|kg|ton|متر|قطعة)\b/i);
  if (unit) next.unit = unit[1].toLowerCase();

  const deadline =
    normalized.match(/(?:by|before|deadline|قبل|موعد)\s+([0-9]{1,2}[\/\-][0-9]{1,2}(?:[\/\-][0-9]{2,4})?)/i) ||
    normalized.match(/(\d+)\s*(days?|يوم|أيام)/i);
  if (deadline) {
    next.deadline = deadline[0];
  }

  const specsBits: string[] = [];
  if (/saso|ساسو/i.test(normalized)) specsBits.push("SASO");
  if (/iso\s*\d+/i.test(normalized)) {
    const m = normalized.match(/iso\s*\d+/i);
    if (m) specsBits.push(m[0].toUpperCase());
  }
  if (/en\s*\d+/i.test(normalized)) {
    const m = normalized.match(/en\s*\d+/i);
    if (m) specsBits.push(m[0].toUpperCase());
  }
  if (specsBits.length) next.specs = [...new Set([...(next.specs || "").split(",").filter(Boolean), ...specsBits])].join(", ");

  let filled = 0;
  if (next.category) filled++;
  if (next.quantity) filled++;
  if (next.city) filled++;
  if (next.deadline || next.specs) filled++;
  next.confidence = filled / 4;

  return next;
}

export function missingNeedSlots(need: NeedSlots): Array<"category" | "quantity" | "city" | "deadline"> {
  const miss: Array<"category" | "quantity" | "city" | "deadline"> = [];
  if (!need.category) miss.push("category");
  if (!need.quantity) miss.push("quantity");
  if (!need.city) miss.push("city");
  if (!need.deadline) miss.push("deadline");
  return miss;
}

export function needSummary(need: NeedSlots, locale: "en" | "ar") {
  const isAr = locale === "ar";
  const parts = [
    need.category ? (isAr ? `الفئة: ${need.category}` : `Category: ${need.category}`) : null,
    need.quantity != null ? (isAr ? `الكمية: ${need.quantity}${need.unit ? ` ${need.unit}` : ""}` : `Qty: ${need.quantity}${need.unit ? ` ${need.unit}` : ""}`) : null,
    need.city ? (isAr ? `المدينة: ${need.city}` : `City: ${need.city}`) : null,
    need.deadline ? (isAr ? `الموعد: ${need.deadline}` : `Deadline: ${need.deadline}`) : null,
    need.specs ? (isAr ? `المواصفات: ${need.specs}` : `Specs: ${need.specs}`) : null,
  ].filter(Boolean);
  return parts.join(isAr ? " · " : " · ");
}
