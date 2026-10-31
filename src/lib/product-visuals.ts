export type VisualProduct = {
  sku?: string;
  name?: { en?: string; ar?: string };
  brand?: string;
  shortDescription?: { en?: string; ar?: string };
  categoryKey?: string;
};

/** Most-specific rules first so gloves/masks don’t all collapse to helmet. */
const RULES: Array<{ key: string; test: RegExp }> = [
  { key: "medical", test: /mask|respirator|ffp|goggle|spectacle|eye.?protect|saf-eye|saf-mask|steth|medical|طبي|pharma|surgical|lab-pip|micropipette/i },
  { key: "fabric", test: /glove|glv|nitrile|cut.?level|saf-glv|fabric|textile|قماش|tex-roll|apron|linen/i },
  { key: "coverall", test: /vest|hi-?vis|harness|fall|boot|shoe|footwear|saf-vest|saf-shoe|saf-boot|saf-fall|saf-harn|coverall|fr |بدلة|uni-fr|workwear/i },
  { key: "pump", test: /ear.?muff|hearing|saf-ear|ear muff|pump|مضخة|mch-pmp|gate valve|oil-vlv|solvent|chemical|hdpe|plastic/i },
  { key: "helmet", test: /helm|hemlet|helmet|خوذة|saf-helm|mining safety|safety\s*helmet/i },
  { key: "cement", test: /cement|أسمنت|opc|bld-cem|rebar|حديد|brick|aggregat|steel.?metal/i },
  { key: "coffee", test: /coffee|قهوة|arabica|fmcg-cof/i },
  { key: "cable", test: /cable|كابل|elc-cbl|electrical|distribution board|elc-db|router|telecom|tel-/i },
  { key: "hvac", test: /hvac|split ac|مكيف|coolair|ahu filter|hvac-flt/i },
  { key: "carton", test: /carton|packag|كرتون|pkg-|stretch wrap|pallet|log-|tape/i },
  { key: "drip", test: /drip|irrigation|ري|agr-|shade net|agriculture/i },
  { key: "print", test: /print|طباعة|prt-dig|campaign|marketing/i },
  { key: "stationery", test: /stationer|قرطاس|stn-|notebook|desk|education|edu-|translation|trn-/i },
  { key: "toner", test: /toner|حبر|off-tnr|office|copy paper|off-pap/i },
  { key: "solar", test: /solar|لوح شمسي|ren-sol|renewable|led high bay|lgt-|lighting/i },
  { key: "service", test: /website|visa|legal|formation|vat|bookkeep|accounting|custom b2b|it-web|svc-|consult|recruit|hr-|retainer|facility maintenance|fac-|professional|pro-con/i },
];

/** Alternate keys so similar products still get different photos. */
const DIVERSIFY: Record<string, string[]> = {
  helmet: ["helmet", "coverall", "pump"],
  fabric: ["fabric", "coverall", "toner"],
  medical: ["medical", "solar", "stationery"],
  coverall: ["coverall", "fabric", "helmet"],
  pump: ["pump", "cable", "hvac"],
  default: ["default", "carton", "service", "print", "drip", "coffee"],
  cement: ["cement", "carton", "pump"],
  cable: ["cable", "pump", "hvac"],
  hvac: ["hvac", "solar", "cable"],
  carton: ["carton", "default", "print"],
  solar: ["solar", "medical", "hvac"],
};

