// src/lib/parse-catalogue.ts
// Turns a supplier's price list (rows of cells) into product rows for the import API. Columns are found by
// header words in English or Arabic; nothing is guessed or invented: a value we can't read stays empty.

export type CatalogueRow = { name_en: string; name_ar: string; sku: string; brand: string; price: string; unit: string; moq: string; description_en: string };
type Key = keyof CatalogueRow;

const HEADERS: Array<[Key, RegExp]> = [
  ["name_ar", /(arabic name|name \(?ar|name_ar|الاسم|اسم المنتج|المنتج|الصنف)/i],
  ["sku", /^(sku|code|item code|item no|part no|model|ref|الرمز|رقم الصنف|الكود|الموديل)/i],
  ["brand", /^(brand|make|manufacturer|العلامة|الماركة|الشركة المصنعة)/i],
  ["price", /(price|rate|cost|unit price|السعر|سعر)/i],
  ["unit", /^(unit|uom|units|الوحدة|وحدة)/i],
  ["moq", /(moq|min\.? ?order|minimum|أقل كمية|الحد الأدنى)/i],
  ["description_en", /^(description|desc|details|specification|specs|الوصف|المواصفات)/i],
  ["name_en", /^(name|product|item|product name|item name|title)/i],
];
const UNIT_MAP: Record<string, string> = {
  pcs: "piece", pc: "piece", piece: "piece", pieces: "piece", "قطعة": "piece", unit: "unit", units: "unit", set: "set", sets: "set",
  box: "box", boxes: "box", carton: "carton", ctn: "carton", pack: "pack", pair: "pair", pairs: "pair", dozen: "dozen", kg: "kg",
  ton: "ton", tons: "ton", l: "liter", ltr: "liter", liter: "liter", litre: "liter", m: "meter", meter: "meter", metre: "meter",
  sqm: "sqm", m2: "sqm", roll: "roll", rolls: "roll", pallet: "pallet",
};
const AR = /[؀-ۿ]/;
const clean = (v: unknown): string => String(v ?? "").replace(/\s+/g, " ").trim();
const num = (v: string): string => {
  const m = v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/٫/g, ".").replace(/[,٬]/g, "").match(/\d+(\.\d+)?/);
  return m ? m[0] : "";
};

export function parseCatalogue(raw: unknown[][]): { rows: CatalogueRow[]; columns: Key[] } {
  const rows = raw.map((r) => (r || []).map(clean)).filter((r) => r.some(Boolean));
  const headerAt = rows.findIndex((r, i) => i < 10 && r.filter((c) => HEADERS.some(([, re]) => re.test(c))).length >= 2);
  if (headerAt < 0) return { rows: [], columns: [] };
  const col: Partial<Record<Key, number>> = {};
  rows[headerAt].forEach((cell, i) => {
    const hit = HEADERS.find(([k, re]) => col[k] === undefined && re.test(cell));
    if (hit) col[hit[0]] = i;
  });
  const out = rows.slice(headerAt + 1).map((r) => {
    const get = (k: Key): string => (col[k] === undefined ? "" : r[col[k] as number] || "");
    let en = get("name_en");
    let ar = get("name_ar");
    // A single name column holding Arabic text is the Arabic name.
    if (en && !ar && AR.test(en)) { ar = en; en = ""; }
    if (ar && !AR.test(ar) && !en) { en = ar; ar = ""; }
    const unitRaw = get("unit").toLowerCase();
    return {
      name_en: en.slice(0, 140), name_ar: ar.slice(0, 140), sku: get("sku").slice(0, 60), brand: get("brand").slice(0, 60),
      price: num(get("price")), unit: UNIT_MAP[unitRaw] || (unitRaw ? "" : ""), moq: num(get("moq")), description_en: get("description_en").slice(0, 3000),
    };
  }).filter((r) => r.name_en || r.name_ar || r.sku);
  return { rows: out.slice(0, 500), columns: Object.keys(col) as Key[] };
}

export const CATALOGUE_TEMPLATE = "Name,Arabic name,SKU,Brand,Price,Unit,MOQ,Description\nSafety helmet EN 397 white,خوذة سلامة بيضاء,HLM-397-W,RSS,24.50,piece,50,ABS shell with 4-point harness\nNitrile coated gloves,قفازات نتريل,GLV-NTR-9,RSS,6.75,pair,100,Size 9, oil grip\n";
