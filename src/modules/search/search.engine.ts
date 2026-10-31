import { expandSearchQuery, resolveSynonymCategoryKeys } from "@/data/controlled-vocabularies";
import { matchCatalogFromText } from "@/modules/seo/catalog-resolve";
import { parseSearchQuery } from "@/modules/seo/intent";

export type SearchFilters = {
  q?: string;
  industryId?: string;
  categoryId?: string;
  vendorId?: string;
  city?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  moqMax?: number;
  verified?: boolean;
  availability?: string;
  country?: string;
  buyerIntent?: string | string[];
  attributes?: Record<string, string | string[]>;
  page?: number;
  limit?: number;
  locale?: string;
};

export type SearchResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  entity?: {
    key: string;
    slug: string;
    name?: { en?: string; ar?: string };
    intent?: string;
    path?: string;
  } | null;
  queryMeta?: {
    language: string;
    intent: string;
    locationHint?: string;
  };
};

export interface SearchEngine {
  searchProducts(filters: SearchFilters): Promise<SearchResult<unknown>>;
  searchVendors(filters: SearchFilters): Promise<SearchResult<unknown>>;
}

/** MongoDB implementation — swap for OpenSearch/Elasticsearch later without changing callers. */
export class MongoSearchEngine implements SearchEngine {
  async searchProducts(filters: SearchFilters) {
    const { Product } = await import("@/modules/products/product.model");
    const { Category } = await import("@/modules/categories/taxonomy.model");
    const { MarketplaceEntity } = await import("@/modules/seo/entity.model");
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const query: Record<string, unknown> = { status: "published" };
    const locale = filters.locale === "en" ? "en" : "ar";

    let entityMeta: SearchResult<unknown>["entity"] = null;
    let queryMeta: SearchResult<unknown>["queryMeta"];

    if (filters.q) {
      const expanded = expandSearchQuery(filters.q);
      const synonymKeys = resolveSynonymCategoryKeys(filters.q);
      const hit = matchCatalogFromText(filters.q);
      const parsed = parseSearchQuery(filters.q, synonymKeys);
      queryMeta = { language: parsed.language, intent: parsed.intent, locationHint: parsed.locationHint };

      if (hit) {
        const me = await MarketplaceEntity.findOne({
          $or: [{ key: hit.child?.key || hit.category.key }, { catalogKey: hit.category.key }, { slug: hit.category.slug.en }],
        })
          .select("key slug name intent")
          .lean();
        if (me) {
          entityMeta = {
            key: me.key,
            slug: me.slug,
            name: me.name as { en?: string; ar?: string },
            intent: parsed.intent || me.intent,
            path: `/${locale}/c/${me.slug}`,
          };
        }
      }

      const escaped = filters.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const or: Record<string, unknown>[] = [{ $text: { $search: filters.q } }];
      if (expanded.length > 1) {
        or.push({ searchTags: { $in: expanded } });
        or.push({ buyerIntentTags: { $in: expanded.map((t) => t.toLowerCase().replace(/\s+/g, "_")) } });
        or.push({ applicationTags: { $in: expanded } });
        or.push({ "name.ar": { $regex: escaped, $options: "i" } });
        or.push({ "name.en": { $regex: escaped, $options: "i" } });
      }
      if (synonymKeys.length || hit) {
        const keys = [...new Set([...(synonymKeys || []), hit?.category.key, hit?.child?.key].filter(Boolean))] as string[];
        const cats = await Category.find({
          $or: [{ catalogKey: { $in: keys } }, { icon: { $in: keys } }],
        })
          .select("_id")
          .lean();
        if (cats.length) {
          or.push({ categoryId: { $in: cats.map((c) => c._id) } });
          or.push({ categoryPath: { $in: cats.map((c) => c._id) } });
        }
        const entities = await MarketplaceEntity.find({ key: { $in: keys } }).select("_id").lean();
        if (entities.length) {
          or.push({ marketplaceEntityIds: { $in: entities.map((e) => e._id) } });
        }
      }
      query.$or = or;
    }
    if (filters.industryId) query.industryId = filters.industryId;
    if (filters.categoryId) {
      query.$and = [
        ...(Array.isArray(query.$and) ? (query.$and as object[]) : []),
        {
          $or: [{ categoryId: filters.categoryId }, { categoryPath: filters.categoryId }, { productTypeId: filters.categoryId }],
        },
      ];
    }
    if (filters.vendorId) query.vendorId = filters.vendorId;
    if (filters.brand) query.brand = new RegExp(filters.brand, "i");
    if (filters.verified) query.verificationStatus = "verified";
    if (filters.availability) query.availability = filters.availability;
    if (filters.country) {
      query.$or = [
        ...(Array.isArray(query.$or) ? (query.$or as object[]) : []),
        { countryOfOrigin: new RegExp(filters.country, "i") },
        { "origin.countryOfOrigin": new RegExp(filters.country, "i") },
      ];
    }
    if (filters.buyerIntent) {
      const tags = Array.isArray(filters.buyerIntent) ? filters.buyerIntent : [filters.buyerIntent];
      query.buyerIntentTags = { $in: tags };
    }
    if (filters.minPrice != null || filters.maxPrice != null) {
      query.price = {
        ...(filters.minPrice != null ? { $gte: filters.minPrice } : {}),
        ...(filters.maxPrice != null ? { $lte: filters.maxPrice } : {}),
      };
    }
    if (filters.moqMax != null) query.moq = { $lte: filters.moqMax };
    if (filters.attributes) {
      for (const [key, value] of Object.entries(filters.attributes)) {
        query[`attributes.${key}`] = Array.isArray(value) ? { $in: value } : value;
      }
    }

    const [items, total] = await Promise.all([
      Product.find(query)
        .sort(filters.q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("vendorId", "legalName slug verificationStatus logo companyType")
        .lean(),
      Product.countDocuments(query),
    ]);

    return { items, total, page, limit, entity: entityMeta, queryMeta };
  }

  async searchVendors(filters: SearchFilters) {
    const { Vendor } = await import("@/modules/vendors/vendor.model");
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const query: Record<string, unknown> = {
      status: { $in: ["verified", "under_review"] },
    };
    if (filters.q) query.$text = { $search: filters.q };
    if (filters.city) query["location.city"] = new RegExp(filters.city, "i");
    if (filters.verified) query.verificationStatus = "verified";
    if (filters.industryId) query.industries = filters.industryId;
    if (filters.categoryId) query.categories = filters.categoryId;

    const [items, total] = await Promise.all([
      Vendor.find(query)
        .sort(filters.q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(query),
    ]);

    return { items, total, page, limit };
  }
}

export const searchEngine: SearchEngine = new MongoSearchEngine();
