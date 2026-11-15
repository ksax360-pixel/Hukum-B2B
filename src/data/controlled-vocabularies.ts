/** Controlled vocabularies — never free-form vendor tags for these domains. */

export type LocalizedLabel = { en: string; ar: string };

export const BUYER_INTENT_TAGS: Record<string, LocalizedLabel & { synonyms?: string[] }> = {
  wholesale: { en: "Wholesale", ar: "جملة", synonyms: ["bulk wholesale"] },
  bulk_purchase: { en: "Bulk Purchase", ar: "شراء كميات", synonyms: ["bulk order"] },
  oem: { en: "OEM", ar: "تصنيع أصلي", synonyms: ["original equipment"] },
  odm: { en: "ODM", ar: "تصميم وتصنيع", synonyms: ["design manufacturing"] },
  custom_manufacturing: { en: "Custom Manufacturing", ar: "تصنيع مخصص" },
  ready_stock: { en: "Ready Stock", ar: "مخزون جاهز", synonyms: ["in stock", "ready to ship"] },
  made_to_order: { en: "Made to Order", ar: "حسب الطلب" },
  export: { en: "Export", ar: "تصدير" },
  import: { en: "Import", ar: "استيراد" },
  distributor: { en: "Distributor Wanted", ar: "مطلوب موزع" },
  industrial_use: { en: "Industrial Use", ar: "استخدام صناعي" },
  commercial_use: { en: "Commercial Use", ar: "استخدام تجاري" },
  sample_request: { en: "Sample Available", ar: "عينات متاحة" },
  private_label: { en: "Private Label", ar: "علامة خاصة" },
};

