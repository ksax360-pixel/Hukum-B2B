import type { Locale } from "@/i18n/config";

type Loc = { en?: string; ar?: string };

export type Provenance = {
  sourceType: string;
  sourceId: string;
  sourceField: string;
  confidence: number;
  lastVerifiedAt?: Date;
  verifiedBy?: string;
};

export type AeoFaq = {
  q: Loc;
  a: Loc;
  provenance: Provenance;
  status?: string;
  override?: boolean;
};

export type AeoFact = {
  key: string;
  label: Loc;
  value: Loc;
  provenance: Provenance;
};

export type AeoLayer = {
  summary: Loc;
  facts: AeoFact[];
  faqs: AeoFaq[];
  buyingConsiderations?: Loc;
  generatedAt: Date;
  sourceDataAt: Date;
  confidence: number;
  status: string;
};

function loc(en?: string, ar?: string): Loc {
  return { en: en || "", ar: ar || "" };
}

function fact(
  key: string,
  label: Loc,
  valueEn: string,
  valueAr: string,
  provenance: Provenance
): AeoFact {
  return { key, label, value: loc(valueEn, valueAr), provenance };
}

function faq(qEn: string, qAr: string, aEn: string, aAr: string, provenance: Provenance): AeoFaq {
  return { q: loc(qEn, qAr), a: loc(aEn, aAr), provenance, status: "ai_generated" };
}

export function pickAeo(locale: Locale, value?: Loc, fallback = "") {
  return (locale === "ar" ? value?.ar || value?.en : value?.en || value?.ar) || fallback;
}

type ProductFacts = {
  id: string;
  nameEn: string;
  nameAr?: string;
  brand?: string;
  manufacturer?: string;
  moq?: number;
  unit?: string;
  leadTime?: string;
  city?: string;
  country?: string;
  vendorName?: string;
  vendorVerified?: boolean;
  categoryName?: string;
  certifications?: string[];
  applications?: string;
  industries?: string;
  price?: number;
  currency?: string;
  pricePublic?: boolean;
  availability?: string;
};

