import { aiProvider, confidenceThreshold } from "./provider";
import { PromptTemplate } from "@/modules/platform/platform.model";
import { gatewayComplete } from "./gateway";
import { visualKeyForProduct, visualSrc } from "@/lib/product-visuals";
import { enrichCatalogueDrafts, type CatalogueDraftPreview } from "./catalogue-draft";

async function getPrompt(key: string, fallback: string) {
  const tpl = await PromptTemplate.findOne({ key, active: true }).lean();
  return tpl?.prompt || fallback;
}

type ExtractedProduct = CatalogueDraftPreview;

const PRODUCT_HINTS: Array<{ re: RegExp; nameEn: string; nameAr: string; category: string }> = [
  { re: /helm|helmet|خوذة|saftey\s*hemlet|safety\s*helmet/i, nameEn: "Safety Helmet", nameAr: "خوذة سلامة", category: "PPE" },
  { re: /glove|nitrile|قفاز/i, nameEn: "Safety Gloves", nameAr: "قفازات سلامة", category: "PPE" },
  { re: /vest|hi-?vis|سترة/i, nameEn: "Hi-Vis Vest", nameAr: "سترة عاكسة", category: "PPE" },
  { re: /boot|shoe|حذاء/i, nameEn: "Safety Boots", nameAr: "أحذية سلامة", category: "PPE" },
  { re: /mask|respirator|كمامة/i, nameEn: "Safety Mask", nameAr: "كمامة واقية", category: "PPE" },
];

function parseMoneyValues(text: string): number[] {
  const values: number[] = [];
  const re = /(?:SAR|ر\.?\s*س\.?|ريال)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(?:SAR|ر\.?\s*س\.?|ريال)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) values.push(n);
  }
  return values;
}

function titleFromText(text: string): string {
  for (const hint of PRODUCT_HINTS) {
    if (hint.re.test(text)) return hint.nameEn;
  }
  const line =
    text
      .split(/[\n|;]+/)
      .map((s) => s.trim())
      .find((s) => s.length > 3 && !/^(price|discount|moq|sar|image)/i.test(s)) || "Catalogue product";
  return line.replace(/\s+/g, " ").slice(0, 80);
}

type RawExtractRow = {
  nameEn: string;
  nameAr: string;
  sku: string;
  brand: string;
  categoryHint: string;
  specs: Record<string, string>;
  moq: number | null;
  price: number | null;
  discountPrice: number | null;
  currency: string;
  imageUrl: string;
  confidence: number;
  source: "ai" | "heuristic";
};

/** Offline catalogue parse when AI_API_KEY is unset — still requires supplier approval. */
export function heuristicExtractProducts(rawText: string): ExtractedProduct[] {
  const text = String(rawText || "").trim();
  if (!text) return [];

  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const structured: RawExtractRow[] = [];
  for (const line of lines) {
    const money = parseMoneyValues(line);
    const dashParts = line.split(/\s[—–-]\s|\t|;/).map((p) => p.trim()).filter(Boolean);
    const looksLikeRow = money.length > 0 && (dashParts.length >= 2 || /sar|moq|sku/i.test(line));
    if (!looksLikeRow) continue;
    const rawName = (dashParts[0] || titleFromText(line)).replace(/\s+/g, " ").slice(0, 80);
    const hint = PRODUCT_HINTS.find((h) => h.re.test(line));
    const nameEn = hint?.nameEn || rawName;
    const price = money[0] ?? null;
    const discountPrice = money.length > 1 ? Math.min(...money) : null;
    const listPrice = money.length > 1 ? Math.max(...money) : price;
    const visualKey = visualKeyForProduct({
      name: { en: `${nameEn} ${line}` },
      categoryKey: hint?.category,
    });
    structured.push({
      nameEn,
      nameAr: hint?.nameAr || nameEn,
      sku: `DRAFT-${Math.abs(hashQuick(nameEn)).toString(36).slice(0, 6).toUpperCase()}`,
      brand: "",
      categoryHint: hint?.category || "General",
      specs: {},
      moq: (() => {
        const moq = line.match(/moq\s*[:#]?\s*(\d+)/i);
        return moq ? Number(moq[1]) : null;
      })(),
      price: listPrice,
      discountPrice: discountPrice && discountPrice !== listPrice ? discountPrice : null,
      currency: "SAR",
      imageUrl: visualSrc(visualKey, 0),
      confidence: 0.55,
      source: "heuristic",
    });
  }

  if (structured.length) return enrichCatalogueDrafts(structured);

  const hint = PRODUCT_HINTS.find((h) => h.re.test(text));
  const nameEn = hint?.nameEn || titleFromText(text);
  const money = parseMoneyValues(text);
  const price = money.length ? Math.max(...money) : null;
  const discountPrice = money.length > 1 ? Math.min(...money) : null;
  const visualKey = visualKeyForProduct({
    name: { en: `${nameEn} ${text}` },
    categoryKey: hint?.category,
  });
  return enrichCatalogueDrafts([
    {
      nameEn,
      nameAr: hint?.nameAr || nameEn,
      sku: `DRAFT-${Math.abs(hashQuick(nameEn)).toString(36).slice(0, 6).toUpperCase()}`,
      brand: "",
      categoryHint: hint?.category || "General",
      specs: {},
      moq: null,
      price,
      discountPrice: discountPrice && discountPrice !== price ? discountPrice : null,
      currency: "SAR",
      imageUrl: visualSrc(visualKey, 0),
      confidence: 0.5,
      source: "heuristic",
    },
  ]);
}

function hashQuick(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h || 1;
}

function normalizeExtracted(parsed: unknown): ExtractedProduct[] {
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { products?: unknown[] }).products)
      ? (parsed as { products: unknown[] }).products
      : parsed && typeof parsed === "object"
        ? [parsed]
        : [];

  const rows: RawExtractRow[] = list.map((item, idx) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const nameEn = String(row.nameEn || row.name || row.title || `Product ${idx + 1}`);
    const priceRaw = row.price ?? row.listPrice;
    const discountRaw = row.discountPrice ?? row.salePrice ?? row.discount;
    const price = priceRaw != null && priceRaw !== "" ? Number(priceRaw) : null;
    const discountPrice = discountRaw != null && discountRaw !== "" ? Number(discountRaw) : null;
    const visualKey = visualKeyForProduct({ name: { en: nameEn }, sku: String(row.sku || "") });
    return {
      nameEn,
      nameAr: String(row.nameAr || nameEn),
      sku: String(row.sku || `DRAFT-${idx + 1}`),
      brand: String(row.brand || ""),
      categoryHint: String(row.categoryHint || row.category || "General"),
      specs: (row.specs && typeof row.specs === "object" ? row.specs : {}) as Record<string, string>,
      moq: row.moq != null && row.moq !== "" ? Number(row.moq) : null,
      price: Number.isFinite(price as number) ? (price as number) : null,
      discountPrice: Number.isFinite(discountPrice as number) ? (discountPrice as number) : null,
      currency: String(row.currency || "SAR"),
      imageUrl: String(row.imageUrl || visualSrc(visualKey, 0)),
      confidence: Number(row.confidence ?? 0.7),
      source: "ai" as const,
    };
  });
  return enrichCatalogueDrafts(rows);
}