export const DOCUMENT_TYPES = [
  "commercial_registration",
  "vat_certificate",
  "national_address",
  "company_profile",
  "iso",
  "product_certificate",
  "catalogue",
  "datasheet",
  "brochure",
  "user_manual",
  "installation_manual",
  "safety_datasheet",
  "warranty",
  "compliance",
  "cad_drawing",
  "technical_drawing",
  "test_report",
  "factory_document",
  "quality_document",
  "insurance",
  "business_license",
  "identity",
  "address_proof",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const CERTIFICATION_STANDARDS: Record<string, LocalizedLabel> = {
  saso: { en: "SASO", ar: "ساسو" },
  iso9001: { en: "ISO 9001", ar: "ISO 9001" },
  iso14001: { en: "ISO 14001", ar: "ISO 14001" },
  iso45001: { en: "ISO 45001", ar: "ISO 45001" },
  iso22000: { en: "ISO 22000", ar: "ISO 22000" },
  iso13485: { en: "ISO 13485", ar: "ISO 13485" },
  haccp: { en: "HACCP", ar: "HACCP" },
  halal: { en: "Halal", ar: "حلال" },
  ce: { en: "CE", ar: "CE" },
  ul: { en: "UL", ar: "UL" },
  fda: { en: "FDA", ar: "FDA" },
  sfda: { en: "SFDA", ar: "هيئة الغذاء والدواء" },
  iec: { en: "IEC", ar: "IEC" },
  gcc: { en: "GSO / GCC", ar: "مواصفات خليجية" },
};

/** Canonical material normalization map */
export const MATERIAL_ALIASES: Record<string, string> = {
  ss304: "ss304",
  "304 ss": "ss304",
  "304ss": "ss304",
  "stainless steel 304": "ss304",
  "ss 304": "ss304",
  "ستانلس 304": "ss304",
  ss316: "ss316",
  "316 ss": "ss316",
  "stainless steel 316": "ss316",
  "ستانلس 316": "ss316",
  pvc: "pvc",
  aluminum: "aluminum",
  aluminium: "aluminum",
  "ألومنيوم": "aluminum",
  steel: "steel",
  "carbon steel": "steel",
};

/** Search synonym groups — map alternate terms to canonical category/product terms */
export const SEARCH_SYNONYM_GROUPS: Array<{
  canonical: string;
  terms: string[];
  categoryKeys?: string[];
}> = [
  {
    canonical: "mobile phones",
    terms: [
      "mobile phone",
      "mobile phones",
      "cellphone",
      "cell phone",
      "smartphone",
      "smartphones",
      "جوال",
      "جوالات",
      "هاتف",
      "هواتف",
      "هاتف محمول",
      "هواتف محمولة",
      "الهواتف المحمولة",
    ],
    categoryKeys: ["electrical", "telecom"],
  },
  {
    canonical: "ppe",
    terms: ["ppe", "personal protective equipment", "safety equipment", "protective equipment", "معدات الحماية الشخصية", "معدات السلامة"],
    categoryKeys: ["safety-equipment"],
  },
  {
    canonical: "safety helmet",
    terms: [
      "hard hat",
      "safety helmet",
      "industrial helmet",
      "industrial safety helmet",
      "خوذة سلامة",
      "خوذة سلامة صناعية",
      "خوذة صناعية",
      "خوذ السلامة",
    ],
    categoryKeys: ["safety-helmets", "safety-equipment"],
  },
  {
    canonical: "centrifugal pump",
    terms: ["centrifugal pump", "water pump", "industrial pump", "مضخة طرد مركزي", "مضخة مياه"],
    categoryKeys: ["oil-gas", "water-treatment", "plumbing"],
  },
  {
    canonical: "ac motor",
    terms: ["ac motor", "alternating current motor", "electric motor", "محرك كهربائي", "محرك تيار متردد"],
    categoryKeys: ["electrical", "industrial-machinery"],
  },
  {
    canonical: "stainless steel",
    terms: ["stainless steel", "ss", "stainles steel", "ستانلس ستيل", "فولاذ مقاوم للصدأ"],
  },
  {
    canonical: "ready mix concrete",
    terms: ["ready mix", "rmc", "ready-mix concrete", "خرسانة جاهزة"],
    categoryKeys: ["cement", "building-materials"],
  },
  {
    canonical: "fr clothing",
    terms: ["fr clothing", "flame resistant", "fire retardant uniform", "ملابس مقاومة للحريق"],
    categoryKeys: ["fr-uniforms", "apparel"],
  },
];

export function normalizeMaterial(input: string): string {
  const key = input.trim().toLowerCase();
  return MATERIAL_ALIASES[key] || key;
}

export function expandSearchQuery(q: string): string[] {
  const lower = q.trim().toLowerCase();
  if (!lower) return [];
  const expanded = new Set<string>([q.trim()]);
  for (const group of SEARCH_SYNONYM_GROUPS) {
    if (group.terms.some((t) => lower.includes(t.toLowerCase()) || t.toLowerCase().includes(lower))) {
      group.terms.forEach((t) => expanded.add(t));
      expanded.add(group.canonical);
    }
  }
  return [...expanded];
}

export function resolveSynonymCategoryKeys(q: string): string[] {
  const lower = q.trim().toLowerCase();
  const keys = new Set<string>();
  for (const group of SEARCH_SYNONYM_GROUPS) {
    if (group.terms.some((t) => lower.includes(t.toLowerCase()))) {
      (group.categoryKeys || []).forEach((k) => keys.add(k));
    }
  }
  return [...keys];
}

export const VENDOR_BUSINESS_TYPES = [
  "manufacturer",
  "distributor",
  "wholesaler",
  "retailer",
  "importer",
  "exporter",
  "service_provider",
  "contractor",
  "trading_company",
  "oem",
  "odm",
  "brand_owner",
  "agent",
  "other",
] as const;

export const PRODUCT_RELATIONSHIP_TYPES = [
  "similar",
  "related",
  "alternative",
  "accessory",
  "spare_part",
  "compatible",
  "replacement",
  "frequently_bought_together",
] as const;
