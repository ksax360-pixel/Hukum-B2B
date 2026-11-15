import { Types } from "mongoose";
import { Product } from "@/modules/products/product.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Category } from "@/modules/categories/taxonomy.model";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";
import { slugifyText } from "@/lib/utils";
import { generateFromEntity, localePath } from "./engine";
import {
  AeoRecord,
  EntityRelationship,
  MarketplaceEntity,
  ProductEntity,
} from "./entity.model";
import { findCatalogByKey, findCatalogBySlug, matchCatalogFromText, entitySynonymsForHit, type CatalogHit } from "./catalog-resolve";
import { buildMarketplaceAeo, buildProductAeo } from "./aeo";
import { buildMarketplaceGeo, buildProductGeo } from "./geo";
import { entityDiscoveryScores, entityQualityGate, productSeoAeoScores } from "./scoring";

const LOCATION_THRESHOLD = 3;
let seeded = false;

function locVal(v?: { en?: string; ar?: string } | string | null) {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.en || v.ar || "";
}

async function upsertRel(fromType: string, fromId: string, rel: string, toType: string, toId: string) {
  await EntityRelationship.updateOne(
    { fromType, fromId, rel, toType, toId },
    {
      $setOnInsert: {
        fromType,
        fromId,
        rel,
        toType,
        toId,
        provenance: { sourceType: "pipeline", sourceId: fromId, sourceField: rel, confidence: 0.9, lastVerifiedAt: new Date(), verifiedBy: "system" },
      },
    },
    { upsert: true }
  );
}

export async function seedMarketplaceEntities() {
  if (seeded) return;
  try {
    for (const cat of MARKETPLACE_CATEGORIES) {
    await upsertCatalogEntity(cat.key, {
      kind: "category",
      slug: cat.slug.en,
      name: cat.name,
      intro: cat.description,
      intent: "commercial_investigation",
      catalogKey: cat.key,
      industryKey: cat.industry.en,
      relatedKeys: (cat.children || []).map((c) => c.key),
    });
    await upsertCatalogEntity(`${cat.key}:suppliers`, {
      kind: "supplier",
      slug: `${cat.slug.en}-suppliers`,
      name: { en: `${cat.name.en} Suppliers`, ar: `موردو ${cat.name.ar}` },
      intro: {
        en: `Verified ${cat.name.en} suppliers and distributors on Hukum.`,
        ar: `موردو وموزّعو ${cat.name.ar} الموثّقون على Hukum.`,
      },
      intent: "supplier_discovery",
      catalogKey: cat.key,
      parentKey: cat.key,
    });
    for (const child of cat.children || []) {
      await upsertCatalogEntity(child.key, {
        kind: "product_type",
        slug: child.slug.en,
        name: child.name,
        intro: {
          en: `${child.name.en} — part of ${cat.name.en} on Hukum.`,
          ar: `${child.name.ar} ضمن ${cat.name.ar} على Hukum.`,
        },
        intent: "commercial_investigation",
        catalogKey: child.key,
        parentKey: cat.key,
        relatedKeys: [cat.key],
      });
    }
  }
    seeded = true;
  } catch (err) {
    console.error("[seo-seed]", err);
    throw err;
  }
}

async function upsertCatalogEntity(
  key: string,
  data: {
    kind: string;
    slug: string;
    name: { en: string; ar: string };
    intro: { en: string; ar: string };
    intent: string;
    catalogKey?: string;
    parentKey?: string;
    industryKey?: string;
    relatedKeys?: string[];
  }
) {
  const gen = generateFromEntity("category", "en", { name: data.name.en });
  const genAr = generateFromEntity("category", "ar", { name: data.name.ar });
  const canonical = `/ar/c/${data.slug}`;
  await MarketplaceEntity.updateOne(
    { key },
    {
      $setOnInsert: {
        key,
        kind: data.kind,
        slug: data.slug,
        slugAr: data.name.ar,
        name: data.name,
        intro: data.intro,
        intent: data.intent,
        catalogKey: data.catalogKey,
        parentKey: data.parentKey,
        industryKey: data.industryKey,
        relatedKeys: data.relatedKeys || [],
        publishState: "published",
        lifecycle: "emerging",
        seo: {
          title: { en: gen.title, ar: genAr.title },
          description: { en: gen.description, ar: genAr.description },
          h1: { en: data.name.en, ar: data.name.ar },
          ogTitle: { en: gen.title, ar: genAr.title },
          ogDescription: { en: gen.description, ar: genAr.description },
          canonical,
          indexable: false,
          sitemapInclude: false,
          searchIntent: data.intent,
        },
      },
    },
    { upsert: true }
  );
}

