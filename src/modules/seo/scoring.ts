import { seoScore } from "./engine";

type Loc = { en?: string; ar?: string };

type ProductLike = {
  name?: Loc;
  description?: Loc;
  shortDescription?: Loc;
  brand?: string;
  manufacturer?: string;
  manufacturerName?: string;
  categoryId?: unknown;
  media?: unknown[];
  applications?: Loc | string;
  industries?: unknown[];
  industryId?: unknown;
  moq?: number;
  price?: number;
  certifications?: unknown[];
  documents?: unknown[];
  seo?: {
    title?: Loc;
    description?: Loc;
    canonical?: string;
    h1?: Loc;
    ogTitle?: Loc;
  };
  aeo?: { faqs?: unknown[]; facts?: unknown[]; summary?: Loc };
  geo?: { entityCard?: Loc; claims?: unknown[] };
  marketplaceEntityIds?: unknown[];
  slug?: Loc;
};

function has(v: unknown) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;
}

export type DiscoveryScores = {
  seoAr: number;
  seoEn: number;
  aeoAr: number;
  aeoEn: number;
  geoAr: number;
  geoEn: number;
  /** Weighted Arabic-first readiness */
  discovery: number;
  seo: number;
  aeo: number;
  gaps: string[];
};

export function productDiscoveryScores(p: ProductLike): DiscoveryScores {
  const gaps: string[] = [];

  const seoArFlags = {
    identity: has(p.name?.ar),
    description: has(p.description?.ar) || has(p.shortDescription?.ar),
    title: has(p.seo?.title?.ar),
    meta: has(p.seo?.description?.ar),
    h1: has(p.seo?.h1?.ar),
    category: Boolean(p.categoryId),
    image: Array.isArray(p.media) && p.media.length > 0,
    canonical: has(p.seo?.canonical),
  };
  const seoEnFlags = {
    identity: has(p.name?.en),
    description: has(p.description?.en) || has(p.shortDescription?.en),
    title: has(p.seo?.title?.en),
    meta: has(p.seo?.description?.en),
    h1: has(p.seo?.h1?.en),
    category: Boolean(p.categoryId),
    image: Array.isArray(p.media) && p.media.length > 0,
    canonical: has(p.seo?.canonical),
    slug: has(p.slug?.en),
    og: has(p.seo?.ogTitle?.en) || has(p.seo?.title?.en),
  };

  const aeoArFlags = {
    summary: has(p.aeo?.summary?.ar),
    faqs: Array.isArray(p.aeo?.faqs) && p.aeo!.faqs!.length >= 2,
    facts: Array.isArray(p.aeo?.facts) && p.aeo!.facts!.length >= 2,
    brand: has(p.brand),
    manufacturer: has(p.manufacturer) || has(p.manufacturerName),
    commercial: p.moq != null || p.price != null,
    entities: Array.isArray(p.marketplaceEntityIds) && p.marketplaceEntityIds.length > 0,
  };
  const aeoEnFlags = {
    summary: has(p.aeo?.summary?.en),
    faqs: Array.isArray(p.aeo?.faqs) && p.aeo!.faqs!.length >= 2,
    facts: Array.isArray(p.aeo?.facts) && p.aeo!.facts!.length >= 2,
    brand: has(p.brand),
    manufacturer: has(p.manufacturer) || has(p.manufacturerName),
    applications: has(typeof p.applications === "string" ? p.applications : p.applications?.en),
    industries: has(p.industryId) || has(p.industries),
    entities: Array.isArray(p.marketplaceEntityIds) && p.marketplaceEntityIds.length > 0,
  };

  const geoArFlags = {
    card: has(p.geo?.entityCard?.ar),
    claims: Array.isArray(p.geo?.claims) && p.geo!.claims!.length >= 2,
    manufacturer: has(p.manufacturer) || has(p.manufacturerName),
    entities: Array.isArray(p.marketplaceEntityIds) && p.marketplaceEntityIds.length > 0,
  };
  const geoEnFlags = {
    card: has(p.geo?.entityCard?.en),
    claims: Array.isArray(p.geo?.claims) && p.geo!.claims!.length >= 2,
    manufacturer: has(p.manufacturer) || has(p.manufacturerName),
    entities: Array.isArray(p.marketplaceEntityIds) && p.marketplaceEntityIds.length > 0,
  };

  if (!seoArFlags.identity) gaps.push("Add Arabic product name");
  if (!seoArFlags.title) gaps.push("Add Arabic SEO title");
  if (!seoEnFlags.identity) gaps.push("Add English product name");
  if (!seoEnFlags.title) gaps.push("Add English SEO title");
  if (!aeoArFlags.summary) gaps.push("Add Arabic AEO summary");
  if (!geoArFlags.card) gaps.push("Add Arabic GEO entity card");
  if (!aeoEnFlags.manufacturer && !aeoArFlags.manufacturer) gaps.push("Add manufacturer");
  if (!seoArFlags.category) gaps.push("Assign a category");
  if (!seoEnFlags.image) gaps.push("Add product image");

  const seoAr = seoScore(seoArFlags);
  const seoEn = seoScore(seoEnFlags);
  const aeoAr = seoScore(aeoArFlags);
  const aeoEn = seoScore(aeoEnFlags);
  const geoAr = seoScore(geoArFlags);
  const geoEn = seoScore(geoEnFlags);

  // Arabic-first weighting: AR 55% / EN 45% across SEO+AEO+GEO
  const discovery = Math.round(
    (seoAr * 0.22 + aeoAr * 0.18 + geoAr * 0.15 + seoEn * 0.18 + aeoEn * 0.14 + geoEn * 0.13)
  );

  return {
    seoAr,
    seoEn,
    aeoAr,
    aeoEn,
    geoAr,
    geoEn,
    discovery,
    seo: Math.round(seoAr * 0.55 + seoEn * 0.45),
    aeo: Math.round(aeoAr * 0.55 + aeoEn * 0.45),
    gaps,
  };
}

