import { Schema, models, model } from "mongoose";
import { LocalizedStringSchema, SeoSchema } from "@/lib/schemas/common";

export const ENTITY_KINDS = [
  "category",
  "product_type",
  "supplier",
  "wholesale",
  "manufacturer",
  "industry",
  "application",
  "location",
  "brand",
] as const;

export const ENTITY_LIFECYCLES = ["active", "emerging", "unavailable", "archived"] as const;
export const PUBLISH_STATES = [
  "draft",
  "ai_generated",
  "pending_review",
  "approved",
  "published",
  "scheduled",
  "needs_update",
  "stale",
  "archived",
  "blocked",
] as const;
export const SEARCH_INTENTS = [
  "informational",
  "commercial_investigation",
  "supplier_discovery",
  "transactional",
  "wholesale",
  "manufacturer",
  "location",
] as const;
export const FRESHNESS = ["fresh", "needs_verification", "stale", "expired", "unavailable"] as const;

const ProvenanceSchema = new Schema(
  {
    sourceType: String,
    sourceId: String,
    sourceField: String,
    confidence: { type: Number, default: 0 },
    lastVerifiedAt: Date,
    verifiedBy: String,
  },
  { _id: false }
);

const AeoFactSchema = new Schema(
  {
    key: String,
    label: LocalizedStringSchema,
    value: LocalizedStringSchema,
    provenance: ProvenanceSchema,
  },
  { _id: false }
);

const AeoFaqSchema = new Schema(
  {
    q: LocalizedStringSchema,
    a: LocalizedStringSchema,
    provenance: ProvenanceSchema,
    status: { type: String, enum: PUBLISH_STATES, default: "ai_generated" },
    override: { type: Boolean, default: false },
  },
  { _id: false }
);

const AeoLayerSchema = new Schema(
  {
    summary: LocalizedStringSchema,
    facts: [AeoFactSchema],
    faqs: [AeoFaqSchema],
    buyingConsiderations: LocalizedStringSchema,
    generatedAt: Date,
    sourceDataAt: Date,
    confidence: { type: Number, default: 0 },
    status: { type: String, enum: PUBLISH_STATES, default: "ai_generated" },
  },
  { _id: false }
);

const GeoClaimSchema = new Schema(
  {
    key: String,
    statement: LocalizedStringSchema,
    provenance: ProvenanceSchema,
    freshness: { type: String, enum: FRESHNESS, default: "fresh" },
  },
  { _id: false }
);

const GeoLayerSchema = new Schema(
  {
    entityCard: LocalizedStringSchema,
    claims: [GeoClaimSchema],
    attribution: LocalizedStringSchema,
    relatedEntityKeys: [String],
    generatedAt: Date,
    sourceDataAt: Date,
    confidence: { type: Number, default: 0 },
    status: { type: String, enum: PUBLISH_STATES, default: "ai_generated" },
  },
  { _id: false }
);

const ContentSectionSchema = new Schema(
  {
    key: String,
    heading: LocalizedStringSchema,
    body: LocalizedStringSchema,
    provenance: ProvenanceSchema,
  },
  { _id: false }
);

const MarketplaceEntitySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ENTITY_KINDS, required: true, index: true },
    /** Latin/URL slug (stable crawl path) */
    slug: { type: String, required: true, index: true },
    /** Optional Arabic display slug for UI; URL path remains locale-prefixed `/ar/c/{slug}` */
    slugAr: { type: String, index: true },
    name: LocalizedStringSchema,
    intro: LocalizedStringSchema,
    synonyms: {
      en: [String],
      ar: [String],
    },
    intent: { type: String, enum: SEARCH_INTENTS, default: "commercial_investigation" },
    lifecycle: { type: String, enum: ENTITY_LIFECYCLES, default: "emerging", index: true },
    publishState: { type: String, enum: PUBLISH_STATES, default: "published" },
    parentKey: { type: String, index: true },
    catalogKey: { type: String, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    industryKey: String,
    locationSlug: String,
    locationLabel: LocalizedStringSchema,
    seo: SeoSchema,
    aeo: AeoLayerSchema,
    geo: GeoLayerSchema,
    sections: [ContentSectionSchema],
    relatedKeys: [String],
    indexable: { type: Boolean, default: false, index: true },
    indexableOverride: { type: Boolean },
    productCount: { type: Number, default: 0 },
    offerCount: { type: Number, default: 0 },
    vendorCount: { type: Number, default: 0 },
    verifiedVendorCount: { type: Number, default: 0 },
    manufacturerCount: { type: Number, default: 0 },
    locationCount: { type: Number, default: 0 },
    seoScore: { type: Number, default: 0 },
    seoScoreAr: { type: Number, default: 0 },
    seoScoreEn: { type: Number, default: 0 },
    aeoScore: { type: Number, default: 0 },
    aeoScoreAr: { type: Number, default: 0 },
    aeoScoreEn: { type: Number, default: 0 },
    geoScore: { type: Number, default: 0 },
    geoScoreAr: { type: Number, default: 0 },
    geoScoreEn: { type: Number, default: 0 },
    discoveryScore: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0 },
    orphan: { type: Boolean, default: false },
    duplicateRisk: { type: String, enum: ["low", "medium", "high"], default: "low" },
    freshness: { type: String, enum: FRESHNESS, default: "fresh" },
    lastStatsAt: Date,
    lastContentAt: Date,
    locked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MarketplaceEntitySchema.index({ slug: 1, kind: 1 });
MarketplaceEntitySchema.index({ "seo.indexable": 1, indexable: 1 });

export const MarketplaceEntity =
  models.MarketplaceEntity || model("MarketplaceEntity", MarketplaceEntitySchema);

const ProductEntitySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: LocalizedStringSchema,
    brand: String,
    manufacturer: String,
    modelNumber: String,
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    catalogKey: String,
    marketplaceEntityIds: [{ type: Schema.Types.ObjectId, ref: "MarketplaceEntity" }],
    offerProductIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    seo: SeoSchema,
    aeo: AeoLayerSchema,
    geo: GeoLayerSchema,
    slug: String,
    synonyms: { en: [String], ar: [String] },
    seoScore: { type: Number, default: 0 },
    seoScoreAr: { type: Number, default: 0 },
    seoScoreEn: { type: Number, default: 0 },
    aeoScore: { type: Number, default: 0 },
    aeoScoreAr: { type: Number, default: 0 },
    aeoScoreEn: { type: Number, default: 0 },
    geoScore: { type: Number, default: 0 },
    discoveryScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProductEntity = models.ProductEntity || model("ProductEntity", ProductEntitySchema);

const EntityRelationshipSchema = new Schema(
  {
    fromType: { type: String, required: true, index: true },
    fromId: { type: String, required: true, index: true },
    rel: { type: String, required: true, index: true },
    toType: { type: String, required: true, index: true },
    toId: { type: String, required: true, index: true },
    weight: { type: Number, default: 1 },
    provenance: ProvenanceSchema,
  },
  { timestamps: true }
);

EntityRelationshipSchema.index({ fromType: 1, fromId: 1, rel: 1, toType: 1, toId: 1 }, { unique: true });

export const EntityRelationship =
  models.EntityRelationship || model("EntityRelationship", EntityRelationshipSchema);

const AeoRecordSchema = new Schema(
  {
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    locale: String,
    layer: AeoLayerSchema,
    version: { type: Number, default: 1 },
    status: { type: String, enum: PUBLISH_STATES, default: "ai_generated" },
  },
  { timestamps: true }
);

AeoRecordSchema.index({ entityType: 1, entityId: 1, version: -1 });

export const AeoRecord = models.AeoRecord || model("AeoRecord", AeoRecordSchema);

const EntityAnalyticsSchema = new Schema(
  {
    entityType: String,
    entityId: String,
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    organicSessions: { type: Number, default: 0 },
    productViews: { type: Number, default: 0 },
    vendorViews: { type: Number, default: 0 },
    rfq: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    locale: String,
  },
  { timestamps: true }
);

EntityAnalyticsSchema.index({ entityType: 1, entityId: 1, locale: 1 }, { unique: true });

export const EntityAnalytics = models.EntityAnalytics || model("EntityAnalytics", EntityAnalyticsSchema);
