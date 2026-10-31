import type { FilterQuery, SortOrder } from "mongoose";
import { Product } from "@/modules/products/product.model";
import { Vendor } from "@/modules/vendors/vendor.model";

export type CatalogSearchParams = {
  q?: string;
  city?: string;
  location?: string;
  seller?: string;
  vendor?: string;
  industryId?: string;
  categoryId?: string;
  priceType?: string;
  availability?: string;
  condition?: string;
  unit?: string;
  currency?: string;
  origin?: string;
  verified?: string;
  featured?: string;
  negotiable?: string;
  requestQuote?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve vendor IDs matching city/region and/or seller name. */
export async function findVendorIdsForFilters(opts: {
  city?: string;
  location?: string;
  seller?: string;
}): Promise<string[] | null> {
  const city = String(opts.city || opts.location || "").trim();
  const seller = String(opts.seller || "").trim();
  if (!city && !seller) return null;

  const and: FilterQuery<typeof Vendor>[] = [];
  if (city) {
    const rx = new RegExp(escapeRegex(city), "i");
    and.push({
      $or: [
        { "location.city": rx },
        { "location.region": rx },
        { "location.country": rx },
        { citiesServed: rx },
      ],
    });
  }
  if (seller) {
    const rx = new RegExp(escapeRegex(seller), "i");
    and.push({
      $or: [{ "legalName.en": rx }, { "legalName.ar": rx }, { tradeName: rx }, { email: rx }],
    });
  }

  const vendors = await Vendor.find(and.length === 1 ? and[0] : { $and: and })
    .select("_id")
    .lean();
  return vendors.map((v) => String(v._id));
}

export function buildProductBaseQuery(sp: CatalogSearchParams): FilterQuery<typeof Product> {
  const query: FilterQuery<typeof Product> = { status: "published" };
  if (sp.industryId) query.industryId = sp.industryId;
  if (sp.categoryId) query.categoryId = sp.categoryId;
  if (sp.priceType) query.priceType = sp.priceType;
  if (sp.availability) query.availability = sp.availability;
  if (sp.condition) query.condition = sp.condition;
  if (sp.unit) query.unit = sp.unit;
  if (sp.currency) query.currency = sp.currency;
  if (sp.origin) query.countryOfOrigin = sp.origin;
  if (sp.verified === "true") query.verificationStatus = "verified";
  if (sp.featured === "true") query.featured = true;
  if (sp.negotiable === "true") query.negotiable = true;
  if (sp.requestQuote === "true") query.requestQuote = true;
  return query;
}

export function buildProductSort(sp: CatalogSearchParams): Record<string, SortOrder> {
  if (sp.sort === "price_asc") return { price: 1 };
  if (sp.sort === "price_desc") return { price: -1 };
  if (sp.sort === "featured") return { featured: -1, createdAt: -1 };
  return { featured: -1, createdAt: -1 };
}

export async function searchCatalogProducts(sp: CatalogSearchParams) {
  const page = Math.max(1, Number(sp.page || 1) || 1);
  const limit = Math.min(48, Math.max(1, Number(sp.limit || 12) || 12));
  const query = buildProductBaseQuery(sp);

  const vendorIds = await findVendorIdsForFilters({
    city: sp.city,
    location: sp.location,
    seller: sp.seller || sp.vendor,
  });
  if (vendorIds) {
    if (!vendorIds.length) {
      return { items: [] as unknown[], total: 0, page, limit, vendorIds: [] as string[] };
    }
    query.vendorId = { $in: vendorIds };
  }

  const sort = buildProductSort(sp);
  const q = String(sp.q || "").trim();

  const populate = [
    { path: "vendorId", select: "legalName tradeName verificationStatus location logo slug citiesServed" },
    { path: "categoryId", select: "name" },
    { path: "industryId", select: "name" },
  ] as const;

  if (q) {
    try {
      const textQuery = { ...query, $text: { $search: q } };
      const [items, total] = await Promise.all([
        Product.find(textQuery)
          .sort({ score: { $meta: "textScore" }, featured: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate(populate as unknown as string)
          .lean(),
        Product.countDocuments(textQuery),
      ]);
      return { items, total, page, limit, vendorIds };
    } catch {
      const rx = new RegExp(escapeRegex(q), "i");
      const regexQuery = {
        ...query,
        $or: [
          { brand: rx },
          { "name.en": rx },
          { "name.ar": rx },
          { "title.en": rx },
          { "title.ar": rx },
          { "description.en": rx },
          { sku: rx },
          { searchTags: rx },
          { tags: rx },
        ],
      };
      const [items, total] = await Promise.all([
        Product.find(regexQuery)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate(populate as unknown as string)
          .lean(),
        Product.countDocuments(regexQuery),
      ]);
      return { items, total, page, limit, vendorIds };
    }
  }

  const [items, total] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(populate as unknown as string)
      .lean(),
    Product.countDocuments(query),
  ]);
  return { items, total, page, limit, vendorIds };
}

export async function fetchFeaturedProducts(limit = 12) {
  return Product.find({ status: "published", featured: true })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("vendorId", "legalName tradeName verificationStatus location logo slug")
    .lean();
}
