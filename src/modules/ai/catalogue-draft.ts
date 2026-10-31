/**
 * AI catalogue builder — enrich extracted rows into schema-ready draft listings.
 * Always produces bilingual copy, SEO, and 2–3 images. Never auto-publishes.
 */
import {
  demoDetailsForProduct,
  demoMediaForProduct,
  visualKeyForProduct,
  type VisualProduct,
} from "@/lib/product-visuals";
import { slugifyText } from "@/lib/utils";
import { productCompleteness } from "@/modules/products/completeness";
import { Product } from "@/modules/products/product.model";
import { copyPublicAssetToProductUpload } from "@/lib/persist-upload";

export type CatalogueExtractRow = {
  nameEn?: string;
  nameAr?: string;
  name?: string;
  title?: string;
  sku?: string;
  brand?: string;
  categoryHint?: string;
  specs?: Record<string, string>;
  moq?: number | null;
  price?: number | null;
  discountPrice?: number | null;
  currency?: string;
  imageUrl?: string;
  confidence?: number;
  source?: "ai" | "heuristic";
  // enriched fields (optional on input)
  shortDescription?: { en?: string; ar?: string };
  description?: { en?: string; ar?: string };
  seo?: {
    title?: { en?: string; ar?: string };
    description?: { en?: string; ar?: string };
    keywords?: { en?: string; ar?: string };
  };
  media?: Array<{
    url: string;
    type?: string;
    isPrimary?: boolean;
    order?: number;
    alt?: { en?: string; ar?: string };
  }>;
};

export type CatalogueDraftPreview = {
  nameEn: string;
  nameAr: string;
  sku: string;
  brand: string;
  categoryHint: string;
  specs: Record<string, string>;
  moq: number | null;
  /** Selling / list price shown to buyers */
  price: number | null;
  /** Compare-at (strikethrough) when higher than price */
  retailPrice: number | null;
  currency: string;
  unit: string;
  imageUrl: string;
  media: Array<{
    url: string;
    type: "image";
    isPrimary: boolean;
    order: number;
    alt: { en: string; ar: string };
  }>;
  shortDescription: { en: string; ar: string };
  description: { en: string; ar: string };
  applications: { en: string; ar: string };
  seo: {
    title: { en: string; ar: string };
    description: { en: string; ar: string };
    keywords: { en: string; ar: string };
    h1: { en: string; ar: string };
    indexable: boolean;
  };
  tags: string[];
  confidence: number;
  source: "ai" | "heuristic";
};

function moneyPair(list: number | null | undefined, sale: number | null | undefined) {
  const a = list != null && Number.isFinite(Number(list)) ? Number(list) : null;
  const b = sale != null && Number.isFinite(Number(sale)) ? Number(sale) : null;
  if (a == null && b == null) return { price: null as number | null, retailPrice: null as number | null };
  if (a != null && b != null && a !== b) {
    return { price: Math.min(a, b), retailPrice: Math.max(a, b) };
  }
  return { price: a ?? b, retailPrice: null as number | null };
}

function cleanTitle(input: string) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function buildCopy(nameEn: string, nameAr: string, categoryHint: string, details: ReturnType<typeof demoDetailsForProduct>) {
  const shortEn =
    details.description.en.length > 160
      ? `${details.description.en.slice(0, 157)}…`
      : details.description.en;
  const shortAr =
    details.description.ar.length > 160
      ? `${details.description.ar.slice(0, 157)}…`
      : details.description.ar;

  const descEn = [
    `${nameEn} for B2B procurement on Hukum.`,
    details.description.en,
    categoryHint ? `Category hint: ${categoryHint}.` : "",
    "Draft listing — supplier must review before publish.",
  ]
    .filter(Boolean)
    .join(" ");

  const descAr = [
    `${nameAr} للتوريد بين الشركات عبر حكوم.`,
    details.description.ar,
    "مسودة — يجب مراجعة المورد قبل النشر.",
  ].join(" ");

  const keywordsEn = [nameEn, categoryHint, ...(details.tags || [])]
    .filter(Boolean)
    .join(", ");
  const keywordsAr = [nameAr, categoryHint, ...(details.tags || [])]
    .filter(Boolean)
    .join("، ");

  return {
    shortDescription: { en: shortEn, ar: shortAr },
    description: { en: descEn, ar: descAr },
    applications: details.applications,
    seo: {
      title: {
        en: `${nameEn} | Hukum`,
        ar: `${nameAr} | حكوم`,
      },
      description: { en: shortEn, ar: shortAr },
      keywords: { en: keywordsEn, ar: keywordsAr },
      h1: { en: nameEn, ar: nameAr },
      indexable: true,
    },
    tags: details.tags || [],
    unit: details.unit || "piece",
  };
}