/** @deprecated use productDiscoveryScores — kept for pipeline compatibility */
export function productSeoAeoScores(p: ProductLike) {
  const d = productDiscoveryScores(p);
  return { ...d };
}

export function entityQualityGate(input: {
  productCount: number;
  vendorCount: number;
  hasIntro: boolean;
  hasTitle: boolean;
  hasCanonical: boolean;
  hasArabicName?: boolean;
  lifecycle: string;
  locked?: boolean;
  override?: boolean | null;
}): { indexable: boolean; lifecycle: "active" | "emerging" | "unavailable" | "archived" } {
  if (input.lifecycle === "archived" || input.locked) {
    return { indexable: false, lifecycle: "archived" };
  }
  if (input.override === false) {
    const lifecycle = input.productCount >= 3 ? "active" : input.productCount > 0 ? "emerging" : "unavailable";
    return { indexable: false, lifecycle };
  }
  if (input.productCount <= 0) {
    return { indexable: false, lifecycle: "unavailable" };
  }
  const lifecycle = input.productCount >= 3 && input.vendorCount >= 1 ? "active" : "emerging";
  // Prefer Arabic identity for Saudi marketplace; allow EN-only emerging pages but score lower via discovery
  const uniqueEnough =
    input.hasIntro && input.hasTitle && input.hasCanonical && (input.hasArabicName !== false || input.productCount >= 3);
  const indexable = uniqueEnough && (input.override === true || input.productCount >= 1);
  return { indexable, lifecycle };
}

export function entityDiscoveryScores(input: {
  name?: Loc;
  intro?: Loc;
  seo?: { title?: Loc; description?: Loc; canonical?: string };
  aeo?: { summary?: Loc; faqs?: unknown[]; facts?: unknown[] };
  geo?: { entityCard?: Loc; claims?: unknown[] };
  productCount?: number;
  vendorCount?: number;
  slug?: string;
}): DiscoveryScores {
  return productDiscoveryScores({
    name: input.name,
    description: input.intro,
    seo: input.seo,
    aeo: input.aeo,
    geo: input.geo,
    marketplaceEntityIds: input.productCount ? [{}] : [],
    media: input.productCount ? [{}] : [],
    categoryId: input.slug || true,
    slug: { en: input.slug },
    manufacturer: input.vendorCount ? "listed" : undefined,
  });
}
