// src/lib/parse-boq.ts
// Turns spreadsheet rows (a BOQ or price list) into request lines. Finds the header row by its words
// (English or Arabic); without one, the longest text column is the item and the first number is the quantity.

import { unitOf, type ItemLine } from "./parse-item-list";

const NAME = /^(item|items|description|desc|product|material|name|specification|البند|الوصف|المنتج|الصنف|المادة|البيان)/i;
const QTY = /^(qty|quantity|quantities|qnty|amount|no\.? of|الكمية|العدد)/i;
const UNIT = /^(unit|uom|units|الوحدة|وحدة)/i;

const clean = (v: unknown): string => String(v ?? "").replace(/\s+/g, " ").trim();
const toNum = (v: string): string => {
  const n = v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/,/g, "").match(/\d+(\.\d+)?/);
  return n ? n[0] : "";
};

export function parseBoqRows(raw: unknown[][]): ItemLine[] {
  const rows = raw.map((r) => r.map(clean)).filter((r) => r.some(Boolean));
  if (!rows.length) return [];

  const headerAt = rows.slice(0, 10).findIndex((r) => r.some((c) => NAME.test(c)) && r.some((c) => QTY.test(c)));
  let nameCol = -1;
  let qtyCol = -1;
  let unitCol = -1;
  let body = rows;
  if (headerAt >= 0) {
    const h = rows[headerAt];
    // "Description" beats "Item No": number/code columns are never the item name.
    const isCode = (c: string): boolean => /(\bno\.?\b|#|code|ref|رقم|كود)/i.test(c);
    const ranked = [/^(description|desc|specification|الوصف|البيان)/i, /^(product|material|name|المنتج|المادة|الصنف)/i, NAME];
    nameCol = -1;
    for (const re of ranked) {
      nameCol = h.findIndex((c) => re.test(c) && !isCode(c));
      if (nameCol >= 0) break;
    }
    qtyCol = h.findIndex((c) => QTY.test(c));
    unitCol = h.findIndex((c) => UNIT.test(c));
    body = rows.slice(headerAt + 1);
  } else {
    const width = Math.max(...rows.map((r) => r.length));
    const textLen = Array.from({ length: width }, (_, i) => rows.reduce((s, r) => s + (/[^\d\s.,]/.test(r[i] || "") ? (r[i] || "").length : 0), 0));
    nameCol = textLen.indexOf(Math.max(...textLen));
    qtyCol = Array.from({ length: width }, (_, i) => i).find((i) => i !== nameCol && rows.filter((r) => toNum(r[i] || "") && !/[a-z؀-ۿ]{3,}/i.test(r[i] || "")).length >= rows.length / 2) ?? -1;
  }

  return body
    .map((r) => {
      const name = r[nameCol] || "";
      const qty = qtyCol >= 0 ? toNum(r[qtyCol] || "") : "";
      const unitWord = unitCol >= 0 ? r[unitCol] || "" : "";
      return { name, qty, unit: unitOf(unitWord.toLowerCase()) };
    })
    .filter((l) => l.name && !/^(total|subtotal|grand total|المجموع|الإجمالي)/i.test(l.name) && !NAME.test(l.name))
    .slice(0, 200);
}
