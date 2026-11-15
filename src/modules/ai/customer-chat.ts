import { aiProvider, type ChatMessage } from "@/modules/ai/provider";
import {
  fetchFeaturedProducts,
  searchCatalogProducts,
} from "@/modules/products/catalog-search";

export type ChatProductCard = {
  id: string;
  name: string;
  slug: string;
  href: string;
  image?: string;
  priceLabel: string;
  vendorName?: string;
  location?: string;
  snippet?: string;
};

export type CustomerChatReply = {
  reply: string;
  suggestedLinks?: { label: string; href: string }[];
  followUps?: string[];
  products?: ChatProductCard[];
  intent?: string;
  searchQuery?: string;
  source: "ai" | "heuristic" | "catalog";
};

const STOP = new Set([
  "a", "an", "the", "i", "im", "i'm", "me", "my", "we", "our", "you", "your",
  "need", "want", "looking", "look", "find", "for", "to", "of", "and", "or",
  "with", "from", "in", "on", "at", "is", "are", "can", "please", "help",
  "get", "buy", "purchase", "some", "any", "about", "this", "that", "have",
  "do", "does", "how", "what", "where", "who", "which", "show", "me",
  "product", "products", "item", "items", "supplier", "suppliers", "near",
  "seller", "vendor", "company", "by", "located", "city",
  "أريد", "ابحث", "عن", "من", "في", "على", "هل", "كيف", "ماذا", "أحتاج", "طلب", "بائع", "مدينة",
]);

const CITIES: { value: string; re: RegExp }[] = [
  { value: "Riyadh", re: /\b(riyadh|رياض)\b/i },
  { value: "Jeddah", re: /\b(jeddah|جدة|جده)\b/i },
  { value: "Dammam", re: /\b(dammam|دمام)\b/i },
  { value: "Khobar", re: /\b(khobar|خبر)\b/i },
  { value: "Dhahran", re: /\b(dhahran|ظهران)\b/i },
  { value: "Mecca", re: /\b(mecca|makkah|مكة)\b/i },
  { value: "Medina", re: /\b(medina|madinah|مدينة\s*المنورة)\b/i },
  { value: "Tabuk", re: /\b(tabuk|تبوك)\b/i },
  { value: "Abha", re: /\b(abha|أبها|ابها)\b/i },
  { value: "Jubail", re: /\b(jubail|جبيل)\b/i },
  { value: "Yanbu", re: /\b(yanbu|ينبع)\b/i },
  { value: "Neom", re: /\b(neom|نيوم)\b/i },
];

const INTENT_HINTS: { re: RegExp; intent: string; boost: string[] }[] = [
  { re: /helmet|خوذة|hard.?hat/i, intent: "safety_helmet", boost: ["helmet", "safety", "خوذة"] },
  { re: /glove|قفاز/i, intent: "gloves", boost: ["glove", "nitrile", "قفاز"] },
  { re: /boot|shoe|حذاء|جزمة/i, intent: "footwear", boost: ["boot", "shoe", "حذاء"] },
  { re: /goggle|eye.?protect|نظار/i, intent: "eye_protection", boost: ["goggle", "eye", "نظارة"] },
  { re: /mask|respirat|كمام|تنفس/i, intent: "respiratory", boost: ["mask", "respirator", "كمامة"] },
  { re: /vest|سترة|reflect/i, intent: "hi_vis", boost: ["vest", "reflective", "سترة"] },
  { re: /ear.?muff|hearing|سماعة|أذن/i, intent: "hearing", boost: ["ear", "hearing", "أذن"] },
  { re: /harness|fall|حزام|سقوط/i, intent: "fall_protection", boost: ["harness", "fall", "حزام"] },
  { re: /fire|extinguish|حريق|إطفاء/i, intent: "fire_safety", boost: ["fire", "extinguisher", "حريق"] },
  { re: /first.?aid|إسعاف/i, intent: "first_aid", boost: ["first", "aid", "إسعاف"] },
  { re: /safety|ppe|معدات.?سلامة|سلامة/i, intent: "safety", boost: ["safety", "ppe", "سلامة"] },
];

