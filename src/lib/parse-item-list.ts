// src/lib/parse-item-list.ts
// Turns a pasted shopping list into request lines: one item per line, quantity and unit when given.
// "500 safety helmets", "Cement 50kg bags - 200", "٣٠٠ قفاز" all work. Lines without a number get qty "".

export type ItemLine = { name: string; qty: string; unit: string };

const UNIT_WORDS: Array<[RegExp, string]> = [
  [/^(pcs?|pieces?|nos?|units?|قطع[ةه]?)$/i, "piece"],
  [/^(boxe?s?|صندوق|علب[ةه]?)$/i, "box"],
  [/^(cartons?|كرتون)$/i, "carton"],
  [/^(bags?|sacks?|كيس|أكياس)$/i, "bag"],
  [/^(rolls?|لف[ةه])$/i, "roll"],
  [/^(pairs?|زوج)$/i, "pair"],
  [/^(sets?|طقم)$/i, "set"],
  [/^(kgs?|kilos?|كجم|كيلو)$/i, "kg"],
  [/^(tons?|tonnes?|طن)$/i, "ton"],
  [/^(m|meters?|metres?|متر)$/i, "meter"],
  [/^(l|liters?|litres?|لتر)$/i, "liter"],
];

const toWestern = (s: string): string => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
export const unitOf = (w: string): string => UNIT_WORDS.find(([re]) => re.test(w))?.[1] || "";

function parseLine(raw: string): ItemLine | null {
  // Drop list markers ("- ", "• ", "1. ", "2) ") but keep a leading quantity.
  const line = toWestern(raw).replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim();
  if (!line) return null;
  // Quantity first ("500 pcs helmets") or last ("helmets - 500 pcs" / "helmets x 500").
  const lead = line.match(/^(\d[\d,]*(?:\.\d+)?)\s*([^\s\d,]+)?\s+(.+)$/);
  const tail = line.match(/^(.+?)[\s\-–:x×]+(\d[\d,]*(?:\.\d+)?)\s*([^\s\d,]+)?$/i);
  if (lead) {
    const u = unitOf(lead[2] || "");
    return { qty: lead[1].replace(/,/g, ""), unit: u, name: (u ? lead[3] : `${lead[2] || ""} ${lead[3]}`).trim() };
  }
  if (tail) {
    const u = unitOf(tail[3] || "");
    return { name: tail[1].trim(), qty: tail[2].replace(/,/g, ""), unit: u };
  }
  return { name: line, qty: "", unit: "" };
}

export function parseItemList(text: string): ItemLine[] {
  return text
    .split(/\r?\n|;/)
    .map(parseLine)
    .filter((l): l is ItemLine => Boolean(l && l.name))
    .slice(0, 50);
}