function normalizeProductKey(name: string, brand?: string) {
  const n = slugifyText(name.replace(/\d+\s*(gb|tb|ml|kg|mm)\b/gi, " ").replace(/\s+/g, " "));
  const b = slugifyText(brand || "generic");
  return `${b}:${n || "product"}`;
}

async function resolveCatalogForProduct(product: {
  categoryId?: unknown;
  name?: { en?: string; ar?: string };
  tags?: string[];
  searchTags?: string[];
}): Promise<CatalogHit | null> {
  if (product.categoryId) {
    const cat = await Category.findById(product.categoryId).select("catalogKey slug name").lean();
    if (cat) {
      const hit =
        findCatalogByKey(cat.catalogKey || "") ||
        findCatalogBySlug(cat.slug?.en || "") ||
        matchCatalogFromText(locVal(cat.name)) ||
        matchCatalogFromText(cat.name?.ar || "");
      if (hit) return hit;
    }
  }
  // Arabic name first for Saudi commercial terminology
  return (
    matchCatalogFromText(product.name?.ar || "") ||
    matchCatalogFromText(locVal(product.name)) ||
    matchCatalogFromText((product.tags || []).join(" ")) ||
    matchCatalogFromText((product.searchTags || []).join(" "))
  );
}

async function attachEntities(product: InstanceType<typeof Product>, vendor: Record<string, unknown> | null, hit: CatalogHit | null) {
  const keys: string[] = [];
  if (hit) {
    keys.push(hit.category.key);
    if (hit.child) keys.push(hit.child.key);
    keys.push(`${hit.category.key}:suppliers`);
  }
  const city = String((vendor as { location?: { city?: string } } | null)?.location?.city || "");
  if (hit && city) {
    const citySlug = slugifyText(city);
    if (citySlug) {
      const locKey = `${hit.category.key}:${citySlug}`;
      const existing = await MarketplaceEntity.findOne({ key: locKey }).select("productCount").lean();
      const countHint = (existing?.productCount || 0) + 1;
      if (countHint >= LOCATION_THRESHOLD || existing) {
        await upsertCatalogEntity(locKey, {
          kind: "location",
          slug: `${hit.category.slug.en}-${citySlug}`,
          name: { en: `${hit.category.name.en} in ${city}`, ar: `${hit.category.name.ar} في ${city}` },
          intro: {
            en: `${hit.category.name.en} available from vendors in ${city} on Hukum.`,
            ar: `${hit.category.name.ar} من موردين في ${city} على Hukum.`,
          },
          intent: "location",
          catalogKey: hit.category.key,
          parentKey: hit.category.key,
        });
        await MarketplaceEntity.updateOne({ key: locKey }, { $set: { locationSlug: citySlug, locationLabel: { en: city, ar: city } } });
        keys.push(locKey);
      }
    }
  }

  const docs = await MarketplaceEntity.find({ key: { $in: keys } });
  const ids = docs.map((d) => d._id);
  product.set("marketplaceEntityIds", ids);

  const pid = String(product._id);
  for (const doc of docs) {
    await upsertRel("product", pid, "belongs_to", "marketplace_entity", String(doc._id));
    if (product.vendorId) {
      await upsertRel("vendor", String(product.vendorId), "offers_on", "marketplace_entity", String(doc._id));
    }
    if (doc.parentKey) {
      const parent = await MarketplaceEntity.findOne({ key: doc.parentKey }).select("_id").lean();
      if (parent) await upsertRel("marketplace_entity", String(doc._id), "child_of", "marketplace_entity", String(parent._id));
    }
  }
  return docs;
}

