// src/modules/browse/browse.service.ts
// One browse model for every menu slug. The site has three taxonomies (static sectors in the menu,
// DB categories on products, SEO entities on /c) whose slugs disagree, so menu links 404'd.
// Any slug — sector group ("construction"), sector ("building-materials") or sub-item ("site-equipment") —
// resolves here, and products are found by DB category match plus name match.

import { Product } from "@/modules/products/product.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { MARKETPLACE_SECTOR_GROUPS, type MarketplaceSector, type MarketplaceSectorGroup } from "@/data/marketplace-sectors";
import { tolerantPatterns } from "@/modules/search/query-understanding";
import { resolveChildImageSrc, resolveSectorImageSrc } from "@/lib/sector-images";

/** Header menu slugs → sector group ids. */
const GROUP_ALIASES: Record<string, string> = {
  construction: "construction-building",
  industrial: "industrial-energy",
  "fmcg-food": "food-hospitality",
  hospitality: "food-hospitality",
  medical: "health-science",
  services: "business-logistics",
};

type Named = { en?: string; ar?: string };
export type BrowseLink = { slug: string; nameEn: string; nameAr: string; image?: string };

export type BrowseNode = {
  kind: "group" | "sector" | "child";
  slug: string;
  nameEn: string;
  nameAr: string;
  image?: string;
  /** Breadcrumb above this node (group, then sector). */
  trail: BrowseLink[];
  /** Next level down, shown as chips. */
  children: BrowseLink[];
  /** Same-level neighbours, for the empty state and the side rail. */
  siblings: BrowseLink[];
  /** Words used to match DB categories and product names. */
  keywords: string[];
};

const link = (x: { slug: string; nameEn: string; nameAr: string }): BrowseLink => ({ slug: x.slug, nameEn: x.nameEn, nameAr: x.nameAr });
const sectorLink = (s: MarketplaceSector): BrowseLink => ({ ...link(s), image: resolveSectorImageSrc(s) });
const childLink = (c: NonNullable<MarketplaceSector["children"]>[number], parent: MarketplaceSector): BrowseLink => ({
  ...link(c),
  image: resolveChildImageSrc(c.slug, c.legacyKeys, parent.slug),
});
const groupLink = (g: MarketplaceSectorGroup): BrowseLink => ({
  slug: g.id,
  nameEn: g.nameEn,
  nameAr: g.nameAr,
  image: g.sectors[0] ? resolveSectorImageSrc(g.sectors[0]) : undefined,
});

/** Slug and name words, minus noise, so "lighting" matches DB "lighting-fixtures". */
function wordsOf(...items: Array<{ slug: string; nameEn: string }>): string[] {
  const stop = new Set(["and", "services", "supplies", "equipment", "products", "general", "other", "others"]);
  const out = new Set<string>();
  for (const it of items) {
    for (const w of `${it.slug.replace(/-/g, " ")} ${it.nameEn}`.toLowerCase().split(/[^a-z]+/)) {
      if (w.length > 3 && !stop.has(w)) out.add(w.replace(/s$/, ""));
    }
  }
  return [...out];
}

export function resolveBrowseNode(rawSlug: string): BrowseNode | null {
  const slug = GROUP_ALIASES[rawSlug] || rawSlug;
  for (const g of MARKETPLACE_SECTOR_GROUPS) {
    if (g.id === slug) return groupNode(g);
    for (const s of g.sectors) {
      if (s.slug === slug) return sectorNode(g, s);
      const child = s.children?.find((c) => c.slug === slug);
      if (child) {
        return {
          kind: "child",
          ...childLink(child, s),
          trail: [groupLink(g), sectorLink(s)],
          children: [],
          siblings: (s.children || []).filter((c) => c.slug !== child.slug).map((c) => childLink(c, s)),
          keywords: wordsOf(child),
        };
      }
    }
  }
  return null;
}

function groupNode(g: MarketplaceSectorGroup): BrowseNode {
  return {
    kind: "group",
    slug: g.id,
    nameEn: g.nameEn,
    nameAr: g.nameAr,
    trail: [],
    image: groupLink(g).image,
    children: g.sectors.map(sectorLink),
    siblings: MARKETPLACE_SECTOR_GROUPS.filter((x) => x.id !== g.id).map(groupLink),
    keywords: wordsOf(...g.sectors),
  };
}

