// src/modules/search/query-understanding.ts
// Turns a buyer's plain sentence ("500 safety helmets delivered to Riyadh", «أبي ٥٠٠ خوذة في جدة»)
// into structured parts the results page can show as editable chips and filter by.

export type UnderstoodQuery = {
  /** The original text. */
  raw: string;
  /** Product words left after removing quantity, city and filler words. */
  terms: string[];
  /** Same terms plus Arabic/English synonyms, used for matching only. */
  expanded: string[];
  quantity?: number;
  unit?: string;
  city?: string;
};

/** Saudi cities buyers name most; value is the canonical English name stored on vendors. */
const CITIES: Record<string, string> = {
  riyadh: "Riyadh", "الرياض": "Riyadh", رياض: "Riyadh",
  jeddah: "Jeddah", jedda: "Jeddah", "جدة": "Jeddah", جده: "Jeddah",
  dammam: "Dammam", "الدمام": "Dammam",
  khobar: "Khobar", "al khobar": "Khobar", "الخبر": "Khobar",
  dhahran: "Dhahran", "الظهران": "Dhahran",
  mecca: "Mecca", makkah: "Mecca", "مكة": "Mecca",
  medina: "Medina", madinah: "Medina", "المدينة": "Medina",
  jubail: "Jubail", "الجبيل": "Jubail",
  yanbu: "Yanbu", "ينبع": "Yanbu",
  tabuk: "Tabuk", "تبوك": "Tabuk",
  abha: "Abha", "أبها": "Abha",
  qassim: "Qassim", buraidah: "Qassim", "القصيم": "Qassim", "بريدة": "Qassim",
  taif: "Taif", "الطائف": "Taif",
  hail: "Hail", "حائل": "Hail",
  jazan: "Jazan", "جازان": "Jazan",
  najran: "Najran", "نجران": "Najran",
  neom: "NEOM", "نيوم": "NEOM",
};

/** Units as buyers type them, mapped to the unit codes products use. */
const UNITS: Record<string, string> = {
  pc: "piece", pcs: "piece", piece: "piece", pieces: "piece", units: "piece", unit: "piece", "قطعة": "piece", "قطع": "piece", حبة: "piece", حبه: "piece",
  box: "box", boxes: "box", "كرتون": "carton", carton: "carton", cartons: "carton", "علبة": "box",
  pair: "pair", pairs: "pair", "زوج": "pair", "أزواج": "pair",
  kg: "kg", kgs: "kg", kilo: "kg", kilos: "kg", "كيلو": "kg", "كجم": "kg",
  ton: "ton", tons: "ton", tonne: "ton", tonnes: "ton", t: "ton", "طن": "ton",
  m: "meter", meter: "meter", meters: "meter", metre: "meter", "متر": "meter",
  roll: "roll", rolls: "roll", "لفة": "roll", "رول": "roll",
  bag: "bag", bags: "bag", "كيس": "bag", "أكياس": "bag",
  pallet: "pallet", pallets: "pallet", "طبلية": "pallet",
  liter: "liter", liters: "liter", litre: "liter", l: "liter", "لتر": "liter",
};

/** Words that carry no product meaning in a buyer's sentence. */
const FILLER = new Set([
  "i", "we", "need", "want", "looking", "for", "buy", "get", "please", "a", "an", "the", "of", "some", "to", "in", "at", "near",
  "rfq", "deliver", "delivered", "delivery", "supplier", "suppliers", "price", "prices", "quote", "quotes", "urgent", "and", "with",
  "أبي", "ابي", "أبغى", "ابغى", "ابغا", "أحتاج", "احتاج", "نحتاج", "أريد", "اريد", "في", "الى", "إلى", "مع", "توصيل", "سعر", "عرض", "مورد", "موردين", "لو", "سمحت",
]);

/**
 * Arabic ↔ English trade terms, so «خوذة» finds "helmet" and "PPE" finds safety gear.
 */
const SYNONYMS: string[][] = [
  ["helmet", "hard hat", "خوذة", "خوذ"],
  ["gloves", "glove", "قفازات", "قفاز", "جوانتي"],
  ["goggles", "safety glasses", "نظارات", "نظارة"],
  ["vest", "hi-vis", "سترة", "صدرية"],
  ["boots", "shoes", "safety shoes", "حذاء", "أحذية", "بوت"],
  ["mask", "masks", "كمام", "كمامات"],
  ["ppe", "safety", "سلامة", "معدات السلامة"],
  ["cement", "أسمنت", "اسمنت"],
  ["rebar", "steel", "حديد", "تسليح"],
  ["cable", "cables", "wire", "كيبل", "كابل", "أسلاك"],
  ["pump", "pumps", "مضخة", "مضخات", "طرمبة"],
  ["paper", "ورق"],
  ["coffee", "قهوة", "بن"],
  ["cups", "cup", "أكواب", "كوب"],
  ["pallet", "pallets", "طبليات", "طبلية"],
  ["tape", "شريط", "لاصق"],
  ["film", "stretch", "نايلون", "استرتش"],
  ["filter", "filters", "فلتر", "فلاتر"],
  ["firewall", "firewalls", "firewallas", "firewalla", "جدار ناري"],
  ["solar", "panel", "طاقة شمسية", "ألواح"],
  ["drill", "دريل", "مثقاب"],
  ["excavator", "backhoe", "loader", "حفار", "لودر"],
];