function applyOfferSeo(product: InstanceType<typeof Product>) {
  const seo = (product.seo as { approved?: boolean; title?: { en?: string; ar?: string } } | undefined) || {};
  if (seo.approved && seo.title?.en && seo.title?.ar) return;
  const nameEn = product.name?.en || product.name?.ar || "Product";
  const nameAr = product.name?.ar || product.name?.en || nameEn;
  const gen = generateFromEntity("product", "en", {
    name: nameEn,
    brand: product.brand,
    brandPhrase: product.brand ? ` from ${product.brand}` : "",
  });
  const genAr = generateFromEntity("product", "ar", {
    name: nameAr,
    brand: product.brand,
    brandPhrase: product.brand ? ` من ${product.brand}` : "",
  });
  const slug = product.slug?.en || slugifyText(nameEn) || String(product._id);
  product.seo = {
    ...(typeof product.seo?.toObject === "function" ? product.seo.toObject() : product.seo || {}),
    title: {
      en: seo.title?.en || gen.title,
      ar: seo.title?.ar || genAr.title,
    },
    description: {
      en: (product.seo as { description?: { en?: string } } | undefined)?.description?.en || gen.description,
      ar: (product.seo as { description?: { ar?: string } } | undefined)?.description?.ar || genAr.description,
    },
    h1: { en: gen.h1, ar: nameAr },
    ogTitle: { en: gen.title, ar: genAr.title },
    ogDescription: { en: gen.description, ar: genAr.description },
    canonical: (product.seo as { canonical?: string } | undefined)?.canonical || localePath("ar", `/products/${slug}`),
    indexable: product.status === "published",
    sitemapInclude: product.status === "published",
    searchIntent: "transactional",
  };
}

