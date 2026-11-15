/**
 * Chat safety stubs — malware scan, spam filter, AR/EN translate, voice transcription.
 * Production swaps stubs for real scanners / translation / STT providers.
 */

const SPAM_PATTERNS = [
  /\b(crypto\s*giveaway|nigerian\s*prince|free\s*viagra)\b/i,
  /(https?:\/\/[^\s]+){4,}/i,
  /(.)\1{12,}/,
];

const CONTACT_LEAK =
  /(\+?966[\s-]?\d{8,9}|\b05\d{8}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

export function scanAttachmentStub(file: {
  url?: string;
  name?: string;
  mime?: string;
  size?: number;
}): "clean" | "blocked" | "skipped" {
  const name = String(file.name || file.url || "").toLowerCase();
  const mime = String(file.mime || "").toLowerCase();
  const size = Number(file.size || 0);
  if (/\.(exe|bat|cmd|scr|js|vbs|msi)$/i.test(name) || mime.includes("executable")) {
    return "blocked";
  }
  if (size > 25 * 1024 * 1024) return "blocked";
  if (!file.url && !file.name) return "skipped";
  return "clean";
}

export function moderateMessageBody(body: string): {
  status: "ok" | "flagged" | "blocked";
  reasons: string[];
  strippedContacts?: boolean;
} {
  const reasons: string[] = [];
  let text = body || "";
  for (const re of SPAM_PATTERNS) {
    if (re.test(text)) reasons.push("spam_pattern");
  }
  let strippedContacts = false;
  if (CONTACT_LEAK.test(text)) {
    reasons.push("contact_leak");
    strippedContacts = true;
    text = text.replace(CONTACT_LEAK, "[contact hidden — use reveal / deal accept]");
  }
  if (reasons.includes("spam_pattern") && reasons.length >= 2) {
    return { status: "blocked", reasons, strippedContacts };
  }
  if (reasons.length) return { status: "flagged", reasons, strippedContacts };
  return { status: "ok", reasons: [] };
}

/** Lightweight AR↔EN stub — uses /api/ai translate when available callers pass result. */
export function detectLocale(text: string): "en" | "ar" | "und" {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[A-Za-z]{3,}/.test(text)) return "en";
  return "und";
}

export async function translateMessageStub(
  text: string,
  target: "en" | "ar"
): Promise<{ translated: string; mode: "stub" | "ai" }> {
  const from = detectLocale(text) === "ar" ? "ar" : "en";
  if (from === target) return { translated: text, mode: "stub" };
  try {
    const { translateText } = await import("@/modules/ai/ai.service");
    const translated = await translateText(text, from, target);
    if (translated && translated !== text) return { translated, mode: "ai" };
  } catch {
    /* fall through */
  }
  const prefix = target === "ar" ? "[ع]" : "[EN]";
  return { translated: `${prefix} ${text}`, mode: "stub" };
}

export async function transcribeVoiceStub(
  _audioUrl: string,
  locale: "en" | "ar" = "en"
): Promise<{ text: string; mode: "stub" }> {
  void _audioUrl;
  return {
    text:
      locale === "ar"
        ? "[نسخ صوتي تجريبي — اربط مزود STT]"
        : "[Voice transcription stub — connect STT provider]",
    mode: "stub",
  };
}

export function isOptOutText(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t === "stop" ||
    t === "unsubscribe" ||
    t === "optout" ||
    t === "opt-out" ||
    t === "إيقاف" ||
    t === "الغاء" ||
    t === "إلغاء"
  );
}

/** Default retention: 24 months (PDPL-friendly configurable). */
export function defaultRetentionUntil(from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 24);
  return d;
}

export function slaDueFromNow(hours = 4) {
  return new Date(Date.now() + hours * 3600_000);
}
