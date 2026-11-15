// src/lib/vendor-edit.ts
// What a supplier may change on their own record. Everything else (status, verification, plan, slug,
// featured, published storefront) is set by Hukum staff only. Storefront design edits go to `pending`.

type Loc = { en?: string; ar?: string };

/** Fields a supplier edits directly. Legal identity fields lock once verified. */
const OPEN = [
  "tradeName", "description", "website", "email", "phone", "whatsapp", "businessHours", "yearEstablished",
  "location", "companyType", "citiesServed", "marketsServed", "moq", "leadTime", "paymentTerms", "certifications", "socialLinks",
] as const;
const IDENTITY = ["legalName", "crNumber", "vatNumber"] as const;

export function supplierEditable(input: Record<string, unknown>, verified: boolean): Record<string, unknown> {
  const keys: readonly string[] = verified ? OPEN : [...OPEN, ...IDENTITY];
  return Object.fromEntries(Object.entries(input).filter(([k]) => keys.includes(k)));
}

const MAX_IMAGE = 900_000; // ~650 KB image as base64. ponytail: inline data URLs until real file storage exists.
const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const loc = (v: unknown, max: number): Loc => {
  const o = (v && typeof v === "object" ? v : {}) as Loc;
  return { en: str(o.en, max), ar: str(o.ar, max) };
};
export function safeImage(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (/^https:\/\/[^\s"'<>]+$/i.test(s) && s.length < 2000) return s;
  if (/^\/api\/media\?path=public%2F[\w%.-]+$/.test(s) && s.length < 500) return s;
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= MAX_IMAGE) return s;
  return "";
}
const color = (v: unknown, fallback: string): string => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback);

/** Cleans a storefront design submitted by a supplier. Unknown keys are dropped. */
export function cleanDesign(input: unknown) {
  const d = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const banner = safeImage(d.banner);
  return {
    headline: loc(d.headline, 80),
    tagline: loc(d.tagline, 120),
    about: loc(d.about, 1500),
    bannerText: loc(d.bannerText, 160),
    ctaLabel: loc(d.ctaLabel, 30),
    primaryColor: color(d.primaryColor, "#17634B"),
    logo: safeImage(d.logo),
    bannerImages: banner ? [banner] : [],
    showProducts: d.showProducts !== false,
    showCertifications: d.showCertifications !== false,
    showContactCta: d.showContactCta !== false,
  };
}

/** Saudi Commercial Registration number: 10 digits. */
export const isCrNumber = (v: string): boolean => /^\d{10}$/.test(v);
/** Saudi VAT registration number: 15 digits, starts and ends with 3. */
export const isVatNumber = (v: string): boolean => /^3\d{13}3$/.test(v);