export async function processProductSeoAeo(productId: string) {
  await seedMarketplaceEntities();
  const product = await Product.findById(productId);
  if (!product) return { ok: false as const, reason: "missing_product" };

  const vendor = await Vendor.findById(product.vendorId).lean();
  const hit = await resolveCatalogForProduct(product);

  const nameEn = locVal(product.name);
  const entityKey = normalizeProductKey(nameEn, product.brand);
  let productEntity = await ProductEntity.findOne({ key: entityKey });
  if (!productEntity) {
    productEntity = await ProductEntity.create({
      key: entityKey,
      name: product.name,
      brand: product.brand,
      manufacturer: product.manufacturer || product.manufacturerName,
      modelNumber: product.modelNumber,
      categoryId: product.categoryId,
      catalogKey: hit?.child?.key || hit?.category.key,
      slug: slugifyText(nameEn) || entityKey.replace(":", "-"),
    });
  }
  await ProductEntity.updateOne(
    { _id: productEntity._id },
    { $addToSet: { offerProductIds: product._id } }
  );
  product.set("productEntityId", productEntity._id);
  await upsertRel("product", String(product._id), "instance_of", "product_entity", String(productEntity._id));
  if (product.vendorId) {
    await upsertRel("vendor", String(product.vendorId), "offers", "product_entity", String(productEntity._id));
  }
  if (product.brand) {
    await upsertRel("product_entity", String(productEntity._id), "branded_as", "brand", product.brand);
  }
  if (product.manufacturer || product.manufacturerName) {
    await upsertRel(
      "product_entity",
      String(productEntity._id),
      "manufactured_by",
      "manufacturer",
      String(product.manufacturer || product.manufacturerName)
    );
  }

  const entities = await attachEntities(product, vendor as Record<string, unknown> | null, hit);
  if (hit) {
    const syn = entitySynonymsForHit(hit);
    for (const doc of entities) {
      if (!doc.synonyms?.ar?.length && !doc.synonyms?.en?.length) {
        doc.synonyms = syn;
        if (!doc.slugAr && hit.category.name.ar) doc.slugAr = hit.child?.slug.ar || hit.category.slug.ar || doc.slug;
        await doc.save();
      }
    }
  }
  await ProductEntity.updateOne(
    { _id: productEntity._id },
    { $set: { marketplaceEntityIds: entities.map((e) => e._id) } }
  );

  applyOfferSeo(product);

  const aeo = buildProductAeo({
    id: String(product._id),
    nameEn: nameEn || product.name?.ar || "Product",
    nameAr: product.name?.ar,
    brand: product.brand,
    manufacturer: product.manufacturer || product.manufacturerName,
    moq: product.moq,
    unit: product.unit,
    leadTime: product.leadTime,
    city: vendor?.location?.city,
    country: vendor?.location?.country,
    vendorName: locVal(vendor?.legalName) || vendor?.tradeName,
    vendorVerified: vendor?.verificationStatus === "verified",
    categoryName: hit?.child?.name.en || hit?.category.name.en,
    certifications: Array.isArray(product.certifications) ? product.certifications : [],
    applications: locVal(product.applications as { en?: string; ar?: string }),
    price: product.price,
    currency: product.currency,
    pricePublic: product.priceType !== "price_on_request" && product.price != null,
    availability: product.availability,
  });
  const geo = buildProductGeo({
    id: String(product._id),
    nameEn: nameEn || product.name?.ar || "Product",
    nameAr: product.name?.ar,
    brand: product.brand,
    manufacturer: product.manufacturer || product.manufacturerName,
    vendorName: locVal(vendor?.legalName) || vendor?.tradeName,
    vendorVerified: vendor?.verificationStatus === "verified",
    city: vendor?.location?.city,
    country: vendor?.location?.country,
    moq: product.moq,
    unit: product.unit,
    categoryName: hit?.child?.name.en || hit?.category.name.en,
    categoryNameAr: hit?.child?.name.ar || hit?.category.name.ar,
    certifications: Array.isArray(product.certifications) ? product.certifications : [],
    availability: product.availability,
  });
  product.set("aeo", aeo);
  product.set("geo", geo);
  const scores = productSeoAeoScores({ ...product.toObject(), aeo, geo });
  product.seoReadinessScore = scores.seo;
  product.set("aeoScore", scores.aeo);
  product.set("seoScoreAr", scores.seoAr);
  product.set("seoScoreEn", scores.seoEn);
  product.set("aeoScoreAr", scores.aeoAr);
  product.set("aeoScoreEn", scores.aeoEn);
  product.set("geoScore", Math.round((scores.geoAr + scores.geoEn) / 2));
  product.set("geoScoreAr", scores.geoAr);
  product.set("geoScoreEn", scores.geoEn);
  product.set("discoveryScore", scores.discovery);
  product.set("freshnessStatus", "fresh");
  product.set("seoGaps", scores.gaps);
  await product.save();

  await AeoRecord.create({
    entityType: "product",
    entityId: String(product._id),
    layer: aeo,
    status: "ai_generated",
  });

  await refreshMarketplaceEntities(entities.map((e) => String(e._id)));
  return {
    ok: true as const,
    productEntityId: String(productEntity._id),
    marketplaceEntityIds: entities.map((e) => String(e._id)),
    keys: entities.map((e) => e.key),
    scores,
  };
}

export function scheduleProductSeoAeo(productId: string) {
  void processProductSeoAeo(productId).catch((err) => {
    console.error("[seo-pipeline]", productId, err);
  });
}

export async function refreshMarketplaceEntities(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  for (const id of unique) {
    await refreshOneMarketplaceEntity(id);
  }
}

