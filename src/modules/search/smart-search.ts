// src/modules/search/smart-search.ts
// Ranked, forgiving product search and the suggestion list behind the search box.
// Replaces Mongo $text for typed queries: $text has no prefix/typo matching and ranked
// description words above product names ("cement" returned a consulting service).

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
import { tolerantPatterns, understandQuery, type UnderstoodQuery } from "./query-understanding";

/** ponytail: ranks in memory over this many candidates; move to Atlas Search when the catalogue passes ~5k products. */
const CANDIDATE_CAP = 300;

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
  categoryId?: { _id?: unknown; name?: Named } | unknown;
  vendorId?: { verificationStatus?: string; tradeName?: string; legalName?: Named; location?: { city?: string } } | unknown;
  media?: unknown[];
};

const rxOf = (patterns: string[]): RegExp | null => (patterns.length ? new RegExp(`(${patterns.join("|")})`, "i") : null);

/** Categories whose names (EN/AR) match the query, so "PPE" or «سلامة» can pull in the whole category. */
async function matchCategories(words: string[]): Promise<Array<{ _id: unknown; name?: Named; slug?: Named }>> {
  const rx = rxOf(tolerantPatterns(words));
  if (!rx) return [];
  return Category.find({ status: "active", $or: [{ "name.en": rx }, { "name.ar": rx }, { "slug.en": rx }] })
    .select("name slug")
    .limit(12)
    .lean() as Promise<Array<{ _id: unknown; name?: Named; slug?: Named }>>;
}

function scoreProduct(p: ProductDoc, u: UnderstoodQuery, catIds: Set<string>): number {
  const name = `${p.name?.en || ""} ${p.name?.ar || ""}`.toLowerCase();
  const brand = String(p.brand || "").toLowerCase();
  const tags = [...(p.tags || []), ...(p.searchTags || [])].join(" ").toLowerCase();
  let score = 0;
  for (const term of u.terms) {
    const t = term.toLowerCase();
    if (new RegExp(`(^|\\s)${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(name)) score += 10;
    else if (name.includes(t)) score += 7;
    else if (rxOf(tolerantPatterns([t]))?.test(name)) score += 4;
    if (brand.includes(t)) score += 4;
    if (tags.includes(t)) score += 2;
  }
  // Synonym-only hits count, but less than the buyer's own words.
  for (const syn of u.expanded) if (!u.terms.includes(syn) && name.includes(syn.toLowerCase())) score += 3;
  const cat = p.categoryId as { _id?: unknown } | undefined;
  if (cat?._id && catIds.has(String(cat._id))) score += 4;
  if (p.featured) score += 1;
  if ((p.vendorId as { verificationStatus?: string } | undefined)?.verificationStatus === "verified") score += 1;
  return score;
}

export type SmartSearchResult = {
  items: unknown[];
  total: number;
  page: number;
  limit: number;
  understood: UnderstoodQuery;
  /** Categories the query names, offered as one-tap narrowing chips. */
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

  const cats = await matchCategories(understood.expanded);
  const catIds = new Set(cats.map((c) => String(c._id)));
  const rx = rxOf(tolerantPatterns(understood.expanded));
  const textOr: FilterQuery<typeof Product>[] = [
    { "name.en": rx },
    { "name.ar": rx },
    { brand: rx },
    { sku: rx },
    { tags: rx },
    { searchTags: rx },
  ];
  if (catIds.size) textOr.push({ categoryId: { $in: [...catIds] } });

  const candidates = (await Product.find({ ...query, $or: textOr })
    .limit(CANDIDATE_CAP)
    .populate(populate)
    .lean()) as ProductDoc[];

  const ranked = candidates
    .map((p) => ({ p, s: scoreProduct(p, understood, catIds) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);

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
  const rx = rxOf(tolerantPatterns(understood.expanded));
  // Supplier names often contain a city ("Riyadh Safety Supplies"), so also match the phrase as typed.
  const vendorRx = rxOf(tolerantPatterns([...understood.expanded, understood.raw.toLowerCase()]));
  const [found, cats, vendors] = await Promise.all([
    smartSearchProducts({ q, limit: 5 }),
    matchCategories(understood.expanded),
    Vendor.find({
      status: { $nin: ["rejected", "suspended", "expired"] },
      $or: [{ "legalName.en": vendorRx }, { "legalName.ar": vendorRx }, { tradeName: vendorRx }],
    })
      .select("legalName tradeName slug location verificationStatus")
      .limit(3)
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
    suppliers: (vendors as Array<{ _id: unknown; legalName?: Named; tradeName?: string; slug?: Named; location?: { city?: string }; verificationStatus?: string }>).map((v) => ({
      name: v.tradeName || pick(v.legalName),
      slug: v.slug?.en || String(v._id),
      city: v.location?.city,
      verified: v.verificationStatus === "verified",
    })),
  };
}