/** Turn a raw extract row into a clean, schema-aligned draft preview (3 images + SEO + copy). */
export function enrichCatalogueDraft(row: CatalogueExtractRow, index = 0): CatalogueDraftPreview {
  const nameEn = cleanTitle(row.nameEn || row.name || row.title || `Product ${index + 1}`);
  const nameAr = cleanTitle(row.nameAr || nameEn);
  const sku =
    String(row.sku || "").trim() ||
    `DRAFT-${slugifyText(nameEn).slice(0, 8).toUpperCase() || index + 1}`;
  const brand = String(row.brand || "").trim();
  const categoryHint = String(row.categoryHint || "General").trim() || "General";
  const visual: VisualProduct = {
    sku,
    brand,
    name: { en: nameEn, ar: nameAr },
    categoryKey: categoryHint,
  };
  const details = demoDetailsForProduct(visual);
  const copy = buildCopy(nameEn, nameAr, categoryHint, details);
  const media = demoMediaForProduct(visual, index).map((m) => ({
    url: m.url,
    type: "image" as const,
    isPrimary: Boolean(m.isPrimary),
    order: Number(m.order) || 0,
    alt: { en: m.alt?.en || nameEn, ar: m.alt?.ar || nameAr },
  }));
  // Prefer 3 images; ensure at least 2
  const gallery = media.slice(0, 3);
  while (gallery.length < 2 && media[0]) {
    gallery.push({ ...media[0], isPrimary: false, order: gallery.length });
  }

  const { price, retailPrice } = moneyPair(row.price, row.discountPrice);

  return {
    nameEn,
    nameAr,
    sku,
    brand,
    categoryHint,
    specs: row.specs && typeof row.specs === "object" ? row.specs : {},
    moq: row.moq != null && Number.isFinite(Number(row.moq)) ? Number(row.moq) : null,
    price,
    retailPrice,
    currency: String(row.currency || "SAR"),
    unit: copy.unit,
    imageUrl: gallery[0]?.url || row.imageUrl || "/products/default.jpg",
    media: gallery,
    shortDescription: row.shortDescription?.en
      ? {
          en: String(row.shortDescription.en),
          ar: String(row.shortDescription.ar || row.shortDescription.en),
        }
      : copy.shortDescription,
    description: row.description?.en
      ? {
          en: String(row.description.en),
          ar: String(row.description.ar || row.description.en),
        }
      : copy.description,
    applications: copy.applications,
    seo: {
      title: row.seo?.title?.en
        ? {
            en: String(row.seo.title.en),
            ar: String(row.seo.title.ar || row.seo.title.en),
          }
        : copy.seo.title,
      description: row.seo?.description?.en
        ? {
            en: String(row.seo.description.en),
            ar: String(row.seo.description.ar || row.seo.description.en),
          }
        : copy.seo.description,
      keywords: row.seo?.keywords?.en
        ? {
            en: String(row.seo.keywords.en),
            ar: String(row.seo.keywords.ar || row.seo.keywords.en),
          }
        : copy.seo.keywords,
      h1: copy.seo.h1,
      indexable: true,
    },
    tags: copy.tags,
    confidence: Number(row.confidence ?? 0.55),
    source: row.source === "ai" ? "ai" : "heuristic",
  };
}

