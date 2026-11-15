// src/modules/vendors/directory.service.ts
// Supplier directory query: one place for the type / city / verified / origin filters the header menu links to.

import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { mediaList } from "@/components/products/product-helpers";
import { tolerantPatterns, understandQuery } from "@/modules/search/query-understanding";

type Named = { en?: string; ar?: string };

/** Menu/URL type → stored companyType values. */
export const SUPPLIER_TYPES: Record<string, { en: string; ar: string; values: string[] }> = {
  manufacturer: { en: "Manufacturers", ar: "المصنّعون", values: ["manufacturer", "oem", "odm"] },
  distributor: { en: "Distributors", ar: "الموزّعون", values: ["distributor", "importer", "brand_owner"] },
  wholesaler: { en: "Wholesalers & traders", ar: "تجار الجملة", values: ["wholesaler", "trading_company", "retailer", "exporter"] },
  service: { en: "Service providers", ar: "مزوّدو الخدمات", values: ["service_provider", "contractor"] },
};

export type DirectoryFilters = { q?: string; type?: string; city?: string; verified?: boolean; saudi?: boolean; page?: number };

export type DirectorySupplier = {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  logo?: string;
  city?: string;
  verified: boolean;
  type: string;
  since?: number;
  productCount: number;
  categories: Named[];
  certifications: string[];
  products: Array<{ name: Named; slug: string; image?: string }>;
};

export type DirectoryResult = {
  suppliers: DirectorySupplier[];
  total: number;
  page: number;
  pages: number;
  typeCounts: Record<string, number>;
  cities: Array<{ city: string; count: number }>;
};

const PAGE_SIZE = 12;
const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function loadDirectory(f: DirectoryFilters): Promise<DirectoryResult> {
  const base: Record<string, unknown> = {
    verificationStatus: { $in: ["verified", "pending"] },
    status: { $nin: ["suspended", "rejected", "expired"] },
  };
  if (f.saudi) base["location.country"] = { $in: ["SA", "Saudi Arabia", "KSA"] };

  // Free text: supplier name, city, or what they sell (product names, typo/Arabic tolerant).
  if (f.q?.trim()) {
    const u = understandQuery(f.q);
    const words = u.expanded.length ? u.expanded : [f.q.trim()];
    const rx = new RegExp(`(${tolerantPatterns(words).join("|") || escape(f.q.trim())})`, "i");
    const sellerIds = await Product.distinct("vendorId", { status: "published", $or: [{ "name.en": rx }, { "name.ar": rx }, { tags: rx }] });
    base.$or = [{ tradeName: rx }, { "legalName.en": rx }, { "legalName.ar": rx }, { _id: { $in: sellerIds } }];
    if (u.city && !f.city) f = { ...f, city: u.city };
  }

  // Facets ignore the type/city/verified filters so chips stay visible after picking one.
  const facetRows = await Vendor.find(base).select("companyType location.city").lean<Array<{ companyType?: string; location?: { city?: string } }>>();
  const typeCounts: Record<string, number> = { all: facetRows.length };
  for (const [key, t] of Object.entries(SUPPLIER_TYPES)) typeCounts[key] = facetRows.filter((r) => t.values.includes(r.companyType || "")).length;
  const cityMap = new Map<string, number>();
  for (const r of facetRows) if (r.location?.city) cityMap.set(r.location.city, (cityMap.get(r.location.city) || 0) + 1);
  const cities = [...cityMap].map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);

  const query: Record<string, unknown> = { ...base };
  if (f.type && SUPPLIER_TYPES[f.type]) query.companyType = { $in: SUPPLIER_TYPES[f.type].values };
  if (f.city) query["location.city"] = new RegExp(`^${escape(f.city)}$`, "i");
  if (f.verified) query.verificationStatus = "verified";

  const page = Math.max(1, f.page || 1);
  const [rows, total] = await Promise.all([
    Vendor.find(query)
      .sort({ verificationStatus: -1, featured: -1, completenessScore: -1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select("legalName tradeName slug logo location verificationStatus companyType yearEstablished categories certifications")
      .lean<Array<{
        _id: unknown; legalName?: Named; tradeName?: string; slug?: Named; logo?: string; location?: { city?: string };
        verificationStatus?: string; companyType?: string; yearEstablished?: number; categories?: unknown[]; certifications?: string[];
      }>>(),
    Vendor.countDocuments(query),
  ]);

  const ids = rows.map((r) => r._id);
  const [counts, samples, cats] = await Promise.all([
    Product.aggregate([{ $match: { vendorId: { $in: ids }, status: "published" } }, { $group: { _id: "$vendorId", n: { $sum: 1 } } }]),
    // Top 3 per supplier (a shared limit let the largest catalogue crowd the others out).
    Product.aggregate([
      { $match: { vendorId: { $in: ids }, status: "published" } },
      { $sort: { featured: -1, updatedAt: -1 } },
      { $group: { _id: "$vendorId", items: { $push: { _id: "$_id", vendorId: "$vendorId", name: "$name", slug: "$slug", media: "$media", images: "$images" } } } },
      { $project: { items: { $slice: ["$items", 3] } } },
    ]).then((groups: Array<{ items: unknown[] }>) => groups.flatMap((g) => g.items)),
    Category.find({ _id: { $in: rows.flatMap((r) => r.categories || []) } }).select("name").lean<Array<{ _id: unknown; name?: Named }>>(),
  ]);
  const countOf = new Map((counts as Array<{ _id: unknown; n: number }>).map((c) => [String(c._id), c.n]));
  const catOf = new Map(cats.map((c) => [String(c._id), c.name || {}]));

  const suppliers: DirectorySupplier[] = rows.map((r) => {
    const id = String(r._id);
    const mine = (samples as Array<{ vendorId?: unknown; name?: Named; slug?: Named; _id: unknown }>).filter((p) => String(p.vendorId) === id);
    return {
      id,
      slug: r.slug?.en || id,
      name: r.tradeName || r.legalName?.en || r.legalName?.ar || "",
      nameAr: r.legalName?.ar,
      logo: r.logo,
      city: r.location?.city,
      verified: r.verificationStatus === "verified",
      type: r.companyType || "trading_company",
      since: r.yearEstablished,
      productCount: countOf.get(id) || 0,
      categories: (r.categories || []).map((c) => catOf.get(String(c))).filter(Boolean).slice(0, 3) as Named[],
      certifications: (r.certifications || []).slice(0, 3),
      products: mine.slice(0, 3).map((p) => ({
        name: p.name || {},
        slug: p.slug?.en || String(p._id),
        image: mediaList(p as Parameters<typeof mediaList>[0])[0]?.url,
      })),
    };
  });

  return { suppliers, total, page, pages: Math.ceil(total / PAGE_SIZE), typeCounts, cities };
}