export async function refreshOneMarketplaceEntity(id: string) {
  const entity = await MarketplaceEntity.findById(id);
  if (!entity || entity.locked) return entity;

  const products = await Product.find({
    marketplaceEntityIds: entity._id,
    status: "published",
  })
    .select("vendorId brand manufacturer manufacturerName aeo seo")
    .lean();

  const vendorIds = [...new Set(products.map((p) => String(p.vendorId)))];
  const vendors = vendorIds.length
    ? await Vendor.find({ _id: { $in: vendorIds } })
        .select("verificationStatus location legalName companyType")
        .lean()
    : [];
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));
  const activeProducts = products.filter((p) => {
    const v = vendorMap.get(String(p.vendorId));
    return v && v.verificationStatus !== "rejected" && v.verificationStatus !== "suspended";
  });
  const verifiedVendors = new Set(
    activeProducts
      .map((p) => vendorMap.get(String(p.vendorId)))
      .filter((v) => v?.verificationStatus === "verified")
      .map((v) => String((v as { _id: unknown })._id))
  );
  const manufacturers = new Set(
    activeProducts.map((p) => p.manufacturer || p.manufacturerName).filter((x): x is string => Boolean(x))
  );
  const brands = [
    ...new Set(activeProducts.map((p) => p.brand).filter((x): x is string => Boolean(x))),
  ];
  const cities = [
    ...new Set(
      activeProducts
        .map((p) => vendorMap.get(String(p.vendorId))?.location?.city)
        .filter((x): x is string => Boolean(x))
    ),
  ];

  entity.productCount = activeProducts.length;
  entity.offerCount = activeProducts.length;
  entity.vendorCount = new Set(activeProducts.map((p) => String(p.vendorId))).size;
  entity.verifiedVendorCount = verifiedVendors.size;
  entity.manufacturerCount = manufacturers.size;
  entity.locationCount = cities.length;
  entity.lastStatsAt = new Date();

  const gate = entityQualityGate({
    productCount: entity.productCount,
    vendorCount: entity.vendorCount,
    hasIntro: Boolean(locVal(entity.intro) || entity.intro?.ar),
    hasTitle: Boolean(entity.seo?.title?.ar || entity.seo?.title?.en || locVal(entity.name)),
    hasCanonical: Boolean(entity.seo?.canonical),
    hasArabicName: Boolean(entity.name?.ar || entity.seo?.title?.ar),
    lifecycle: entity.lifecycle,
    locked: entity.locked,
    override: entity.indexableOverride,
  });
  entity.lifecycle = gate.lifecycle;
  entity.indexable = gate.indexable;
  if (entity.seo) {
    entity.seo.indexable = gate.indexable;
    entity.seo.sitemapInclude = gate.indexable;
    // Prefer Arabic canonical path for Saudi-first discovery; EN/AR share slug under locale prefix
    if (!entity.seo.canonical || entity.seo.canonical.startsWith("/en/c/")) {
      entity.seo.canonical = `/ar/c/${entity.slug}`;
    }
    const nameEn = entity.name?.en || locVal(entity.name);
    const nameAr = entity.name?.ar || nameEn;
    const genEn = generateFromEntity("category", "en", { name: nameEn });
    const genAr = generateFromEntity("category", "ar", { name: nameAr });
    const titleArBroken =
      !entity.seo.title?.ar ||
      /suppliers|manufacturers|explore|browse products/i.test(entity.seo.title.ar) ||
      (/Hukum/i.test(entity.seo.title.ar) && !entity.seo.title.ar.includes("|"));
    const titleEnMissing = !entity.seo.title?.en;
    if (titleArBroken || titleEnMissing || !entity.seo.description?.ar) {
      entity.seo.title = {
        en: entity.seo.approved && entity.seo.title?.en ? entity.seo.title.en : genEn.title,
        ar: entity.seo.approved && entity.seo.title?.ar && !titleArBroken ? entity.seo.title.ar : genAr.title,
      };
      entity.seo.description = {
        en: entity.seo.approved && entity.seo.description?.en ? entity.seo.description.en : genEn.description,
        ar: entity.seo.approved && entity.seo.description?.ar ? entity.seo.description.ar : genAr.description,
      };
      entity.seo.h1 = { en: nameEn, ar: nameAr };
      entity.seo.ogTitle = { en: genEn.title, ar: genAr.title };
      entity.seo.ogDescription = { en: genEn.description, ar: genAr.description };
    }
  }

  const aeo = buildMarketplaceAeo({
    id: String(entity._id),
    nameEn: entity.name?.en || locVal(entity.name),
    nameAr: entity.name?.ar,
    introEn: entity.intro?.en,
    introAr: entity.intro?.ar,
    productCount: entity.productCount,
    vendorCount: entity.vendorCount,
    manufacturerCount: entity.manufacturerCount,
    cities,
    brands,
    kind: entity.kind,
  });
  const geo = buildMarketplaceGeo({
    id: String(entity._id),
    key: entity.key,
    nameEn: entity.name?.en || locVal(entity.name),
    nameAr: entity.name?.ar,
    introEn: entity.intro?.en,
    introAr: entity.intro?.ar,
    productCount: entity.productCount,
    vendorCount: entity.vendorCount,
    manufacturerCount: entity.manufacturerCount,
    cities,
    brands,
    relatedKeys: entity.relatedKeys,
  });
  if (!entity.aeo?.status || entity.aeo.status === "ai_generated") {
    entity.aeo = aeo as typeof entity.aeo;
  }
  if (!entity.geo?.status || entity.geo.status === "ai_generated") {
    entity.geo = geo as typeof entity.geo;
  }
  const scores = entityDiscoveryScores({
    name: entity.name,
    intro: entity.intro,
    seo: entity.seo,
    aeo: entity.aeo,
    geo: entity.geo,
    productCount: entity.productCount,
    vendorCount: entity.vendorCount,
    slug: entity.slug,
  });
  entity.seoScore = scores.seo;
  entity.seoScoreAr = scores.seoAr;
  entity.seoScoreEn = scores.seoEn;
  entity.aeoScore = scores.aeo;
  entity.aeoScoreAr = scores.aeoAr;
  entity.aeoScoreEn = scores.aeoEn;
  entity.geoScore = Math.round((scores.geoAr + scores.geoEn) / 2);
  entity.geoScoreAr = scores.geoAr;
  entity.geoScoreEn = scores.geoEn;
  entity.discoveryScore = scores.discovery;
  entity.qualityScore = scores.discovery;
  entity.orphan = entity.productCount === 0;
  entity.freshness = entity.productCount === 0 ? "unavailable" : "fresh";
  entity.lastContentAt = new Date();
  await entity.save();
  return entity;
}

