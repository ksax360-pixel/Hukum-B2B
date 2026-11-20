// src/modules/search/smart-search.ts
// Ranked, forgiving product search (Elasticsearch-like) over Mongo.
// Matches product name, SKU, brand, tags, category, and business/vendor name with typo tolerance.

import type { FilterQuery } from "mongoose";
import { Product } from "@/modules/products/product.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import {
  buildProductBaseQuery,
  expandCategoryFilterIds,
  findVendorIdsForFilters,
  type CatalogSearchParams,
} from "@/modules/products/catalog-search";
import { mediaList } from "@/components/products/product-helpers";
import { editDistance, tolerantPatterns, understandQuery, type UnderstoodQuery } from "./query-understanding";

const CANDIDATE_CAP = 500;

type Named = { en?: string; ar?: string };
type ProductDoc = {
  _id: unknown;
  name?: Named;
  slug?: Named;
  brand?: string;
  sku?: string;
  tags?: string[];
  searchTags?: string[];
  featured?: boolean;
  updatedAt?: Date | string;
  categoryId?: { _id?: unknown; name?: Named } | unknown;
  vendorId?: {
    verificationStatus?: string;
    tradeName?: string;
    legalName?: Named;
    location?: { city?: string };
  } | unknown;
  media?: unknown[];
};

const rxOf = (patterns: string[]): RegExp | null => (patterns.length ? new RegExp(`(${patterns.join("|")})`, "i") : null);

async function matchCategories(words: string[]): Promise<Array<{ _id: unknown; name?: Named; slug?: Named }>> {
  const rx = rxOf(tolerantPatterns(words));
  if (!rx) return [];
  return Category.find({ status: "active", $or: [{ "name.en": rx }, { "name.ar": rx }, { "slug.en": rx }] })
    .select("name slug")
    .limit(12)
    .lean() as Promise<Array<{ _id: unknown; name?: Named; slug?: Named }>>;
}

async function matchVendorIds(words: string[], phrase: string): Promise<string[]> {
  const patterns = tolerantPatterns([...words, phrase].filter(Boolean));
  const rx = rxOf(patterns);
  if (!rx) return [];
  const vendors = await Vendor.find({
    status: { $nin: ["rejected", "suspended", "expired"] },
    $or: [{ "legalName.en": rx }, { "legalName.ar": rx }, { tradeName: rx }, { email: rx }],
  })
    .select("_id")
    .limit(40)
    .lean();
  return vendors.map((v) => String(v._id));
}

function scoreProduct(p: ProductDoc, u: UnderstoodQuery, catIds: Set<string>, vendorHitIds: Set<string>): number {
  const name = `${p.name?.en || ""} ${p.name?.ar || ""}`.toLowerCase();
  const brand = String(p.brand || "").toLowerCase();
  const sku = String(p.sku || "").toLowerCase();
  const tags = [...(p.tags || []), ...(p.searchTags || [])].join(" ").toLowerCase();
  const v = p.vendorId as { tradeName?: string; legalName?: Named; verificationStatus?: string } | undefined;
  const vendorName = `${v?.tradeName || ""} ${v?.legalName?.en || ""} ${v?.legalName?.ar || ""}`.toLowerCase();
  const hay = `${name} ${brand} ${sku} ${tags} ${vendorName}`;
  const raw = u.raw.toLowerCase();

  let score = 0;
  if (raw && name.includes(raw)) score += 20;
  if (raw && brand.includes(raw)) score += 12;
  if (raw && vendorName.includes(raw)) score += 14;

  for (const term of u.terms) {
    const t = term.toLowerCase();
    if (!t) continue;
    if (name.includes(t)) score += 10;
    else if (rxOf(tolerantPatterns([t]))?.test(name)) score += 7;
    else {
      // Fuzzy against individual name tokens
      for (const token of name.split(/[\s/-]+/).filter((x) => x.length > 3)) {
        const d = editDistance(t, token);
        if (d <= 1 && t.length >= 4) score += 6;
        else if (d <= 2 && t.length >= 6) score += 4;
      }
    }
    if (brand.includes(t)) score += 5;
    if (sku.includes(t)) score += 6;
    if (tags.includes(t)) score += 2;
    if (vendorName.includes(t)) score += 8;
  }

  for (const syn of u.expanded) {
    if (!u.terms.includes(syn) && name.includes(syn.toLowerCase())) score += 3;
  }

  const cat = p.categoryId as { _id?: unknown } | undefined;
  if (cat?._id && catIds.has(String(cat._id))) score += 4;
  if (vendorHitIds.has(String((p.vendorId as { _id?: unknown } | undefined)?._id || p.vendorId))) score += 6;
  if (p.featured) score += 1;
  if (v?.verificationStatus === "verified") score += 1;
  return score;
}

export type SmartSearchResult = {
  items: unknown[];
  total: number;
  page: number;
  limit: number;
  understood: UnderstoodQuery;
  categories: Array<{ _id: string; name?: Named; slug?: Named }>;
};

