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
 * ponytail: hand-kept list; replace with a synonyms collection editable by admins when the catalogue grows.
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
  ["solar", "panel", "طاقة شمسية", "ألواح"],
  ["drill", "دريل", "مثقاب"],
];

const AR_DIGITS = /[٠-٩]/g;
const toWesternDigits = (s: string): string => s.replace(AR_DIGITS, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/** Light singularisation so "helmets" and "helmet" meet. */
function stem(word: string): string {
  if (/[a-z]/i.test(word) && word.length > 4 && word.endsWith("es") && /(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (/[a-z]/i.test(word) && word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function understandQuery(input: string): UnderstoodQuery {
  const raw = String(input || "").trim().slice(0, 200);
  let text = ` ${toWesternDigits(raw).toLowerCase()} `;
  const out: UnderstoodQuery = { raw, terms: [], expanded: [] };

  // City: longest names first so "al khobar" wins over "khobar".
  for (const name of Object.keys(CITIES).sort((a, b) => b.length - a.length)) {
    const rx = new RegExp(`(^|[\\s,،.])(?:in |to |at |deliver(?:ed)? to |في |الى |إلى )?${name.replace(/\s/g, "\\s")}(?=$|[\\s,،.])`, "i");
    if (rx.test(text)) {
      out.city = CITIES[name];
      text = text.replace(rx, " ");
      break;
    }
  }

  // Quantity with optional unit: "500 pcs", "2 t", "1,000 pairs", "٥٠٠ قطعة".
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

  out.terms = text
    .split(/[\s,،.;:!?/()]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !FILLER.has(w))
    .map(stem)
    .slice(0, 6);

  const expanded = new Set(out.terms);
  const joined = out.terms.join(" ");
  for (const group of SYNONYMS) {
    if (group.some((g) => out.terms.includes(stem(g)) || joined.includes(g))) group.forEach((g) => expanded.add(stem(g)));
  }
  out.expanded = [...expanded];
  return out;
}

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Regex sources that tolerate one missing character in longer words ("helmt" → helmet) and match word starts
 * ("خوذ" → خوذة). Short words stay exact to avoid noise.
 */
export function tolerantPatterns(words: string[]): string[] {
  const out = new Set<string>();
  for (const w of words) {
    if (!w) continue;
    out.add(escape(w));
    if (w.length >= 4 && /^[a-z]+$/i.test(w)) out.add([...w].map(escape).join(".?"));
  }
  return [...out];
}