export function enrichCatalogueDrafts(rows: CatalogueExtractRow[]): CatalogueDraftPreview[] {
  return (rows || []).map((row, i) => enrichCatalogueDraft(row, i));
}

async function attachUploadedMedia(
  draft: CatalogueDraftPreview,
  vendorId: string,
  productId: string
) {
  const out = [];
  for (let i = 0; i < draft.media.length; i += 1) {
    const m = draft.media[i];
    // Already uploaded AI /api/media URLs — keep as-is (do not pull from stock public/)
    if (m.url && (/^https?:\/\//i.test(m.url) || m.url.startsWith("/api/media"))) {
      out.push({
        url: m.url,
        type: "image" as const,
        isPrimary: Boolean(m.isPrimary) || i === 0,
        order: i,
        alt: m.alt,
      });
      continue;
    }
    try {
      const uploaded = await copyPublicAssetToProductUpload({
        publicUrl: m.url,
        vendorId,
        productId,
        alt: m.alt,
        isPrimary: m.isPrimary || i === 0,
        order: i,
      });
      out.push({
        url: uploaded.url,
        type: "image" as const,
        isPrimary: uploaded.isPrimary,
        order: uploaded.order,
        alt: uploaded.alt,
      });
    } catch {
      out.push({
        url: m.url,
        type: "image" as const,
        isPrimary: Boolean(m.isPrimary) || i === 0,
        order: i,
        alt: m.alt,
      });
    }
  }
  return out;
}

/** Persist enriched catalogue rows as Product drafts (never published). */
export async function createDraftProductsFromCatalogue(opts: {
  drafts: CatalogueDraftPreview[];
  vendorId: string;
  createdBy?: string;
  extractionId?: string;
}) {
  const created: Array<{ id: string; sku: string; nameEn: string; status: string }> = [];

  for (const draft of opts.drafts) {
    const tempId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const media = await attachUploadedMedia(draft, opts.vendorId, tempId);
    const payload = {
      vendorId: opts.vendorId,
      name: { en: draft.nameEn, ar: draft.nameAr },
      title: { en: draft.nameEn, ar: draft.nameAr },
      slug: { en: slugifyText(draft.nameEn) || `product-${tempId}`, ar: "" },
      sku: draft.sku,
      brand: draft.brand || undefined,
      description: draft.description,
      shortDescription: draft.shortDescription,
      applications: draft.applications,
      tags: [...new Set([...(draft.tags || []), "ai-catalogue", draft.source])],
      searchTags: [...new Set([...(draft.tags || []), "ai-catalogue"])],
      unit: draft.unit,
      moq: draft.moq ?? undefined,
      price: draft.price ?? undefined,
      retailPrice: draft.retailPrice ?? undefined,
      currency: draft.currency || "SAR",
      priceType: draft.price != null ? "fixed" : "price_on_request",
      media,
      seo: draft.seo,
      status: "draft",
      customSpecifications: [
        ...Object.entries(draft.specs || {}).map(([key, value]) => ({
          key,
          value: String(value),
        })),
        ...(opts.extractionId
          ? [{ key: "aiExtractionId", value: String(opts.extractionId) }]
          : []),
        {
          key: "visualKey",
          value: visualKeyForProduct({
            name: { en: draft.nameEn, ar: draft.nameAr },
            sku: draft.sku,
            brand: draft.brand,
            categoryKey: draft.categoryHint,
          }),
        },
      ],
    };

    const completeness = productCompleteness(payload);
    const doc = await Product.create({
      ...payload,
      completenessScore: completeness.score,
      seoReadinessScore: completeness.seoScore,
    });

    // Re-copy media under real product id when possible
    try {
      const remedia = await attachUploadedMedia(draft, opts.vendorId, String(doc._id));
      doc.media = remedia;
      doc.markModified("media");
      await doc.save();
    } catch {
      /* keep first media urls */
    }

    created.push({
      id: String(doc._id),
      sku: draft.sku,
      nameEn: draft.nameEn,
      status: "draft",
    });
  }

  return created;
}
