/**
 * Generate SEO signals from structured product data — not keyword spam.
 */

type ProductSeoSource = {
  name?: { en?: string; ar?: string };
  brand?: string;
  manufacturer?: string;
  manufacturerName?: string;
  categoryName?: { en?: string; ar?: string };
  productTypeName?: { en?: string; ar?: string };
  attributes?: Record<string, unknown>;
  applicationTags?: string[];
  buyerIntentTags?: string[];
  countryOfOrigin?: string;
  certifications?: string[];
};

export function buildProductSeoFromStructure(p: ProductSeoSource): {
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  keywords: { en: string; ar: string };
} {
  const nameEn = p.name?.en || "Product";
  const nameAr = p.name?.ar || nameEn;
  const brand = p.brand || p.manufacturerName || p.manufacturer || "";
  const catEn = p.categoryName?.en || "";
  const catAr = p.categoryName?.ar || catEn;
  const typeEn = p.productTypeName?.en || "";
  const material = String(p.attributes?.material || p.attributes?.fabric_type || "");
  const power = String(p.attributes?.power || p.attributes?.capacity || "");

  const titleEn = [brand, nameEn, typeEn || catEn, p.countryOfOrigin ? `| ${p.countryOfOrigin}` : ""]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70);

  const titleAr = [nameAr, brand, catAr].filter(Boolean).join(" — ").slice(0, 70);

  const partsEn = [
    `${nameEn}${brand ? ` by ${brand}` : ""}`,
    catEn ? `in ${catEn}` : "",
    material ? `Material: ${material}` : "",
    power ? `Spec: ${power}` : "",
    p.applicationTags?.length ? `Applications: ${p.applicationTags.slice(0, 3).join(", ")}` : "",
    p.certifications?.length ? `Certifications: ${p.certifications.slice(0, 3).join(", ")}` : "",
    "Available for B2B procurement on Hukum.",
  ].filter(Boolean);

  const partsAr = [
    `${nameAr}${brand ? ` من ${brand}` : ""}`,
    catAr ? `ضمن ${catAr}` : "",
    "متاح للشراء بين الشركات على Hukum.",
  ].filter(Boolean);

  const kwEn = [
    nameEn,
    brand,
    catEn,
    typeEn,
    material,
    ...(p.applicationTags || []),
    ...(p.buyerIntentTags || []),
    p.countryOfOrigin || "",
  ]
    .filter(Boolean)
    .join(", ");

  const kwAr = [nameAr, brand, catAr].filter(Boolean).join("، ");

  return {
    title: { en: titleEn, ar: titleAr },
    description: {
      en: partsEn.join(". ").slice(0, 160),
      ar: partsAr.join(". ").slice(0, 160),
    },
    keywords: { en: kwEn, ar: kwAr },
  };
}

export function buildCategorySeo(input: {
  name: { en: string; ar: string };
  description?: { en?: string; ar?: string };
  synonyms?: { en?: string[]; ar?: string[] };
}): {
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  keywords: { en: string; ar: string };
} {
  return {
    title: {
      en: `${input.name.en} Suppliers in Saudi Arabia | Hukum`.slice(0, 70),
      ar: `موردو ${input.name.ar} في السعودية | Hukum`.slice(0, 70),
    },
    description: {
      en: (input.description?.en || `Find verified ${input.name.en} suppliers on Hukum.`).slice(0, 160),
      ar: (input.description?.ar || `اعثر على موردي ${input.name.ar} المعتمدين على Hukum.`).slice(0, 160),
    },
    keywords: {
      en: [input.name.en, ...(input.synonyms?.en || [])].join(", "),
      ar: [input.name.ar, ...(input.synonyms?.ar || [])].join("، "),
    },
  };
}