export function buildProductAeo(p: ProductFacts): AeoLayer {
  const id = p.id;
  const now = new Date();
  const facts: AeoFact[] = [];
  const faqs: AeoFaq[] = [];
  const src = (field: string, confidence = 0.95): Provenance => ({
    sourceType: "product",
    sourceId: id,
    sourceField: field,
    confidence,
    lastVerifiedAt: now,
    verifiedBy: "system",
  });

  facts.push(
    fact("what", loc("Product", "المنتج"), p.nameEn, p.nameAr || p.nameEn, src("name"))
  );
  if (p.brand) {
    facts.push(fact("brand", loc("Brand", "العلامة"), p.brand, p.brand, src("brand")));
  }
  if (p.manufacturer) {
    facts.push(
      fact("manufacturer", loc("Manufacturer", "الشركة المصنعة"), p.manufacturer, p.manufacturer, src("manufacturer"))
    );
  }
  if (p.vendorName) {
    facts.push(
      fact(
        "supplier",
        loc("Supplier", "المورد"),
        p.vendorVerified ? `${p.vendorName} (verified)` : p.vendorName,
        p.vendorVerified ? `${p.vendorName} (موثّق)` : p.vendorName,
        src("vendorId", 0.9)
      )
    );
  }
  if (p.moq != null) {
    const moq = `${p.moq}${p.unit ? ` ${p.unit}` : ""}`;
    facts.push(fact("moq", loc("MOQ", "الحد الأدنى للطلب"), moq, moq, src("moq")));
    faqs.push(
      faq("What is the MOQ for this product?", "ما هو الحد الأدنى لطلب هذا المنتج؟", moq, moq, src("moq"))
    );
  }
  if (p.leadTime) {
    facts.push(fact("leadTime", loc("Lead time", "مدة التوريد"), p.leadTime, p.leadTime, src("leadTime")));
    faqs.push(
      faq("What is the lead time?", "ما هي مدة التوريد؟", p.leadTime, p.leadTime, src("leadTime"))
    );
  }
  const place = [p.city, p.country].filter(Boolean).join(", ");
  if (place) {
    facts.push(fact("location", loc("Available from", "متوفر من"), place, place, src("vendor.location", 0.85)));
    faqs.push(
      faq("Where is this product available?", "أين يتوفر هذا المنتج؟", place, place, src("vendor.location", 0.85))
    );
  }
  if (p.certifications?.length) {
    const certs = p.certifications.join(", ");
    facts.push(fact("certs", loc("Certifications", "الشهادات"), certs, certs, src("certifications")));
    faqs.push(
      faq("What certifications does it have?", "ما الشهادات المتوفرة؟", certs, certs, src("certifications"))
    );
  }
  if (p.applications) {
    facts.push(fact("applications", loc("Applications", "الاستخدامات"), p.applications, p.applications, src("applications")));
    faqs.push(
      faq(
        "What applications is it suitable for?",
        "لأي استخدامات يناسب هذا المنتج؟",
        p.applications,
        p.applications,
        src("applications")
      )
    );
  }
  if (p.industries) {
    facts.push(fact("industries", loc("Industries", "القطاعات"), p.industries, p.industries, src("industries")));
  }
  if (p.pricePublic && p.price != null) {
    const price = `${p.price} ${p.currency || "SAR"}`;
    facts.push(fact("price", loc("Price", "السعر"), price, price, src("price")));
  }
  faqs.push(
    faq(
      "What is this product?",
      "ما هذا المنتج؟",
      p.nameEn,
      p.nameAr || p.nameEn,
      src("name")
    )
  );
  if (p.vendorName) {
    faqs.push(
      faq(
        "Who supplies this product on Hukum?",
        "من يورّد هذا المنتج على Hukum؟",
        p.vendorName,
        p.vendorName,
        src("vendorId", 0.9)
      )
    );
  }
  if (p.manufacturer) {
    faqs.push(
      faq(
        "Who manufactures this product?",
        "من يصنّع هذا المنتج؟",
        p.manufacturer,
        p.manufacturer,
        src("manufacturer")
      )
    );
  }
  faqs.push(
    faq(
      "How can a buyer request a quote?",
      "كيف يطلب المشتري عرض سعر؟",
      "Use Request quote on the Hukum product page to contact the listed vendor.",
      "استخدم طلب عرض السعر في صفحة المنتج على Hukum للتواصل مع المورد المدرج.",
      { sourceType: "platform", sourceId: "kingdom-trade", sourceField: "rfq", confidence: 1, lastVerifiedAt: now, verifiedBy: "system" }
    )
  );

  const summaryEn = [
    p.nameEn,
    p.brand ? `Brand: ${p.brand}` : "",
    p.vendorName ? `Offered by ${p.vendorName}` : "",
    place ? `from ${place}` : "",
    p.categoryName ? `in ${p.categoryName}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  const summaryAr = [
    p.nameAr || p.nameEn,
    p.brand ? `العلامة: ${p.brand}` : "",
    p.vendorName ? `يعرضه ${p.vendorName}` : "",
    place ? `من ${place}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  const filled = facts.length + faqs.length;
  return {
    summary: loc(summaryEn, summaryAr),
    facts,
    faqs,
    buyingConsiderations: loc(
      [p.moq != null ? "Confirm MOQ with the vendor." : "", p.leadTime ? "Confirm current lead time before ordering." : ""]
        .filter(Boolean)
        .join(" ") || undefined,
      [p.moq != null ? "أكد الحد الأدنى للطلب مع المورد." : "", p.leadTime ? "أكد مدة التوريد الحالية قبل الطلب." : ""]
        .filter(Boolean)
        .join(" ") || undefined
    ),
    generatedAt: now,
    sourceDataAt: now,
    confidence: Math.min(0.99, 0.4 + filled * 0.04),
    status: "ai_generated",
  };
}

type EntityFacts = {
  id: string;
  nameEn: string;
  nameAr?: string;
  introEn?: string;
  introAr?: string;
  productCount: number;
  vendorCount: number;
  manufacturerCount: number;
  cities: string[];
  brands: string[];
  kind: string;
};

export function buildMarketplaceAeo(e: EntityFacts): AeoLayer {
  const now = new Date();
  const src = (field: string, confidence = 0.9): Provenance => ({
    sourceType: "marketplace_entity",
    sourceId: e.id,
    sourceField: field,
    confidence,
    lastVerifiedAt: now,
    verifiedBy: "system",
  });
  const facts: AeoFact[] = [
    fact("name", loc("Entity", "الكيان"), e.nameEn, e.nameAr || e.nameEn, src("name")),
    fact(
      "products",
      loc("Listed products", "المنتجات المدرجة"),
      String(e.productCount),
      String(e.productCount),
      src("productCount", 1)
    ),
    fact(
      "vendors",
      loc("Active vendors", "الموردون النشطون"),
      String(e.vendorCount),
      String(e.vendorCount),
      src("vendorCount", 1)
    ),
  ];
  const faqs: AeoFaq[] = [];
  if (e.vendorCount > 0) {
    faqs.push(
      faq(
        `What ${e.nameEn} suppliers are available on Hukum?`,
        `ما مورّدو ${e.nameAr || e.nameEn} المتاحون على Hukum؟`,
        `${e.vendorCount} vendor${e.vendorCount === 1 ? "" : "s"} currently list ${e.nameEn} on Hukum.`,
        `${e.vendorCount} مورد يعرض حالياً ${e.nameAr || e.nameEn} على Hukum.`,
        src("vendorCount")
      )
    );
  }
  if (e.cities.length) {
    const cities = e.cities.slice(0, 8).join(", ");
    facts.push(fact("locations", loc("Locations", "المواقع"), cities, cities, src("locations")));
    faqs.push(
      faq(
        `Where can I buy ${e.nameEn} in Saudi Arabia?`,
        `أين يمكن شراء ${e.nameAr || e.nameEn} في السعودية؟`,
        `Vendors currently listing ${e.nameEn} operate from: ${cities}.`,
        `الموردون الذين يعرضون ${e.nameAr || e.nameEn} يعملون من: ${cities}.`,
        src("locations")
      )
    );
  }
  if (e.brands.length) {
    const brands = e.brands.slice(0, 12).join(", ");
    facts.push(fact("brands", loc("Brands", "العلامات"), brands, brands, src("brands")));
  }
  if (e.manufacturerCount > 0) {
    facts.push(
      fact(
        "manufacturers",
        loc("Manufacturers named", "الشركات المصنعة المذكورة"),
        String(e.manufacturerCount),
        String(e.manufacturerCount),
        src("manufacturerCount")
      )
    );
  }
  if (e.introEn) {
    faqs.push(
      faq(`What are ${e.nameEn}?`, `ما هي ${e.nameAr || e.nameEn}؟`, e.introEn, e.introAr || e.introEn, src("intro", 0.8))
    );
  }

  const summaryEn =
    e.introEn ||
    `${e.nameEn} on Hukum: ${e.productCount} product listing${e.productCount === 1 ? "" : "s"} from ${e.vendorCount} vendor${e.vendorCount === 1 ? "" : "s"}.`;
  const summaryAr =
    e.introAr ||
    `${e.nameAr || e.nameEn} على Hukum: ${e.productCount} منتج من ${e.vendorCount} مورد.`;

  return {
    summary: loc(summaryEn, summaryAr),
    facts,
    faqs,
    buyingConsiderations: loc(
      e.vendorCount
        ? "Compare verified vendors, MOQ, and lead time on Hukum before requesting a quote."
        : "Supply is limited on this entity; request sourcing help if you need vendors.",
      e.vendorCount
        ? "قارن الموردين الموثّقين والحد الأدنى للطلب ومدة التوريد على Hukum قبل طلب عرض السعر."
        : "المعروض محدود لهذا الكيان؛ اطلب مساعدة التوريد إذا كنت بحاجة إلى موردين."
    ),
    generatedAt: now,
    sourceDataAt: now,
    confidence: e.productCount > 0 ? 0.85 : 0.5,
    status: "ai_generated",
  };
}