function sellerHref() {
  const base = (process.env.NEXT_PUBLIC_SELLER_ADMIN_URL || "http://localhost:3002").replace(/\/$/, "");
  return `${base}/register`;
}

function appBase() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function locPath(locale: string, path: string) {
  return `${appBase()}/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractTokens(message: string) {
  return message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

function detectIntent(message: string) {
  for (const h of INTENT_HINTS) {
    if (h.re.test(message)) return h;
  }
  return null;
}

function detectCity(message: string) {
  for (const c of CITIES) {
    if (c.re.test(message)) return c.value;
  }
  return "";
}

function detectSellerName(message: string) {
  const m =
    message.match(/\b(?:from|by|seller|vendor|supplier|company)\s+([A-Za-z0-9][\w\s&.-]{1,40})/i) ||
    message.match(/(?:من|بائع|مورد|شركة)\s+([^\s،,]{2,40})/i);
  if (!m) return "";
  const name = m[1].replace(/\b(in|at|near|from|riyadh|jeddah|dammam)\b/gi, "").trim();
  return name.length >= 2 ? name : "";
}

function isSellerIntent(message: string) {
  return /\b(sell with us|become a vendor|become a seller|register as a seller|vendor account|supplier account)\b|تسجيل.*(بائع|مورد)|انضم.*(مورد|بائع)/i.test(
    message
  );
}

function isRfqIntent(message: string) {
  return /\brfq\b|quotat|request.?quote|طلب.?عرض|عرض.?سعر/i.test(message);
}

function isFeaturedIntent(message: string) {
  return /featured|curated|مميز|مختارات|spotlight|popular picks/i.test(message);
}

function isGreeting(message: string) {
  return /^(hi|hello|hey|salam|assalam|مرحبا|السلام|أهلا)[\s!.]*$/i.test(message.trim());
}

function primaryImage(media: unknown): string | undefined {
  if (!Array.isArray(media) || !media.length) return undefined;
  const sorted = [...media].sort((a, b) => {
    const ao = (a as { isPrimary?: boolean; order?: number }).isPrimary ? -1 : (a as { order?: number }).order || 0;
    const bo = (b as { isPrimary?: boolean; order?: number }).isPrimary ? -1 : (b as { order?: number }).order || 0;
    return ao - bo;
  });
  const url = (sorted[0] as { url?: string })?.url;
  return url ? String(url) : undefined;
}

function localize(field: unknown, locale: string) {
  if (!field) return "";
  if (typeof field === "string") return field;
  const o = field as { en?: string; ar?: string };
  if (locale === "ar") return o.ar || o.en || "";
  return o.en || o.ar || "";
}

type LeanProduct = {
  _id: unknown;
  name?: { en?: string; ar?: string };
  title?: { en?: string; ar?: string };
  slug?: { en?: string; ar?: string };
  shortDescription?: { en?: string; ar?: string };
  description?: { en?: string; ar?: string };
  price?: number;
  currency?: string;
  priceType?: string;
  media?: unknown[];
  vendorId?: {
    legalName?: { en?: string; ar?: string };
    tradeName?: string;
    location?: { city?: string; region?: string };
  };
};

function toCards(docs: LeanProduct[], locale: string, limit = 5): ChatProductCard[] {
  const seen = new Set<string>();
  const out: ChatProductCard[] = [];
  for (const p of docs) {
    const id = String(p._id);
    if (seen.has(id)) continue;
    seen.add(id);
    const name = localize(p.name, locale) || localize(p.title, locale) || "Product";
    const slug = p.slug?.en || p.slug?.ar || id;
    const priceLabel =
      p.priceType === "price_on_request" || p.price == null
        ? locale === "ar"
          ? "السعر عند الطلب"
          : "Price on request"
        : `${p.price} ${p.currency || "SAR"}`;
    const vendorName = localize(p.vendorId?.legalName, locale) || p.vendorId?.tradeName || undefined;
    const location = p.vendorId?.location?.city || p.vendorId?.location?.region || undefined;
    const snippet = (localize(p.shortDescription, locale) || localize(p.description, locale)).slice(0, 120);
    out.push({
      id,
      name,
      slug,
      href: locPath(locale, `/products/${slug}`),
      image: primaryImage(p.media),
      priceLabel,
      vendorName,
      location,
      snippet,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function clarifyingQuestions(locale: string, intent?: string): string[] {
  const isAr = locale === "ar";
  if (intent === "safety_helmet") {
    return isAr
      ? ["خوذات في الرياض", "من NajdSafe", "منتجات مميزة"]
      : ["Helmets in Riyadh", "From NajdSafe", "Show featured products"];
  }
  return isAr
    ? ["منتجات مميزة", "معدات سلامة في الرياض", "قفازات من NajdSafe", "أريد إنشاء RFQ"]
    : ["Show featured products", "Safety gear in Riyadh", "Gloves from NajdSafe", "Help me create an RFQ"];
}

function productsSearchUrl(locale: string, opts: { q?: string; city?: string; seller?: string; featured?: boolean }) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.city) params.set("city", opts.city);
  if (opts.seller) params.set("seller", opts.seller);
  if (opts.featured) params.set("featured", "true");
  params.set("sort", "featured");
  const qs = params.toString();
  return `${locPath(locale, "/products")}${qs ? `?${qs}` : ""}`;
}

async function maybeAiRewrite(opts: {
  locale: string;
  message: string;
  products: ChatProductCard[];
  query: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<string | null> {
  if (!aiProvider.isConfigured()) return null;
  try {
    const catalog = opts.products
      .slice(0, 5)
      .map((p, i) => `${i + 1}. ${p.name} · ${p.priceLabel}${p.vendorName ? ` · ${p.vendorName}` : ""}${p.location ? ` · ${p.location}` : ""}`)
      .join("\n");
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are Hukum's buyer shopping assistant.
Use LIVE catalog matches only. Mention seller/location when helpful.
Keep 2–4 sentences. Suggest refine by city, seller name, or RFQ.
Locale: ${opts.locale}`,
      },
      ...(opts.history || []).slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content.slice(0, 800),
      })),
      {
        role: "user",
        content: `Customer: ${opts.message}\nQuery: ${opts.query}\nMatches:\n${catalog || "(none)"}\nWrite reply.`,
      },
    ];
    const result = await aiProvider.complete(messages, { temperature: 0.35 });
    return (result.content || "").trim() || null;
  } catch {
    return null;
  }
}

