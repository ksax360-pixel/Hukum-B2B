export type CompareProductInput = {
  id: string;
  name: string;
  vendorName?: string;
  priceLabel?: string;
  moq?: string | number;
  leadTime?: string;
  city?: string;
  unit?: string;
  verified?: boolean;
};

export type CompareAgentResult = {
  reply: string;
  bestId: string | null;
  tradeoffs: string[];
  questions: string[];
  source: "heuristic" | "llm";
};

function score(p: CompareProductInput, need = "") {
  let s = 0;
  if (p.verified) s += 3;
  if (p.leadTime) s += 1;
  if (p.moq != null && p.moq !== "") s += 1;
  if (p.priceLabel && !/request|quote|ask/i.test(p.priceLabel)) s += 2;
  if (p.city) s += 1;
  const needL = need.toLowerCase();
  if (needL) {
    if (p.city && needL.includes(p.city.toLowerCase())) s += 4;
    const name = (p.name || "").toLowerCase();
    for (const tok of needL.split(/\s+/).filter((w) => w.length > 2)) {
      if (name.includes(tok)) s += 2;
    }
    if (/riyadh|الرياض/i.test(need) && /riyadh|الرياض/i.test(p.city || "")) s += 2;
  }
  return s;
}

export function runCompareAgent(
  products: CompareProductInput[],
  need = "",
  locale: "en" | "ar" = "en"
): CompareAgentResult {
  const isAr = locale === "ar";
  if (!products.length) {
    return {
      reply: isAr ? "أضف منتجات للمقارنة." : "Add products to compare.",
      bestId: null,
      tradeoffs: [],
      questions: [],
      source: "heuristic",
    };
  }
  if (products.length < 2) {
    return {
      reply: isAr ? "أضف منتجين على الأقل للمقارنة." : "Add at least 2 products to compare.",
      bestId: products[0]?.id || null,
      tradeoffs: [],
      questions: [],
      source: "heuristic",
    };
  }

  const ranked = [...products].slice(0, 5).sort((a, b) => score(b, need) - score(a, need));
  const best = ranked[0];
  const tradeoffs = products.map((p) => {
    const bits = [
      p.verified ? (isAr ? "موثّق" : "verified") : isAr ? "غير موثّق" : "unverified",
      p.moq != null && p.moq !== "" ? `MOQ ${p.moq}` : null,
      p.leadTime ? `${isAr ? "توريد" : "lead"} ${p.leadTime}` : null,
      p.priceLabel || null,
      p.city || null,
    ].filter(Boolean);
    return `${p.name} (${p.vendorName || "—"}): ${bits.join(" · ")}`;
  });

  const questions = isAr
    ? [
        "هل السعر يشمل ضريبة القيمة المضافة والتوصيل؟",
        "ما الحد الأدنى للطلب ومدة التوريد الفعلية؟",
        "هل تتوفر شهادات SASO / ISO مطلوبة؟",
      ]
    : [
        "Does the price include VAT and delivery to your city?",
        "What is the true MOQ and confirmed lead time?",
        "Are required SASO / ISO certificates available?",
      ];

  const needBit = need?.trim()
    ? isAr
      ? ` بناءً على احتياجك: «${need.trim().slice(0, 120)}».`
      : ` Based on your need: “${need.trim().slice(0, 120)}”.`
    : "";

  const reply = isAr
    ? `الأنسب حالياً: ${best.name} من ${best.vendorName || "المورد"} — تحقق من السعر والحد الأدنى ومدة التوريد قبل القرار.${needBit}`
    : `Best fit right now: ${best.name} from ${best.vendorName || "supplier"} — confirm price, MOQ, and lead time before deciding.${needBit}`;

  return {
    reply,
    bestId: best.id,
    tradeoffs,
    questions,
    source: "heuristic",
  };
}
