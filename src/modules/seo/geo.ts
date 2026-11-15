import type { Locale } from "@/i18n/config";
import type { Provenance } from "./aeo";

type Loc = { en?: string; ar?: string };

export type GeoClaim = {
  key: string;
  statement: Loc;
  provenance: Provenance;
  freshness: "fresh" | "needs_verification" | "stale" | "unavailable";
};

export type GeoLayer = {
  /** Concise entity identity for generative engines */
  entityCard: Loc;
  /** Machine-oriented claim list — only verified facts */
  claims: GeoClaim[];
  /** Short citation-style attribution */
  attribution: Loc;
  relatedEntityKeys: string[];
  generatedAt: Date;
  sourceDataAt: Date;
  confidence: number;
  status: string;
};

function loc(en?: string, ar?: string): Loc {
  return { en: en || "", ar: ar || "" };
}

export function pickGeo(locale: Locale, value?: Loc, fallback = "") {
  return (locale === "ar" ? value?.ar || value?.en : value?.en || value?.ar) || fallback;
}

type ProductGeoInput = {
  id: string;
  nameEn: string;
  nameAr?: string;
  brand?: string;
  manufacturer?: string;
  vendorName?: string;
  vendorVerified?: boolean;
  city?: string;
  country?: string;
  moq?: number;
  unit?: string;
  categoryName?: string;
  categoryNameAr?: string;
  certifications?: string[];
  availability?: string;
};

export function buildProductGeo(p: ProductGeoInput): GeoLayer {
  const now = new Date();
  const src = (field: string, confidence = 0.95): Provenance => ({
    sourceType: "product",
    sourceId: p.id,
    sourceField: field,
    confidence,
    lastVerifiedAt: now,
    verifiedBy: "system",
  });
  const claims: GeoClaim[] = [];
  const nameAr = p.nameAr || p.nameEn;

  claims.push({
    key: "identity",
    statement: loc(
      `${p.nameEn} is a B2B product listing on Hukum.`,
      `${nameAr} منتج مدرج للتجارة بين الشركات على Hukum.`
    ),
    provenance: src("name"),
    freshness: "fresh",
  });

  if (p.manufacturer) {
    claims.push({
      key: "manufacturer",
      statement: loc(
        `Manufacturer named on this listing: ${p.manufacturer}.`,
        `الشركة المصنعة المذكورة في هذا العرض: ${p.manufacturer}.`
      ),
      provenance: src("manufacturer"),
      freshness: "fresh",
    });
  }
  if (p.brand) {
    claims.push({
      key: "brand",
      statement: loc(`Brand: ${p.brand}.`, `العلامة التجارية: ${p.brand}.`),
      provenance: src("brand"),
      freshness: "fresh",
    });
  }
  if (p.vendorName) {
    claims.push({
      key: "supplier",
      statement: loc(
        `Offered by ${p.vendorName}${p.vendorVerified ? " (verified vendor)" : ""} on Hukum.`,
        `يعرضه ${p.vendorName}${p.vendorVerified ? " (مورد موثّق)" : ""} على Hukum.`
      ),
      provenance: src("vendorId", 0.9),
      freshness: "fresh",
    });
  }
  if (p.moq != null) {
    const moq = `${p.moq}${p.unit ? ` ${p.unit}` : ""}`;
    claims.push({
      key: "moq",
      statement: loc(`Minimum order quantity (MOQ): ${moq}.`, `الحد الأدنى للطلب: ${moq}.`),
      provenance: src("moq"),
      freshness: "fresh",
    });
  }
  const place = [p.city, p.country].filter(Boolean).join(", ");
  if (place) {
    claims.push({
      key: "location",
      statement: loc(`Vendor location: ${place}.`, `موقع المورد: ${place}.`),
      provenance: src("vendor.location", 0.85),
      freshness: "fresh",
    });
  }
  if (p.certifications?.length) {
    const certs = p.certifications.join(", ");
    claims.push({
      key: "certs",
      statement: loc(`Listed certifications: ${certs}.`, `الشهادات المدرجة: ${certs}.`),
      provenance: src("certifications"),
      freshness: "needs_verification",
    });
  }

  const entityCard = loc(
    [
      p.nameEn,
      p.categoryName ? `Category: ${p.categoryName}` : "",
      p.vendorName ? `Supplier: ${p.vendorName}` : "",
      place ? `From: ${place}` : "",
    ]
      .filter(Boolean)
      .join(". "),
    [
      nameAr,
      p.categoryNameAr || p.categoryName ? `التصنيف: ${p.categoryNameAr || p.categoryName}` : "",
      p.vendorName ? `المورد: ${p.vendorName}` : "",
      place ? `من: ${place}` : "",
    ]
      .filter(Boolean)
      .join(". ")
  );

  return {
    entityCard,
    claims,
    attribution: loc(
      "Source: Hukum verified marketplace listing. Facts reflect vendor-submitted data at generation time.",
      "المصدر: عرض موثّق على Hukum. الحقائق تعكس بيانات المورد وقت التوليد."
    ),
    relatedEntityKeys: [],
    generatedAt: now,
    sourceDataAt: now,
    confidence: Math.min(0.99, 0.45 + claims.length * 0.06),
    status: "ai_generated",
  };
}

