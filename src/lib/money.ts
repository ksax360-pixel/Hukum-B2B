// src/lib/money.ts
// One way to show money and units (D12): thousands separators, "SAR" in English and «ر.س» in Arabic,
// Western digits in both (Saudi B2B convention on invoices and price lists), Arabic unit names on /ar.

const CURRENCY_AR: Record<string, string> = { SAR: "ر.س", USD: "دولار", EUR: "يورو", AED: "درهم" };

/** The new Saudi Riyal sign, rendered by the HukumRiyal font (see globals.css). */
export const RIYAL = "\uF0EA";

export function formatMoney(amount: number, locale: string, currency = "SAR"): string {
  const n = amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (currency === "SAR") return locale === "ar" ? `${n} ${RIYAL}` : `${RIYAL} ${n}`;
  return locale === "ar" ? `${n} ${CURRENCY_AR[currency] || currency}` : `${currency} ${n}`;
}

/** Plain-text money for titles, meta tags and screen-reader labels, where the font sign can't render. */
export function formatMoneyText(amount: number, locale: string, currency = "SAR"): string {
  const n = amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return locale === "ar" ? `${n} ${CURRENCY_AR[currency] || currency}` : `${currency} ${n}`;
}

const UNITS: Record<string, { en: string; ar: string }> = {
  piece: { en: "piece", ar: "قطعة" }, pcs: { en: "piece", ar: "قطعة" }, unit: { en: "unit", ar: "وحدة" },
  set: { en: "set", ar: "طقم" }, box: { en: "box", ar: "صندوق" }, carton: { en: "carton", ar: "كرتون" },
  pack: { en: "pack", ar: "عبوة" }, pair: { en: "pair", ar: "زوج" }, kg: { en: "kg", ar: "كجم" },
  ton: { en: "ton", ar: "طن" }, meter: { en: "metre", ar: "متر" }, m: { en: "metre", ar: "متر" },
  sqm: { en: "m²", ar: "م²" }, liter: { en: "litre", ar: "لتر" }, roll: { en: "roll", ar: "لفة" },
  bag: { en: "bag", ar: "كيس" }, pallet: { en: "pallet", ar: "طبلية" }, length: { en: "length", ar: "طول" },
  container: { en: "container", ar: "حاوية" }, service: { en: "service", ar: "خدمة" },
};

export function unitLabel(unit: string | undefined, locale: string): string {
  if (!unit) return "";
  const u = UNITS[unit.toLowerCase()];
  return u ? (locale === "ar" ? u.ar : u.en) : unit;
}

/** "10–20 days" → "10–20 يوماً" on Arabic pages; lead times are stored as free English text. */
export function localizeDuration(text: string | undefined, locale: string): string {
  if (!text || locale !== "ar") return text || "";
  return text
    .replace(/\bbusiness days?\b/gi, "يوم عمل")
    .replace(/\bdays?\b/gi, "يوماً")
    .replace(/\bweeks?\b/gi, "أسابيع")
    .replace(/\bmonths?\b/gi, "أشهر")
    .replace(/\bhours?\b/gi, "ساعة");
}