export async function extractProductsFromText(
  rawText: string,
  opts?: { userId?: string | null }
) {
  if (!aiProvider.isConfigured()) {
    const extracted = heuristicExtractProducts(rawText);
    return {
      extracted,
      model: "heuristic",
      threshold: confidenceThreshold(),
      costUsd: 0,
      mode: "heuristic" as const,
    };
  }

  const system = await getPrompt(
    "product_extraction",
    "Extract B2B products as JSON array with fields: nameEn, nameAr, sku, brand, categoryHint, specs, moq, price, discountPrice, currency, confidence. Always include both nameEn and nameAr when possible. Never invent certifications. Supplier must approve before publish."
  );
  const result = await gatewayComplete({
    feature: "catalogue_builder",
    userId: opts?.userId,
    messages: [
      { role: "system", content: system },
      { role: "user", content: rawText.slice(0, 120000) },
    ],
  });
  let parsed: unknown = [];
  try {
    const match = result.content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : [];
  } catch {
    throw Object.assign(new Error("AI returned invalid JSON"), { status: 422 });
  }
  return {
    extracted: normalizeExtracted(parsed),
    model: result.model,
    threshold: confidenceThreshold(),
    costUsd: result.costUsd,
    mode: "ai" as const,
  };
}

export async function translateText(
  text: string,
  from: "en" | "ar",
  to: "en" | "ar",
  opts?: { userId?: string | null }
) {
  const system = await getPrompt(
    "translation",
    "Translate commercial B2B text accurately. Return only the translation."
  );
  const result = await gatewayComplete({
    feature: "translate",
    userId: opts?.userId,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Translate from ${from} to ${to}:\n\n${text}` },
    ],
  });
  return {
    original: text,
    translation: result.content.trim(),
    source: "ai" as const,
    status: "pending_approval" as const,
  };
}

export async function generateSeo(
  input: { name: string; description: string; locale: "en" | "ar" },
  opts?: { userId?: string | null }
) {
  const system = await getPrompt(
    "seo_generation",
    "Generate SEO title, meta description, and keywords as JSON: {title, description, keywords}."
  );
  const result = await gatewayComplete({
    feature: "catalogue_builder",
    userId: opts?.userId,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(input) },
    ],
  });
  try {
    const match = result.content.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { title: input.name, description: input.description, keywords: "" };
  } catch {
    return { title: input.name, description: input.description.slice(0, 160), keywords: "" };
  }
}

export async function understandRfq(text: string, opts?: { userId?: string | null }) {
  const system = await getPrompt(
    "rfq_extraction",
    "Extract RFQ intent as JSON: {productHints, categoryHints, locationHints, quantityHints, specifications}."
  );
  const result = await gatewayComplete({
    feature: "sourcing_agent",
    userId: opts?.userId,
    messages: [
      { role: "system", content: system },
      { role: "user", content: text },
    ],
  });
  try {
    const match = result.content.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { productHints: [text] };
  } catch {
    return { productHints: [text], categoryHints: [], locationHints: [], quantityHints: [] };
  }
}

export async function moderateContent(text: string, opts?: { userId?: string | null }) {
  if (!aiProvider.isConfigured()) {
    return { flags: [] as string[], note: "AI not configured; skipped moderation" };
  }
  const system = await getPrompt(
    "moderation",
    "Flag spam, misleading, restricted goods, offensive content. Return JSON {flags: string[]}."
  );
  try {
    const result = await gatewayComplete({
      feature: "moderate",
      userId: opts?.userId,
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
      allowFallback: true,
    });
    const match = result.content.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { flags: [] };
  } catch {
    return { flags: [], note: "moderation_fallback" };
  }
}