function sectorNode(g: MarketplaceSectorGroup, s: MarketplaceSector): BrowseNode {
  return {
    kind: "sector",
    ...sectorLink(s),
    trail: [groupLink(g)],
    children: (s.children || []).map((c) => childLink(c, s)),
    siblings: g.sectors.filter((x) => x.slug !== s.slug).map(sectorLink),
    keywords: wordsOf(s, ...(s.children || [])),
  };
}

export type BrowseFilters = { city?: string; verified?: boolean; sort?: "relevant" | "newest" | "price"; page?: number };

export type BrowseSupplier = {
  id: string;
  name: string;
  slug: string;
  city?: string;
  verified: boolean;
  logo?: string;
  productCount: number;
};

export type BrowseResult = {
  products: unknown[];
  total: number;
  page: number;
  pages: number;
  suppliers: BrowseSupplier[];
  /** Cities that have suppliers for this node, with product counts. */
  cities: Array<{ city: string; count: number }>;
};

const PAGE_SIZE = 24;
const LIVE = "published";

export async function loadBrowse(node: BrowseNode, f: BrowseFilters): Promise<BrowseResult> {
  const patterns = tolerantPatterns(node.keywords);
  const rx = patterns.length ? new RegExp(`(${patterns.join("|")})`, "i") : null;
  const empty: BrowseResult = { products: [], total: 0, page: 1, pages: 0, suppliers: [], cities: [] };
  if (!rx) return empty;

  const cats = await Category.find({ $or: [{ "slug.en": rx }, { "name.en": rx }, { catalogKey: rx }] }).select("_id").lean();
  const catIds = cats.map((c) => c._id);
  // Children are narrow, so also match product names; groups/sectors stay on category to avoid noise.
  const or: Record<string, unknown>[] = [{ categoryId: { $in: catIds } }];
  if (node.kind === "child") or.push({ "name.en": rx }, { tags: rx });
  const base = { status: LIVE, $or: or };

  // Facets are computed before the city/verified filters so the chips don't disappear when picked.
  const vendorCounts = (await Product.aggregate([
    { $match: base },
    { $group: { _id: "$vendorId", n: { $sum: 1 } } },
  ])) as Array<{ _id: unknown; n: number }>;
  const vendors = await Vendor.find({ _id: { $in: vendorCounts.map((v) => v._id) }, status: { $nin: ["rejected", "suspended", "expired"] } })
    .select("legalName tradeName slug location verificationStatus logo")
    .lean<Array<{ _id: unknown; legalName?: Named; tradeName?: string; slug?: Named; location?: { city?: string }; verificationStatus?: string; logo?: string }>>();
  const countOf = new Map(vendorCounts.map((v) => [String(v._id), v.n]));

  const suppliers: BrowseSupplier[] = vendors
    .map((v) => ({
      id: String(v._id),
      name: v.tradeName || v.legalName?.en || v.legalName?.ar || "",
      slug: v.slug?.en || String(v._id),
      city: v.location?.city,
      verified: v.verificationStatus === "verified",
      logo: v.logo,
      productCount: countOf.get(String(v._id)) || 0,
    }))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.productCount - a.productCount);

  const cityMap = new Map<string, number>();
  for (const s of suppliers) if (s.city) cityMap.set(s.city, (cityMap.get(s.city) || 0) + s.productCount);
  const cities = [...cityMap].map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);

  const allowed = suppliers.filter(
    (s) => (!f.city || s.city?.toLowerCase() === f.city.toLowerCase()) && (!f.verified || s.verified)
  );
  const query = { ...base, vendorId: { $in: allowed.map((s) => s.id) } };
  const page = Math.max(1, f.page || 1);
  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(f.sort === "newest" ? { createdAt: -1 } : f.sort === "price" ? { price: 1 } : { featured: -1, updatedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate({ path: "vendorId", select: "legalName tradeName slug location verificationStatus logo" })
      .lean(),
    Product.countDocuments(query),
  ]);

  return { products, total, page, pages: Math.ceil(total / PAGE_SIZE), suppliers, cities };
}
