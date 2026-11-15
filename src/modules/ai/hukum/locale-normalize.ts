/**
 * Light Saudi dialect / Arabizi → searchable Arabic/English tokens.
 * Production-safe heuristics (no external API required).
 */

const ARABIZI: Array<[RegExp, string]> = [
  [/\b3\b/g, "ع"],
  [/\b5\b/g, "خ"],
  [/\b7\b/g, "ح"],
  [/\b8\b/g, "ق"],
  [/\b2\b/g, "ء"],
  [/\bkhwaza\b/gi, "خوذة"],
  [/\bkhoza\b/gi, "خوذة"],
  [/\bhelmets?\b/gi, "helmet"],
  [/\bglovz?\b/gi, "gloves"],
  [/\bryadh\b/gi, "riyadh"],
  [/\bjidah\b/gi, "jeddah"],
  [/\bjeda\b/gi, "jeddah"],
  [/\babgh[aā]\b/gi, "أريد"],
  [/\bwyn\b/gi, "أين"],
  [/\bshlon\b/gi, "كيف"],
  [/\bshm\b/gi, "ما"],
  [/\bbkam\b/gi, "بكم"],
  [/\bqty\b/gi, "quantity"],
];

const DIALECT: Array<[RegExp, string]> = [
  [/أبغى|ابغى|ودي|ودّي/g, "أريد"],
  [/وش|ايش/g, "ما"],
  [/ليش/g, "لماذا"],
  [/الحين|هالحين/g, "الآن"],
  [/كذا/g, ""],
];

export function normalizeBuyerText(input: string): { normalized: string; original: string } {
  let t = String(input || "").trim();
  const original = t;
  for (const [re, rep] of ARABIZI) t = t.replace(re, rep);
  for (const [re, rep] of DIALECT) t = t.replace(re, rep);
  // Collapse whitespace
  t = t.replace(/\s+/g, " ").trim();
  return { normalized: t || original, original };
}
