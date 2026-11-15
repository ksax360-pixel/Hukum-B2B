// src/lib/product-edit.ts
// What a supplier may set on their own products. Publishing, featuring, scores and moderation are staff-only.

const FIELDS = [
  "name", "shortDescription", "description", "brand", "manufacturerName", "sku", "modelNumber", "categoryId", "tags",
  "price", "currency", "priceType", "priceTiers", "moq", "maxOrderQty", "unit", "leadTime", "deliveryTime", "paymentTerms",
  "availability", "negotiable", "requestQuote", "media", "certifications", "countryOfOrigin", "attributes",
  "customSpecifications", "packaging", "applications", "samplePrice", "sampleAvailable", "minOrderValue", "condition",
] as const;

/** Statuses a supplier can move their own product to. */
export const SUPPLIER_STATUSES = ["draft", "submitted", "archived"] as const;

export function supplierProductFields(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = Object.fromEntries(Object.entries(input).filter(([k]) => (FIELDS as readonly string[]).includes(k)));
  if (Array.isArray(out.media)) {
    // Only images we host or https images; at most 8.
    out.media = (out.media as Array<{ url?: unknown }>)
      .filter((m) => typeof m?.url === "string" && (/^\/api\/media\?path=public%2F/.test(m.url) || /^https:\/\//.test(m.url) || /^\/[\w/.-]+\.(jpg|jpeg|png|webp)$/i.test(m.url)))
      .slice(0, 8)
      .map((m, i) => ({ ...(m as object), order: i, isPrimary: i === 0 }));
  }
  return out;
}

/** Content fields whose change on a live product should be looked at by moderation. */
export const REVIEWED_FIELDS = ["name", "description", "shortDescription", "media", "brand", "price"];

type Listing = {
  name?: { en?: string; ar?: string }; description?: { en?: string; ar?: string }; shortDescription?: { en?: string };
  media?: unknown[]; brand?: string; categoryId?: unknown; price?: number; priceType?: string; moq?: number;
};
export type Gap = "photo" | "arabic" | "description" | "category" | "price" | "brand";

/** What still stops a listing from being buyer-ready, most important first. */
export function listingGaps(p: Listing): Gap[] {
  const gaps: Gap[] = [];
  if (!p.media?.length) gaps.push("photo");
  if (!(p.description?.en || p.shortDescription?.en) || (p.description?.en || "").length < 40) gaps.push("description");
  if (!p.categoryId) gaps.push("category");
  if (!(p.price && p.price > 0) && !p.moq) gaps.push("price");
  if (!p.name?.ar) gaps.push("arabic");
  if (!p.brand) gaps.push("brand");
  return gaps;
}
export const GAP_LABEL: Record<Gap, { en: string; ar: string }> = {
  photo: { en: "Add a photo", ar: "أضف صورة" },
  description: { en: "Describe it in a sentence or two", ar: "اكتب وصفاً بسطر أو سطرين" },
  category: { en: "Pick a category", ar: "اختر الفئة" },
  price: { en: "Add a price or minimum order", ar: "أضف سعراً أو أقل كمية" },
  arabic: { en: "Add the Arabic name", ar: "أضف الاسم بالعربي" },
  brand: { en: "Add the brand", ar: "أضف العلامة التجارية" },
};