const AR_DIGITS = /[٠-٩]/g;
const toWesternDigits = (s: string): string => s.replace(AR_DIGITS, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/** Light singularisation so "helmets" and "helmet" meet. Keep brand-like tokens intact. */
function stem(word: string): string {
  if (/^\d/.test(word) || /[^a-zA-Z؀-ۿ]/.test(word)) return word;
  if (/[a-z]/i.test(word) && word.length > 4 && word.endsWith("es") && /(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (/[a-z]/i.test(word) && word.length > 3 && word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("as")) {
    return word.slice(0, -1);
  }
  return word;
}

export function understandQuery(input: string): UnderstoodQuery {
  const raw = String(input || "").trim().slice(0, 200);
  let text = ` ${toWesternDigits(raw).toLowerCase()} `;
  const out: UnderstoodQuery = { raw, terms: [], expanded: [] };

  for (const name of Object.keys(CITIES).sort((a, b) => b.length - a.length)) {
    const rx = new RegExp(`(^|[\\s,،.])(?:in |to |at |deliver(?:ed)? to |في |الى |إلى )?${name.replace(/\s/g, "\\s")}(?=$|[\\s,،.])`, "i");
    if (rx.test(text)) {
      out.city = CITIES[name];
      text = text.replace(rx, " ");
      break;
    }
  }

  const qty = text.match(/(?:^|\s)(\d{1,3}(?:[,،]\d{3})+|\d+(?:\.\d+)?)\s*([a-z؀-ۿ]+)?(?=\s|$)/i);
  if (qty) {
    const n = Number(qty[1].replace(/[,،]/g, ""));
    if (n > 0 && n < 10_000_000) {
      out.quantity = n;
      const u = qty[2]?.toLowerCase();
      if (u && UNITS[u]) {
        out.unit = UNITS[u];
        text = text.replace(qty[0], " ");
      } else {
        text = text.replace(qty[1], " ");
      }
    }
  }

  // Keep hyphenated brands (x-360) and also emit split parts for matching.
  const rawTokens = text
    .split(/[\s,،.;:!?/()]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !FILLER.has(w));

  const terms: string[] = [];
  for (const tok of rawTokens) {
    const stemmed = stem(tok);
    if (!terms.includes(stemmed)) terms.push(stemmed);
    if (tok.includes("-")) {
      for (const part of tok.split("-")) {
        const p = stem(part.trim());
        if (p.length > 1 && !FILLER.has(p) && !terms.includes(p)) terms.push(p);
      }
    }
  }
  out.terms = terms.slice(0, 8);

  const expanded = new Set(out.terms);
  // Always keep the full raw phrase (lowercased) for exact-ish business/product matches.
  const phrase = raw.toLowerCase().trim();
  if (phrase.length > 2) expanded.add(phrase);

  const joined = out.terms.join(" ");
  for (const group of SYNONYMS) {
    if (group.some((g) => out.terms.includes(stem(g)) || joined.includes(g) || phrase.includes(g))) {
      group.forEach((g) => expanded.add(stem(g)));
    }
  }
  out.expanded = [...expanded];
  return out;
}

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Regex sources that tolerate typos (one missing / extra / swapped char on longer words)
 * and match word starts. Short tokens stay exact.
 */
export function tolerantPatterns(words: string[]): string[] {
  const out = new Set<string>();
  for (const w of words) {
    if (!w) continue;
    out.add(escape(w));
    // Prefix for partial typing: "firew" → firewalls
    if (w.length >= 4) out.add(`${escape(w)}\\w*`);
    // Allow one optional char between letters (typo / missing letter)
    if (w.length >= 4 && /^[a-z0-9-]+$/i.test(w)) {
      out.add([...w].map(escape).join(".?"));
    }
    // Drop one internal character variants for words >= 6
    if (w.length >= 6 && /^[a-z]+$/i.test(w)) {
      for (let i = 1; i < w.length - 1; i++) {
        out.add(escape(w.slice(0, i) + w.slice(i + 1)));
      }
    }
  }
  return [...out].slice(0, 80);
}

/** Simple Levenshtein for in-memory ranking (short strings only). */
export function editDistance(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const prev = Array.from({ length: t.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const temp = prev[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }
  return prev[t.length];
}