function hashStr(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

export function visualKeyForProduct(product: VisualProduct) {
  const blob = `${product.sku || ""} ${product.brand || ""} ${product.name?.en || ""} ${product.name?.ar || ""} ${product.categoryKey || ""}`;
  for (const rule of RULES) {
    if (rule.test.test(blob)) return rule.key;
  }
  return "default";
}

export const ALL_PRODUCT_VISUAL_KEYS = [
  "helmet",
  "coverall",
  "medical",
  "fabric",
  "solar",
  "pump",
  "cable",
  "carton",
  "toner",
  "stationery",
  "hvac",
  "drip",
  "print",
  "coffee",
  "cement",
  "service",
  "default",
] as const;

/** Pick visual key diversified by SKU so cards don’t share the same photo. */
export function diversifiedVisualKey(product: VisualProduct) {
  const base = visualKeyForProduct(product);
  const pool = DIVERSIFY[base] || [...ALL_PRODUCT_VISUAL_KEYS];
  const seed = `${product.sku || ""}|${product.name?.en || ""}|${product.brand || ""}`;
  const slot = hashStr(seed) % (pool.length * 3);
  return pool[Math.floor(slot / 3) % pool.length];
}

export function visualSrc(key: string, variant = 0) {
  if (variant === 1) return `/products/${key}-2.jpg`;
  if (variant === 2) return `/products/${key}-3.jpg`;
  return `/products/${key}.jpg`;
}

/** All unique primary URLs (key × 3 variants). */
export function allProductVisualUrls() {
  return ALL_PRODUCT_VISUAL_KEYS.flatMap((key) => [0, 1, 2].map((v) => visualSrc(key, v)));
}

/** Preferred URL candidates for a product (type-matched first). */
export function preferredVisualUrls(product: VisualProduct) {
  const base = visualKeyForProduct(product);
  const pool = [...(DIVERSIFY[base] || [base]), ...ALL_PRODUCT_VISUAL_KEYS];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of pool) {
    for (const v of [0, 1, 2]) {
      const url = visualSrc(key, v);
      if (seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

export function mediaFromPrimaryUrl(primaryUrl: string, product: VisualProduct) {
  const en = product.name?.en || "Demo product";
  const ar = product.name?.ar || en;
  const m = primaryUrl.match(/^\/products\/([a-z0-9-]+?)(?:-([23]))?\.jpg$/i);
  const key = m?.[1] || "default";
  const variant = m?.[2] === "2" ? 1 : m?.[2] === "3" ? 2 : 0;
  const a = visualSrc(key, variant);
  const b = visualSrc(key, (variant + 1) % 3);
  const c = visualSrc(key, (variant + 2) % 3);
  return [
    { url: a, type: "image" as const, isPrimary: true, order: 0, alt: { en, ar } },
    { url: b, type: "image" as const, isPrimary: false, order: 1, alt: { en: `${en} — studio view`, ar: `${ar} — عرض استوديو` } },
    { url: c, type: "image" as const, isPrimary: false, order: 2, alt: { en: `${en} — context`, ar: `${ar} — سياق الاستخدام` } },
  ];
}

export function demoMediaForProduct(product: VisualProduct & { categoryKey?: string }, uniqueIndex?: number) {
  const preferred = preferredVisualUrls(product);
  const pool = allProductVisualUrls();
  const primary =
    uniqueIndex != null
      ? preferred[uniqueIndex % preferred.length] || pool[uniqueIndex % pool.length]
      : preferred[hashStr(`${product.sku}|${product.name?.en}`) % preferred.length];
  return mediaFromPrimaryUrl(primary, product);
}

export function vendorLogoSrc(vendor: {
  legalName?: { en?: string } | null;
  tradeName?: string;
  slug?: { en?: string } | null;
  logo?: string;
}) {
  if (vendor.logo) {
    return vendor.logo.replace(/\/vendors\/([^/?]+)\.svg$/i, "/vendors/$1.jpg").replace(/\.svg$/i, ".jpg");
  }
  const blob = `${vendor.tradeName || ""} ${vendor.legalName?.en || ""} ${vendor.slug?.en || ""}`.toLowerCase();
  if (/najd/.test(blob)) return "/vendors/najd.jpg";
  if (/eastern/.test(blob)) return "/vendors/eastern.jpg";
  if (/riyadh|rss|safety supplies/.test(blob)) return "/vendors/rss.jpg";
  return "/vendors/demo.jpg";
}

const DETAILS: Record<
  string,
  {
    manufacturer: string;
    origin: string;
    hsCode: string;
    unit: string;
    leadTime: string;
    paymentTerms: string;
    certifications: string[];
    tags: string[];
    applications: { en: string; ar: string };
    description: { en: string; ar: string };
  }
> = {
  helmet: {
    manufacturer: "SafeHead Demo Manufacturing",
    origin: "Saudi Arabia",
    hsCode: "6506.10",
    unit: "piece",
    leadTime: "5–10 days",
    paymentTerms: "Net 30 / LC at sight",
    certifications: ["EN 397 (demo)", "SASO (demo)"],
    tags: ["ppe", "construction", "head protection"],
    applications: {
      en: "Construction sites, industrial plants, warehouses.",
      ar: "مواقع الإنشاء، المنشآت الصناعية، المستودعات.",
    },
    description: {
      en: "Demo industrial safety helmet in ABS with adjustable ratchet harness. Listed for marketplace walkthroughs — not a certified live SKU.",
      ar: "خوذة سلامة تجريبية من ABS بحزام قابل للضبط. معروضة للعرض التوضيحي وليست منتجاً معتمداً للبيع الفعلي.",
    },
  },
  cement: {
    manufacturer: "Najd Cement Demo",
    origin: "Saudi Arabia",
    hsCode: "2523.29",
    unit: "carton",
    leadTime: "3–7 days",
    paymentTerms: "Advance / Net 15",
    certifications: ["SASO (demo)", "ISO 9001 (demo)"],
    tags: ["construction", "opc", "building materials"],
    applications: {
      en: "Structural concrete, plaster, masonry.",
      ar: "خرسانة إنشائية، لياسة، بناء.",
    },
    description: {
      en: "Demo Portland cement (OPC 42.5) in 50 kg bags for construction procurement demos.",
      ar: "أسمنت بورتلاند تجريبي (OPC 42.5) بأكياس 50 كجم لعروض التوريد.",
    },
  },
  coffee: {
    manufacturer: "Najd Roasters Demo",
    origin: "Ethiopia / blended (demo)",
    hsCode: "0901.21",
    unit: "kg",
    leadTime: "7–14 days",
    paymentTerms: "Net 30",
    certifications: ["HACCP (demo)"],
    tags: ["fmcg", "foodservice", "wholesale"],
    applications: { en: "HoReCa, retail packs, office pantry.", ar: "الضيافة، التجزئة، مكاتب." },
    description: {
      en: "Demo wholesale Arabica coffee beans, 1 kg vacuum packs. Fictional listing for FMCG category.",
      ar: "حبوب قهوة أرابيكا تجريبية بعبوات 1 كجم. قائمة وهمية لفئة السلع الاستهلاكية.",
    },
  },
  medical: {
    manufacturer: "ClinicCare Demo",
    origin: "Germany (demo import)",
    hsCode: "9018.90",
    unit: "set",
    leadTime: "10–15 days",
    paymentTerms: "Net 30",
    certifications: ["CE (demo)", "ISO 13485 (demo)"],
    tags: ["healthcare", "diagnostics"],
    applications: { en: "Clinics, hospitals, training labs.", ar: "عيادات، مستشفيات، معامل تدريب." },
    description: {
      en: "Demo dual-head clinical stethoscope set with spare earpieces. Not a medical device for sale.",
      ar: "طقم سماعة طبية تجريبي. ليس جهازاً طبياً للبيع الفعلي.",
    },
  },
  fabric: {
    manufacturer: "WeaveCo Demo",
    origin: "Saudi Arabia",
    hsCode: "5208.52",
    unit: "meter",
    leadTime: "14–21 days",
    paymentTerms: "LC / Net 45",
    certifications: ["OEKO-TEX (demo)"],
    tags: ["textiles", "workwear"],
    applications: { en: "Uniforms, industrial workwear cutting.", ar: "زي موحد وملابس عمل صناعية." },
    description: {
      en: "Demo 100% cotton industrial fabric roll, 150 cm width. Sample listing only.",
      ar: "لفة قماش قطني صناعي تجريبية بعرض 150 سم.",
    },
  },
  cable: {
    manufacturer: "VoltGulf Demo",
    origin: "Saudi Arabia",
    hsCode: "8544.49",
    unit: "meter",
    leadTime: "7–14 days",
    paymentTerms: "Net 30",
    certifications: ["SASO (demo)"],
    tags: ["electrical", "power"],
    applications: { en: "Building wiring, industrial panels.", ar: "تمديدات المباني واللوحات الصناعية." },
    description: {
      en: "Demo LV power cable listing for electrical category demos.",
      ar: "كابل طاقة تجريبي لفئة الكهرباء.",
    },
  },
  hvac: {
    manufacturer: "CoolAir Demo",
    origin: "Saudi Arabia",
    hsCode: "8415.10",
    unit: "piece",
    leadTime: "10–20 days",
    paymentTerms: "Net 30",
    certifications: ["SASO (demo)"],
    tags: ["hvac", "cooling"],
    applications: { en: "Commercial buildings, offices.", ar: "مبانٍ تجارية ومكاتب." },
    description: {
      en: "Demo commercial split AC listing.",
      ar: "مكيف سبليت تجاري تجريبي.",
    },
  },
  carton: {
    manufacturer: "PackRight Demo",
    origin: "Saudi Arabia",
    hsCode: "4819.10",
    unit: "piece",
    leadTime: "5–10 days",
    paymentTerms: "Net 15",
    certifications: ["ISO 9001 (demo)"],
    tags: ["packaging", "logistics"],
    applications: { en: "E-commerce, warehouse shipping.", ar: "التجارة الإلكترونية والمستودعات." },
    description: {
      en: "Demo corrugated carton listing.",
      ar: "كرتون مموج تجريبي.",
    },
  },
  drip: {
    manufacturer: "GreenOasis Demo",
    origin: "Saudi Arabia",
    hsCode: "8424.81",
    unit: "set",
    leadTime: "7–14 days",
    paymentTerms: "Net 30",
    certifications: ["SASO (demo)"],
    tags: ["agriculture", "irrigation"],
    applications: { en: "Farms, greenhouses.", ar: "مزارع وبيوت محمية." },
    description: {
      en: "Demo drip irrigation kit.",
      ar: "طقم ري بالتنقيط تجريبي.",
    },
  },
  coverall: {
    manufacturer: "WorkFit Demo",
    origin: "Saudi Arabia",
    hsCode: "6211.33",
    unit: "piece",
    leadTime: "10–15 days",
    paymentTerms: "Net 30",
    certifications: ["SASO (demo)"],
    tags: ["ppe", "workwear"],
    applications: { en: "Industrial sites, workshops.", ar: "مواقع صناعية وورش." },
    description: {
      en: "Demo industrial coverall / PPE apparel listing.",
      ar: "بدلة عمل / معدات وقاية تجريبية.",
    },
  },
  print: {
    manufacturer: "PrintForge Demo",
    origin: "Saudi Arabia",
    hsCode: "4911.10",
    unit: "custom",
    leadTime: "3–7 days",
    paymentTerms: "Advance",
    certifications: [],
    tags: ["printing", "marketing"],
    applications: { en: "Corporate branding packs.", ar: "باقات هوية للشركات." },
    description: {
      en: "Demo digital printing package.",
      ar: "باقة طباعة رقمية تجريبية.",
    },
  },
  stationery: {
    manufacturer: "PaperNest Demo",
    origin: "Saudi Arabia",
    hsCode: "4820.10",
    unit: "set",
    leadTime: "5–10 days",
    paymentTerms: "Net 15",
    certifications: [],
    tags: ["office", "stationery"],
    applications: { en: "Corporate offices.", ar: "مكاتب الشركات." },
    description: {
      en: "Demo stationery kit.",
      ar: "طقم قرطاسية تجريبي.",
    },
  },
  toner: {
    manufacturer: "OfficePrime Demo",
    origin: "China (demo import)",
    hsCode: "8443.99",
    unit: "set",
    leadTime: "7–12 days",
    paymentTerms: "Net 30",
    certifications: [],
    tags: ["office", "consumables"],
    applications: { en: "Print rooms, offices.", ar: "غرف طباعة ومكاتب." },
    description: {
      en: "Demo toner cartridge bundle.",
      ar: "باقة خراطيش حبر تجريبية.",
    },
  },
  pump: {
    manufacturer: "PumpMaster Demo",
    origin: "Saudi Arabia",
    hsCode: "8413.70",
    unit: "piece",
    leadTime: "14–28 days",
    paymentTerms: "LC / Net 45",
    certifications: ["ISO 9001 (demo)"],
    tags: ["machinery", "industrial"],
    applications: { en: "Plants, water transfer.", ar: "مصانع ونقل المياه." },
    description: {
      en: "Demo industrial pump listing.",
      ar: "مضخة صناعية تجريبية.",
    },
  },
  solar: {
    manufacturer: "SunNajd Demo",
    origin: "Saudi Arabia",
    hsCode: "8541.40",
    unit: "piece",
    leadTime: "10–20 days",
    paymentTerms: "Net 30",
    certifications: ["IEC (demo)"],
    tags: ["renewable", "energy"],
    applications: { en: "Utility and commercial solar.", ar: "شمسي تجاري ومرافق." },
    description: {
      en: "Demo solar panel listing.",
      ar: "لوح شمسي تجريبي.",
    },
  },
  service: {
    manufacturer: "Hukum Demo",
    origin: "Saudi Arabia",
    hsCode: "",
    unit: "custom",
    leadTime: "On request",
    paymentTerms: "Milestone",
    certifications: [],
    tags: ["services"],
    applications: { en: "B2B professional services.", ar: "خدمات مهنية B2B." },
    description: {
      en: "Demo service package listing.",
      ar: "باقة خدمات تجريبية.",
    },
  },
  default: {
    manufacturer: "Hukum Demo",
    origin: "Saudi Arabia",
    hsCode: "",
    unit: "piece",
    leadTime: "7–14 days",
    paymentTerms: "Net 30",
    certifications: ["SASO (demo)"],
    tags: ["b2b"],
    applications: { en: "General B2B supply.", ar: "توريد B2B عام." },
    description: {
      en: "Demo marketplace product listing.",
      ar: "منتج تجريبي في السوق.",
    },
  },
};

export function demoDetailsForProduct(product: VisualProduct) {
  const key = diversifiedVisualKey(product);
  return DETAILS[key] || DETAILS.default;
}

/** Full demo field pack used by seed / catalog enrichment scripts. */
export function filledProductFields(product: VisualProduct) {
  const details = demoDetailsForProduct(product);
  const en = product.name?.en || "Demo product";
  const ar = product.name?.ar || en;
  const short =
    product.shortDescription?.en || product.shortDescription?.ar
      ? {
          en: product.shortDescription?.en || product.shortDescription?.ar || "",
          ar: product.shortDescription?.ar || product.shortDescription?.en || "",
        }
      : {
          en: details.description.en,
          ar: details.description.ar,
        };

  return {
    media: demoMediaForProduct(product),
    description: details.description,
    shortDescription: short,
    manufacturer: details.manufacturer,
    countryOfOrigin: details.origin,
    hsCode: details.hsCode,
    unit: details.unit,
    leadTime: details.leadTime,
    paymentTerms: details.paymentTerms,
    certifications: details.certifications,
    tags: details.tags,
    applications: details.applications,
    seo: {
      title: { en: `${en} | Hukum`, ar: `${ar} | حكوم` },
      description: { en: short.en, ar: short.ar },
      indexable: true,
    },
  };
}
