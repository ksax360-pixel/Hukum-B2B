/**
 * Saudi Arabia reminder timing rules (Journey 4).
 * - No reminders during prayer windows or after 10 PM Asia/Riyadh
 * - Fri–Sat weekend respected (defer to Sunday)
 * - Reduced cadence in Ramadan
 * - Hijri dates alongside Gregorian on quotes
 */

const RIYADH = "Asia/Riyadh";

/** Approximate prayer windows (local hours) — production can swap for Aladhan API. */
const PRAYER_WINDOWS: Array<[number, number]> = [
  [4.5, 5.5], // Fajr band
  [12.0, 12.75], // Dhuhr
  [15.25, 16.0], // Asr
  [18.0, 18.75], // Maghrib
  [19.5, 20.25], // Isha
];

function riyadhParts(d = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: RIYADH,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour) + Number(parts.minute) / 60;
  const weekday = parts.weekday; // Mon, Tue, ...
  return { hour, weekday, parts, date: d };
}

export function isSaudiWeekend(d = new Date()) {
  const { weekday } = riyadhParts(d);
  return weekday === "Fri" || weekday === "Sat";
}

export function isAfterQuietHour(d = new Date()) {
  return riyadhParts(d).hour >= 22;
}

export function isPrayerWindow(d = new Date()) {
  const { hour } = riyadhParts(d);
  return PRAYER_WINDOWS.some(([a, b]) => hour >= a && hour < b);
}

/** Rough Hijri year check for Ramadan (month 9) via Intl islamic calendar. */
export function isRamadan(d = new Date()) {
  try {
    const month = new Intl.DateTimeFormat("en-u-ca-islamic", {
      timeZone: RIYADH,
      month: "numeric",
    }).format(d);
    return Number(month) === 9;
  } catch {
    return false;
  }
}

export function formatHijri(d: Date | string | null | undefined, locale: "en" | "ar" = "en") {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-islamic" : "en-u-ca-islamic", {
      timeZone: RIYADH,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function formatQuoteDates(d: Date | string | null | undefined, locale: "en" | "ar" = "en") {
  if (!d) return { gregorian: "—", hijri: "" };
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return { gregorian: "—", hijri: "" };
  const gregorian = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    timeZone: RIYADH,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  return { gregorian, hijri: formatHijri(date, locale) };
}

/**
 * Should we send a reminder now? If not, returns next eligible Date.
 */
export function canSendReminderNow(d = new Date()): { ok: boolean; deferUntil?: Date; reason?: string } {
  if (isPrayerWindow(d)) {
    return { ok: false, deferUntil: new Date(d.getTime() + 45 * 60_000), reason: "prayer" };
  }
  if (isAfterQuietHour(d)) {
    // Next day 9:00 Riyadh approx = +11h from 22:00
    return { ok: false, deferUntil: new Date(d.getTime() + 11 * 3600_000), reason: "after_22" };
  }
  if (isSaudiWeekend(d)) {
    // Defer ~24–48h into Sunday morning
    return { ok: false, deferUntil: new Date(d.getTime() + 36 * 3600_000), reason: "weekend" };
  }
  return { ok: true };
}

/** Ramadan: stretch intervals ~1.5× */
export function reminderIntervalMs(baseMs: number, d = new Date()) {
  return isRamadan(d) ? Math.round(baseMs * 1.5) : baseMs;
}

export const VAT_DISCLAIMER_EN =
  "This quotation on Hukum is not a binding offer. State clearly whether prices include 15% VAT.";
export const VAT_DISCLAIMER_AR =
  "عرض السعر عبر حكم غير ملزم. يجب بيان ما إذا كانت الأسعار شاملة ضريبة القيمة المضافة 15٪.";
