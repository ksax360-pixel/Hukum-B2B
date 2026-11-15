import type { Locale } from "@/i18n/config";

export type SearchIntent =
  | "informational"
  | "commercial_investigation"
  | "supplier_discovery"
  | "transactional"
  | "wholesale"
  | "manufacturer"
  | "location";

export type ParsedQuery = {
  raw: string;
  language: "ar" | "en" | "mixed";
  intent: SearchIntent;
  locationHint?: string;
  catalogHints: string[];
  normalizedTerms: string[];
};

const ARABIC_SCRIPT = /[\u0600-\u06FF]/;
const LATIN = /[a-zA-Z]/;

const INTENT_PATTERNS: Array<{ intent: SearchIntent; patterns: RegExp[] }> = [
  {
    intent: "wholesale",
    patterns: [/جملة/, /بالجملة/, /\bwholesale\b/i, /\bbulk\b/i],
  },
  {
    intent: "manufacturer",
    patterns: [/مصنع/, /مصنعي/, /مصنّع/, /\bmanufacturer/i, /\boem\b/i, /\bodm\b/i],
  },
  {
    intent: "supplier_discovery",
    patterns: [/مورد/, /موردين/, /موردي/, /موزع/, /\bsupplier/i, /\bdistributor/i, /\bvendor/i],
  },
  {
    intent: "transactional",
    patterns: [/شراء/, /اشتري/, /طلب/, /\bbuy\b/i, /\bpurchase\b/i, /\border\b/i],
  },
  {
    intent: "informational",
    patterns: [/^ما\s+(هي|هو)/, /ما\s+معنى/, /\bwhat\s+(is|are)\b/i, /\bhow\s+to\b/i],
  },
  {
    intent: "commercial_investigation",
    patterns: [/أفضل/, /احسن/, /\bbest\b/i, /\btop\b/i, /مقارنة/, /\bcompare\b/i],
  },
];

const LOCATION_MAP: Array<{ slug: string; terms: string[] }> = [
  { slug: "riyadh", terms: ["riyadh", "الرياض", "رياض"] },
  { slug: "jeddah", terms: ["jeddah", "جدة", "جده"] },
  { slug: "dammam", terms: ["dammam", "الدمام", "دمام"] },
  { slug: "khobar", terms: ["khobar", "الخبر", "خبر"] },
  { slug: "saudi-arabia", terms: ["saudi", "ksa", "السعودية", "السعوديه", "مملكة"] },
];

export function detectQueryLanguage(q: string): "ar" | "en" | "mixed" {
  const hasAr = ARABIC_SCRIPT.test(q);
  const hasEn = LATIN.test(q);
  if (hasAr && hasEn) return "mixed";
  if (hasAr) return "ar";
  return "en";
}

export function classifySearchIntent(q: string): SearchIntent {
  for (const row of INTENT_PATTERNS) {
    if (row.patterns.some((p) => p.test(q))) return row.intent;
  }
  return "commercial_investigation";
}

export function extractLocationHint(q: string): string | undefined {
  const lower = q.toLowerCase();
  for (const loc of LOCATION_MAP) {
    if (loc.terms.some((t) => lower.includes(t.toLowerCase()) || q.includes(t))) return loc.slug;
  }
  return undefined;
}

export function parseSearchQuery(q: string, catalogHints: string[] = []): ParsedQuery {
  const raw = (q || "").trim();
  return {
    raw,
    language: detectQueryLanguage(raw),
    intent: classifySearchIntent(raw),
    locationHint: extractLocationHint(raw),
    catalogHints,
    normalizedTerms: raw
      .split(/[\s,،/|]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1),
  };
}

export function intentLabel(intent: SearchIntent, locale: Locale): string {
  const map: Record<SearchIntent, { en: string; ar: string }> = {
    informational: { en: "Informational", ar: "معلوماتي" },
    commercial_investigation: { en: "Commercial investigation", ar: "بحث تجاري" },
    supplier_discovery: { en: "Supplier discovery", ar: "اكتشاف موردين" },
    transactional: { en: "Transactional", ar: "شرائي" },
    wholesale: { en: "Wholesale", ar: "جملة" },
    manufacturer: { en: "Manufacturer", ar: "مصنّع" },
    location: { en: "Location", ar: "موقع" },
  };
  return locale === "ar" ? map[intent].ar : map[intent].en;
}