type EntityGeoInput = {
  id: string;
  key: string;
  nameEn: string;
  nameAr?: string;
  introEn?: string;
  introAr?: string;
  productCount: number;
  vendorCount: number;
  manufacturerCount: number;
  cities: string[];
  brands: string[];
  relatedKeys?: string[];
};

export function buildMarketplaceGeo(e: EntityGeoInput): GeoLayer {
  const now = new Date();
  const src = (field: string, confidence = 0.9): Provenance => ({
    sourceType: "marketplace_entity",
    sourceId: e.id,
    sourceField: field,
    confidence,
    lastVerifiedAt: now,
    verifiedBy: "system",
  });
  const nameAr = e.nameAr || e.nameEn;
  const claims: GeoClaim[] = [
    {
      key: "identity",
      statement: loc(
        `${e.nameEn} is a Hukum marketplace entity for B2B sourcing.`,
        `${nameAr} كيان سوق على Hukum للتوريد بين الشركات.`
      ),
      provenance: src("name"),
      freshness: e.productCount > 0 ? "fresh" : "unavailable",
    },
    {
      key: "supply",
      statement: loc(
        `Currently ${e.productCount} product listing(s) from ${e.vendorCount} vendor(s).`,
        `حالياً ${e.productCount} منتج من ${e.vendorCount} مورد.`
      ),
      provenance: src("productCount", 1),
      freshness: e.productCount > 0 ? "fresh" : "unavailable",
    },
  ];
  if (e.cities.length) {
    const cities = e.cities.slice(0, 8).join(", ");
    claims.push({
      key: "locations",
      statement: loc(
        `Vendors listing ${e.nameEn} operate from: ${cities}.`,
        `موردو ${nameAr} يعملون من: ${cities}.`
      ),
      provenance: src("locations"),
      freshness: "fresh",
    });
  }
  if (e.brands.length) {
    claims.push({
      key: "brands",
      statement: loc(
        `Brands appearing in listings: ${e.brands.slice(0, 12).join(", ")}.`,
        `العلامات الظاهرة في العروض: ${e.brands.slice(0, 12).join("، ")}.`
      ),
      provenance: src("brands"),
      freshness: "fresh",
    });
  }
  if (e.manufacturerCount > 0) {
    claims.push({
      key: "manufacturers",
      statement: loc(
        `${e.manufacturerCount} distinct manufacturer name(s) appear on active listings.`,
        `يظهر ${e.manufacturerCount} اسم مصنع على العروض النشطة.`
      ),
      provenance: src("manufacturerCount"),
      freshness: "fresh",
    });
  }

  return {
    entityCard: loc(
      e.introEn ||
        `${e.nameEn} on Hukum — ${e.productCount} listings, ${e.vendorCount} vendors.`,
      e.introAr || `${nameAr} على Hukum — ${e.productCount} منتج، ${e.vendorCount} مورد.`
    ),
    claims,
    attribution: loc(
      "Source: Hukum marketplace entity. Counts reflect active published offers only.",
      "المصدر: كيان سوق Hukum. الأعداد تعكس العروض المنشورة النشطة فقط."
    ),
    relatedEntityKeys: e.relatedKeys || [],
    generatedAt: now,
    sourceDataAt: now,
    confidence: e.productCount > 0 ? 0.88 : 0.5,
    status: "ai_generated",
  };
}
