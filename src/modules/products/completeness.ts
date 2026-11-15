type Localized = { en?: string; ar?: string };

type ProductLike = {
  name?: Localized;
  title?: Localized;
  description?: Localized;
  shortDescription?: Localized;
  brand?: string;
  manufacturer?: string;
  manufacturerName?: string;
  sku?: string;
  media?: unknown[];
  categoryId?: unknown;
  productTypeId?: unknown;
  industryId?: unknown;
  industries?: unknown[];
  attributes?: unknown;
  documents?: unknown[];
  certifications?: unknown[];
  certificationRecords?: unknown[];
  price?: number;
  priceType?: string;
  priceTiers?: unknown[];
  moq?: number;
  currency?: string;
  sampleAvailable?: boolean;
  tradeTerms?: string;
  incoterms?: string;
  packaging?: {
    type?: string;
    unitsPerPackage?: number;
    dimensions?: unknown;
    weight?: number;
  };
  logistics?: {
    portOfLoading?: string;
    shippingMethods?: unknown[];
    productionLeadTime?: string;
    shippingLeadTime?: string;
    incoterms?: string;
    exportCapable?: boolean;
  };
  shipping?: { available?: boolean; method?: string; warehouseLocation?: string };
  origin?: { countryOfOrigin?: string; manufacturingCountry?: string };
  countryOfOrigin?: string;
  hsCode?: string;
  regional?: {
    saudiStandards?: unknown[];
    gccStandards?: unknown[];
    hsCode?: string;
    productRegistration?: string;
  };
  seo?: {
    title?: Localized;
    description?: Localized;
    slug?: Localized;
    keywords?: Localized;
  };
  slug?: Localized;
  searchTags?: unknown[];
  buyerIntentTags?: unknown[];
  customSpecifications?: unknown[];
  variants?: unknown[];
  customerReviews?: unknown[];
};

function mapSize(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Map) return value.size;
  if (typeof value === "object") return Object.keys(value as object).length;
  return 0;
}