/** Product search for the results page. Free text is understood; quantity/city become filters/chips. */
export async function smartSearchProducts(sp: CatalogSearchParams): Promise<SmartSearchResult> {
  const page = Math.max(1, Number(sp.page || 1) || 1);
  const limit = Math.min(48, Math.max(1, Number(sp.limit || 12) || 12));
  const understood = understandQuery(sp.q || "");
  const query: FilterQuery<typeof Product> = buildProductBaseQuery(sp);

  const categoryIds = await expandCategoryFilterIds(sp.categoryId);
  if (categoryIds) {
    query.categoryId = categoryIds.length === 1 ? categoryIds[0] : { $in: categoryIds };
  }

  const vendorIds = await findVendorIdsForFilters({
    city: sp.city || sp.location || understood.city,
    seller: sp.seller || sp.vendor,
  });
  if (vendorIds) {
    if (!vendorIds.length) return { items: [], total: 0, page, limit, understood, categories: [] };
    query.vendorId = { $in: vendorIds };
  }

  const populate = [
    { path: "vendorId", select: "legalName tradeName verificationStatus location logo slug citiesServed" },
    { path: "categoryId", select: "name slug" },
    { path: "industryId", select: "name" },
  ];

  if (!understood.expanded.length) {
    const [items, total] = await Promise.all([
      Product.find(query)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(populate)
        .lean(),
      Product.countDocuments(query),
    ]);
    return { items, total, page, limit, understood, categories: [] };
  }

  const [cats, vendorHits] = await Promise.all([
    matchCategories(understood.expanded),
    matchVendorIds(understood.terms, understood.raw),
  ]);
  const catIds = new Set(cats.map((c) => String(c._id)));
  const vendorHitIds = new Set(vendorHits);
  const rx = rxOf(tolerantPatterns(understood.expanded));

  const textOr: FilterQuery<typeof Product>[] = [
    { "name.en": rx },
    { "name.ar": rx },
    { brand: rx },
    { sku: rx },
    { tags: rx },
    { searchTags: rx },
    { "description.en": rx },
    { "description.ar": rx },
    { "shortDescription.en": rx },
    { "shortDescription.ar": rx },
  ];
  if (catIds.size) textOr.push({ categoryId: { $in: [...catIds] } });
  if (vendorHitIds.size) textOr.push({ vendorId: { $in: [...vendorHitIds] } });

  const candidates = (await Product.find({ ...query, $or: textOr })
    .limit(CANDIDATE_CAP)
    .populate(populate)
    .lean()) as ProductDoc[];

  const ranked = candidates
    .map((p) => ({ p, s: scoreProduct(p, understood, catIds, vendorHitIds) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || +new Date(b.p.updatedAt || 0) - +new Date(a.p.updatedAt || 0));

  return {
    items: ranked.slice((page - 1) * limit, page * limit).map((r) => r.p),
    total: ranked.length,
    page,
    limit,
    understood,
    categories: cats.map((c) => ({ _id: String(c._id), name: c.name, slug: c.slug })),
  };
}

export type Suggestions = {
  understood: UnderstoodQuery;
  products: Array<{ name: string; slug: string; image?: string; vendor?: string; city?: string }>;
  categories: Array<{ id: string; name: string }>;
  suppliers: Array<{ name: string; slug: string; city?: string; verified: boolean }>;
};

/** The three groups shown under the search box while typing. */
export async function suggest(q: string, locale: "en" | "ar"): Promise<Suggestions> {
  const understood = understandQuery(q);
  const empty: Suggestions = { understood, products: [], categories: [], suppliers: [] };
  if (!understood.expanded.length) return empty;

  const pick = (n?: Named): string => (locale === "ar" ? n?.ar || n?.en : n?.en || n?.ar) || "";
  const vendorRx = rxOf(tolerantPatterns([...understood.expanded, understood.raw.toLowerCase()]));
  const [found, cats, vendors] = await Promise.all([
    smartSearchProducts({ q, limit: 6 }),
    matchCategories(understood.expanded),
    Vendor.find({
      status: { $nin: ["rejected", "suspended", "expired"] },
      $or: [{ "legalName.en": vendorRx }, { "legalName.ar": vendorRx }, { tradeName: vendorRx }],
    })
      .select("legalName tradeName slug location verificationStatus")
      .limit(5)
      .lean(),
  ]);

  return {
    understood,
    products: (found.items as ProductDoc[]).map((p) => {
      const v = p.vendorId as { tradeName?: string; legalName?: Named; location?: { city?: string } } | undefined;
      return {
        name: pick(p.name),
        slug: p.slug?.en || String(p._id),
        image: mediaList(p as Parameters<typeof mediaList>[0])[0]?.url,
        vendor: v?.tradeName || pick(v?.legalName),
        city: v?.location?.city,
      };
    }),
    categories: cats.slice(0, 4).map((c) => ({ id: String(c._id), name: pick(c.name) })),
    suppliers: (
      vendors as Array<{
        _id: unknown;
        legalName?: Named;
        tradeName?: string;
        slug?: Named;
        location?: { city?: string };
        verificationStatus?: string;
      }>
    ).map((v) => ({
      name: v.tradeName || pick(v.legalName),
      slug: v.slug?.en || String(v._id),
      city: v.location?.city,
      verified: v.verificationStatus === "verified",
    })),
  };
}
