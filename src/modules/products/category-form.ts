import { getTemplateForCategoryKey, type AttributeDef } from "@/data/attribute-templates";

export type ProductFormStep =
  | "identity"
  | "category"
  | "specifications"
  | "commercial"
  | "media"
  | "documents"
  | "certification"
  | "logistics"
  | "seo"
  | "review";

export const PRODUCT_FORM_STEPS: { id: ProductFormStep; title: { en: string; ar: string } }[] = [
  { id: "identity", title: { en: "Product Identity", ar: "هوية المنتج" } },
  { id: "category", title: { en: "Category", ar: "التصنيف" } },
  { id: "specifications", title: { en: "Core Specifications", ar: "المواصفات الأساسية" } },
  { id: "commercial", title: { en: "Commercial Information", ar: "المعلومات التجارية" } },
  { id: "media", title: { en: "Media", ar: "الوسائط" } },
  { id: "documents", title: { en: "Documents", ar: "المستندات" } },
  { id: "certification", title: { en: "Certification", ar: "الشهادات" } },
  { id: "logistics", title: { en: "Logistics", ar: "اللوجستيات" } },
  { id: "seo", title: { en: "SEO", ar: "تحسين الظهور" } },
  { id: "review", title: { en: "Review & Publish", ar: "مراجعة ونشر" } },
];

/**
 * Progressive, category-driven product form — not a universal 150-field dump.
 */
export function getCategoryDrivenForm(categoryKey: string) {
  const tpl = getTemplateForCategoryKey(categoryKey);
  const attrs = tpl?.attributes || [];

  const byGroup = (groups: AttributeDef["group"][]) => attrs.filter((a) => groups.includes(a.group));

  return {
    templateKey: tpl?.key || "generic",
    templateName: tpl?.name,
    steps: PRODUCT_FORM_STEPS,
    fieldsByStep: {
      identity: ["name", "title", "sku", "model", "brand", "manufacturer", "shortDescription", "description"],
      category: ["industryId", "categoryId", "productTypeId", "buyerIntentTags", "applicationTags"],
      specifications: byGroup(["general", "technical", "physical", "performance"]).map((a) => a.key),
      commercial: byGroup(["commercial"]).map((a) => a.key).concat(["price", "currency", "priceType", "moq", "sampleAvailable"]),
      media: ["mainImage", "gallery", "video"],
      documents: ["brochure", "datasheet", "manual"],
      certification: byGroup(["certification", "compliance", "regional"]).map((a) => a.key),
      logistics: byGroup(["logistics", "packaging"]).map((a) => a.key).concat(["incoterms", "lead_time", "country_of_origin"]),
      seo: ["seo.title", "seo.description", "seo.keywords", "searchTags", "synonyms"],
      review: ["completenessScore", "seoReadinessScore"],
    } as Record<ProductFormStep, string[]>,
    mandatoryKeys: attrs.filter((a) => a.requirement === "mandatory").map((a) => a.key),
    recommendedKeys: attrs.filter((a) => a.requirement === "recommended").map((a) => a.key),
    attributes: attrs,
  };
}