function hasAny(...vals: unknown[]): boolean {
  return vals.some((v) => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "number") return !Number.isNaN(v);
    if (typeof v === "boolean") return true;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

export function productCompleteness(p: ProductLike) {
  const sections: { key: string; ok: boolean }[] = [
    {
      key: "basic",
      ok: Boolean(
        (p.name?.en || p.title?.en) &&
          (p.description?.en || p.shortDescription?.en) &&
          (p.brand || p.manufacturer || p.manufacturerName)
      ),
    },
    {
      key: "media",
      ok: Boolean(p.media?.length),
    },
    {
      key: "category",
      ok: Boolean(p.categoryId || p.productTypeId || p.industryId || p.industries?.length),
    },
    {
      key: "attributes",
      ok: mapSize(p.attributes) > 0 || Boolean(p.customSpecifications?.length) || Boolean(p.variants?.length),
    },
    {
      key: "commercial",
      ok: hasAny(p.price, p.priceType, p.moq, p.priceTiers?.length, p.tradeTerms, p.incoterms, p.sampleAvailable),
    },
    {
      key: "documents",
      ok: Boolean(p.documents?.length),
    },
    {
      key: "certifications",
      ok: Boolean(p.certifications?.length || p.certificationRecords?.length),
    },
    {
      key: "logistics",
      ok: hasAny(
        p.logistics?.portOfLoading,
        p.logistics?.shippingMethods?.length,
        p.logistics?.productionLeadTime,
        p.logistics?.shippingLeadTime,
        p.logistics?.incoterms,
        p.logistics?.exportCapable,
        p.shipping?.method,
        p.shipping?.warehouseLocation,
        p.origin?.countryOfOrigin,
        p.origin?.manufacturingCountry,
        p.countryOfOrigin
      ),
    },
    {
      key: "packaging",
      ok: hasAny(p.packaging?.type, p.packaging?.unitsPerPackage, p.packaging?.dimensions, p.packaging?.weight),
    },
    {
      key: "seo",
      ok: Boolean(
        (p.seo?.title?.en || p.seo?.description?.en || p.slug?.en) &&
          (p.seo?.title?.ar || p.seo?.description?.ar || p.slug?.ar || p.name?.ar)
      ),
    },
    {
      key: "regional",
      ok: hasAny(
        p.hsCode,
        p.regional?.hsCode,
        p.regional?.saudiStandards?.length,
        p.regional?.gccStandards?.length,
        p.regional?.productRegistration
      ),
    },
  ];

  const ok = sections.filter((c) => c.ok).length;
  const score = Math.round((ok / sections.length) * 100);

  const seoChecks = [
    Boolean(p.seo?.title?.en || p.name?.en),
    Boolean(p.seo?.title?.ar || p.name?.ar),
    Boolean(p.seo?.description?.en || p.shortDescription?.en || p.description?.en),
    Boolean(p.seo?.description?.ar || p.shortDescription?.ar || p.description?.ar),
    Boolean(p.seo?.slug?.en || p.slug?.en),
    Boolean(p.seo?.keywords?.en || p.searchTags?.length || p.buyerIntentTags?.length),
  ];
  const seoScore = Math.round((seoChecks.filter(Boolean).length / seoChecks.length) * 100);

  return {
    score,
    missing: sections.filter((c) => !c.ok).map((c) => c.key),
    seoScore,
  };
}

type VendorLike = {
  legalName?: { en?: string; ar?: string } | null;
  description?: { en?: string; ar?: string } | null;
  logo?: string | null;
  certifications?: unknown[];
  categories?: unknown[];
  productTypeIds?: unknown[];
  location?: { city?: string; address?: string };
  companyType?: string;
  companyRoles?: unknown[];
  capabilities?: unknown[];
  capabilitiesProfile?: unknown;
  contactSettings?: unknown;
  yearEstablished?: number;
  legal?: unknown;
  crNumber?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  marketsServed?: unknown[];
  paymentTerms?: string;
  moq?: string;
  leadTime?: string;
  tradeName?: string;
};

/** Exactly 10 checklist items → rank X/10 and percent for admin review. */
export function vendorCompleteness(v: VendorLike) {
  const checks: { key: string; label: string; ok: boolean }[] = [
    { key: "name_en", label: "Legal name (EN)", ok: Boolean(v.legalName?.en) },
    { key: "name_ar", label: "Legal name (AR)", ok: Boolean(v.legalName?.ar) },
    { key: "description_en", label: "Company description", ok: Boolean(v.description?.en) },
    { key: "logo", label: "Company logo", ok: Boolean(v.logo) },
    { key: "location", label: "City / location", ok: Boolean(v.location?.city) },
    { key: "company_type", label: "Company type", ok: Boolean(v.companyType || v.companyRoles?.length) },
    { key: "cr_number", label: "CR number", ok: Boolean(v.crNumber) },
    {
      key: "contact",
      label: "Contact (phone / email)",
      ok: Boolean(v.phone || v.email || v.whatsapp),
    },
    {
      key: "registration_extra",
      label: "VAT / website / year",
      ok: Boolean(v.vatNumber || v.website || v.yearEstablished),
    },
    {
      key: "trade_profile",
      label: "Markets / terms / capabilities",
      ok: Boolean(
        v.marketsServed?.length ||
          v.paymentTerms ||
          v.moq ||
          v.leadTime ||
          v.capabilities?.length ||
          v.capabilitiesProfile ||
          v.certifications?.length ||
          v.categories?.length
      ),
    },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const total = checks.length;
  return {
    score: Math.round((filled / total) * 100),
    filled,
    total,
    rank: `${filled}/${total}`,
    checks,
    missing: checks.filter((c) => !c.ok).map((c) => c.key),
  };
}
