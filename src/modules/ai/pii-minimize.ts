/**
 * Minimize personal data before any model call (AI governance).
 */

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(\+?966[\s-]?\d{8,9}|\b05\d{8}\b|\+\d{10,15})/g;
const CR_VAT = /\b(3\d{14}|\d{10})\b/g;
const NATIONAL_ID = /\b[12]\d{9}\b/g;

export function minimizePii(text: string): { text: string; redactions: number } {
  let redactions = 0;
  let out = String(text || "");
  const replace = (re: RegExp, token: string) => {
    out = out.replace(re, () => {
      redactions += 1;
      return token;
    });
  };
  replace(EMAIL, "[EMAIL]");
  replace(PHONE, "[PHONE]");
  replace(NATIONAL_ID, "[ID]");
  replace(CR_VAT, "[REG]");
  return { text: out, redactions };
}

export function minimizeMessages<T extends { role: string; content: string }>(
  messages: T[]
): { messages: T[]; redactions: number } {
  let redactions = 0;
  const next = messages.map((m) => {
    if (m.role === "system") return m;
    const r = minimizePii(m.content);
    redactions += r.redactions;
    return { ...m, content: r.text };
  });
  return { messages: next, redactions };
}