export async function answerCustomerChat(opts: {
  message: string;
  locale?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<CustomerChatReply> {
  const message = String(opts.message || "").trim().slice(0, 2000);
  if (!message) {
    return { reply: "Please type what you need.", source: "heuristic" };
  }
  const locale = opts.locale === "ar" ? "ar" : "en";
  const isAr = locale === "ar";
  const site = (path: string) => locPath(locale, path);

  if (isGreeting(message) || isFeaturedIntent(message)) {
    const featured = (await fetchFeaturedProducts(6)) as LeanProduct[];
    const products = toCards(featured, locale, 6);
    return {
      source: "catalog",
      intent: "featured",
      reply: isAr
        ? products.length
          ? "هذه مختارات المنتجات المميزة في السوق. صف احتياجك، المدينة، أو اسم البائع لأضيّق النتائج."
          : "مرحباً! صف ما تحتاجه وسأطابق المنتجات — يمكنك أيضاً التصفية بالمدينة أو اسم البائع."
        : products.length
          ? "Here are curated featured products from the marketplace. Tell me a need, city, or seller name to narrow results."
          : "Hi! Describe what you need and I’ll match products — you can also filter by city or seller name.",
      products,
      followUps: clarifyingQuestions(locale),
      suggestedLinks: [
        { label: isAr ? "كل المميز" : "All featured", href: productsSearchUrl(locale, { featured: true }) },
        { label: isAr ? "إنشاء RFQ" : "Create RFQ", href: site("/rfq") },
      ],
    };
  }

  if (isSellerIntent(message)) {
    return {
      source: "heuristic",
      intent: "seller_register",
      reply: isAr
        ? "للبيع على Hukum، سجّل من لوحة البائع. إن كنت مشترياً، صف المنتج أو المدينة أو اسم المورد هنا."
        : "To sell on Hukum, register via the Seller Panel. If you’re buying, describe the product, city, or supplier name here.",
      suggestedLinks: [
        { label: isAr ? "تسجيل كمورد" : "Register as seller", href: sellerHref() },
        { label: isAr ? "منتجات مميزة" : "Featured products", href: productsSearchUrl(locale, { featured: true }) },
      ],
      followUps: clarifyingQuestions(locale),
    };
  }

  if (isRfqIntent(message) && extractTokens(message).length < 2) {
    return {
      source: "heuristic",
      intent: "rfq",
      reply: isAr
        ? "افتح صفحة RFQ، أو أخبرني بالمنتج/المدينة أولاً لأعرض قوائم مناسبة."
        : "Open the RFQ page, or tell me the product/city first and I’ll show matching listings.",
      suggestedLinks: [{ label: isAr ? "فتح RFQ" : "Open RFQ", href: site("/rfq") }],
      followUps: clarifyingQuestions(locale),
    };
  }

  const city = detectCity(message);
  const sellerName = detectSellerName(message);
  const hint = detectIntent(message);
  const tokens = extractTokens(message).filter(
    (t) => !CITIES.some((c) => c.value.toLowerCase() === t) && t !== sellerName.toLowerCase()
  );
  const boost = hint?.boost || [];
  const q = Array.from(new Set([...boost, ...tokens])).slice(0, 8).join(" ").trim() || (!city && !sellerName ? message.slice(0, 80) : "");

  const result = await searchCatalogProducts({
    q: q || undefined,
    city: city || undefined,
    seller: sellerName || undefined,
    featured: undefined,
    sort: "featured",
    page: 1,
    limit: 8,
  });

  let products = toCards(result.items as LeanProduct[], locale, 5);

  // If filters were too narrow, soften with featured + keyword
  if (!products.length && (city || sellerName)) {
    const soft = await searchCatalogProducts({
      q: q || undefined,
      sort: "featured",
      page: 1,
      limit: 5,
    });
    products = toCards(soft.items as LeanProduct[], locale, 5);
  }

  const queryLabel = [q, sellerName && `seller:${sellerName}`, city && `city:${city}`].filter(Boolean).join(" · ");
  const aiReply = await maybeAiRewrite({
    locale,
    message,
    products,
    query: queryLabel,
    history: opts.history,
  });

  const hasMatch = products.length > 0;
  const reply =
    aiReply ||
    (hasMatch
      ? isAr
        ? `وجدت ${products.length} منتجات${city ? ` في ${city}` : ""}${sellerName ? ` من «${sellerName}»` : ""}. افتح بطاقة أو حدّد الكمية/المعيار.`
        : `I found ${products.length} products${city ? ` in ${city}` : ""}${sellerName ? ` from “${sellerName}”` : ""}. Open a card or refine qty/standard.`
      : isAr
        ? "لا توجد نتائج قوية. جرّب كلمة منتج أوضح، مدينة (مثل الرياض)، أو اسم بائع."
        : "No strong matches. Try a clearer product keyword, a city (e.g. Riyadh), or a seller name.");

  return {
    source: aiReply ? "ai" : "catalog",
    intent: hint?.intent || (city ? "location_search" : sellerName ? "seller_search" : "product_search"),
    searchQuery: queryLabel,
    reply,
    products,
    suggestedLinks: [
      {
        label: isAr ? "عرض كل النتائج" : "See all results",
        href: productsSearchUrl(locale, { q: q || undefined, city: city || undefined, seller: sellerName || undefined }),
      },
      { label: isAr ? "المنتجات المميزة" : "Featured products", href: productsSearchUrl(locale, { featured: true }) },
      {
        label: isAr ? "إنشاء RFQ" : "Create RFQ",
        href: `${site("/rfq")}${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      },
    ],
    followUps: clarifyingQuestions(locale, hint?.intent),
  };
}