export async function onVendorSupplyChanged(vendorId: string) {
  const products = await Product.find({ vendorId }).select("marketplaceEntityIds").lean();
  const ids = products.flatMap((p) => (p.marketplaceEntityIds || []).map((x: unknown) => String(x)));
  await refreshMarketplaceEntities(ids);
}

export async function migrateAllSeoEntities(limit = 5000) {
  await seedMarketplaceEntities();
  const products = await Product.find().select("_id").limit(limit).lean();
  const report = { products: products.length, processed: 0, failed: 0, entities: 0 };
  for (const p of products) {
    try {
      await processProductSeoAeo(String(p._id));
      report.processed += 1;
    } catch {
      report.failed += 1;
    }
  }
  const all = await MarketplaceEntity.find().select("_id").lean();
  await refreshMarketplaceEntities(all.map((e) => String(e._id)));
  report.entities = all.length;
  return report;
}

export async function mergeMarketplaceEntities(fromKey: string, toKey: string, userId?: string) {
  const from = await MarketplaceEntity.findOne({ key: fromKey });
  const to = await MarketplaceEntity.findOne({ key: toKey });
  if (!from || !to) throw Object.assign(new Error("Entity not found"), { status: 404 });
  await Product.updateMany({ marketplaceEntityIds: from._id }, { $addToSet: { marketplaceEntityIds: to._id } });
  await Product.updateMany({ marketplaceEntityIds: from._id }, { $pull: { marketplaceEntityIds: from._id } });
  from.lifecycle = "archived";
  from.indexable = false;
  from.publishState = "archived";
  from.locked = true;
  await from.save();
  await refreshOneMarketplaceEntity(String(to._id));
  return { from: from.key, to: to.key, userId };
}

export function isApprovedFacet(facet: string) {
  return /^(suppliers|wholesale|manufacturers|[a-z0-9-]{3,40})$/.test(facet);
}

export async function findEntityBySlug(slug: string, facet?: string) {
  if (facet && isApprovedFacet(facet)) {
    const combined = `${slug}-${facet}`;
    const byCombined = await MarketplaceEntity.findOne({ slug: combined });
    if (byCombined) return byCombined;
    const byKey = await MarketplaceEntity.findOne({ key: `${slug}:${facet}` });
    if (byKey) return byKey;
    const parent = await MarketplaceEntity.findOne({ slug });
    if (parent && (facet === "suppliers" || parent.key.endsWith(":suppliers") === false)) {
      const child = await MarketplaceEntity.findOne({ key: `${parent.catalogKey || parent.key}:${facet}` });
      if (child) return child;
    }
  }
  return (await MarketplaceEntity.findOne({ slug })) || (await MarketplaceEntity.findOne({ key: slug }));
}

export { Types };
