import { Schema } from "mongoose";

export const LocalizedStringSchema = new Schema(
  {
    en: { type: String, default: "" },
    ar: { type: String, default: "" },
  },
  { _id: false }
);

/** Localized lists (e.g. synonyms) */
export const LocalizedStringArraySchema = new Schema(
  {
    en: { type: [String], default: [] },
    ar: { type: [String], default: [] },
  },
  { _id: false }
);

export const SeoSchema = new Schema(
  {
    title: LocalizedStringSchema,
    description: LocalizedStringSchema,
    h1: LocalizedStringSchema,
    slug: LocalizedStringSchema,
    keywords: LocalizedStringSchema,
    ogTitle: LocalizedStringSchema,
    ogDescription: LocalizedStringSchema,
    socialImage: String,
    twitterTitle: LocalizedStringSchema,
    twitterDescription: LocalizedStringSchema,
    twitterImage: String,
    twitterCard: { type: String, default: "summary_large_image" },
    canonical: String,
    indexable: { type: Boolean, default: true },
    follow: { type: Boolean, default: true },
    sitemapInclude: { type: Boolean, default: true },
    robotsExtra: String,
    schemaType: String,
    primaryTopic: String,
    secondaryTopics: [String],
    searchIntent: String,
    approved: { type: Boolean, default: false },
  },
  { _id: false }
);

export const AiFieldMetaSchema = new Schema(
  {
    confidence: Number,
    sourceDocumentId: Schema.Types.ObjectId,
    extractionStatus: { type: String, enum: ["pending", "extracted", "failed", "skipped"], default: "pending" },
    aiGenerated: { type: Boolean, default: false },
    humanVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

export const DimensionsSchema = new Schema(
  {
    length: Number,
    width: Number,
    height: Number,
    diameter: Number,
    weight: Number,
    volume: Number,
    unit: String,
    weightUnit: String,
  },
  { _id: false }
);

export const PriceTierSchema = new Schema(
  {
    minQty: { type: Number, required: true },
    maxQty: Number,
    price: { type: Number, required: true },
  },
  { _id: false }
);

export const CertificationRecordSchema = new Schema(
  {
    name: String,
    standard: String,
    number: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    scope: String,
    documentId: { type: Schema.Types.ObjectId, ref: "Document" },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected", "expired"],
      default: "unverified",
    },
  },
  { _id: false }
);

export const OriginSchema = new Schema(
  {
    countryOfOrigin: String,
    manufacturingCountry: String,
    manufacturingCity: String,
    sellerCountry: String,
    sellerCity: String,
    shippingOrigin: String,
    warehouseLocation: String,
  },
  { _id: false }
);

export const PackagingSchema = new Schema(
  {
    type: String,
    unitsPerPackage: Number,
    dimensions: DimensionsSchema,
    weight: Number,
    cartonDimensions: DimensionsSchema,
    cartonWeight: Number,
    palletConfig: String,
    material: String,
    customPackaging: { type: Boolean, default: false },
    labeling: String,
  },
  { _id: false }
);

export const LogisticsSchema = new Schema(
  {
    portOfLoading: String,
    shippingMethods: [String],
    air: { type: Boolean, default: false },
    sea: { type: Boolean, default: false },
    road: { type: Boolean, default: false },
    courier: { type: Boolean, default: false },
    productionLeadTime: String,
    shippingLeadTime: String,
    incoterms: String,
    exportCapable: { type: Boolean, default: false },
    marketsServed: [String],
  },
  { _id: false }
);

export const CustomizationSchema = new Schema(
  {
    available: { type: Boolean, default: false },
    types: [String],
    moq: Number,
    leadTime: String,
    setupCost: Number,
    sampleProcess: String,
    oem: { type: Boolean, default: false },
    odm: { type: Boolean, default: false },
    privateLabel: { type: Boolean, default: false },
  },
  { _id: false }
);

export const RegionalSchema = new Schema(
  {
    saudiStandards: [String],
    gccStandards: [String],
    hsCode: String,
    productRegistration: String,
    regulatoryDocs: [{ type: Schema.Types.ObjectId, ref: "Document" }],
  },
  { _id: false }
);

export const ProductRelationshipsSchema = new Schema(
  {
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    alternativeProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    accessories: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    spareParts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { _id: false }
);

export const CURRENCIES = ["SAR", "USD", "EUR", "GBP", "AED", "QAR", "KWD", "BHD", "OMR", "INR"] as const;
export const PRICE_TYPES = [
  "fixed",
  "starting_from",
  "price_on_request",
  "negotiable",
  "contact_supplier",
  "tiered",
  "quantity_based",
  "contract",
] as const;
export const PRODUCT_CONDITIONS = [
  "new",
  "refurbished",
  "used",
  "made_to_order",
  "custom_manufactured",
  "pre_owned",
  "sample",
] as const;
export const UNITS = [
  "piece",
  "unit",
  "set",
  "box",
  "carton",
  "pack",
  "pair",
  "dozen",
  "kg",
  "g",
  "ton",
  "liter",
  "ml",
  "meter",
  "sqm",
  "cbm",
  "roll",
  "pallet",
  "container",
  "custom",
] as const;

export const MEDIA_TYPES = [
  "image",
  "video",
  "pdf",
  "brochure",
  "datasheet",
  "drawing",
  "certificate",
  "manual",
  "360",
  "lifestyle",
  "technical",
  "packaging",
  "factory",
  "infographic",
  "diagram",
  "model3d",
] as const;

export const PRODUCT_STATUSES = [
  "draft",
  "submitted",
  "ai_processing",
  "under_review",
  "vendor_approved",
  "changes_requested",
  "approved",
  "published",
  "rejected",
  "archived",
] as const;

export const DOCUMENT_TYPES = [
  "commercial_registration",
  "vat_certificate",
  "national_address",
  "company_profile",
  "iso",
  "product_certificate",
  "catalogue",
  "datasheet",
  "brochure",
  "user_manual",
  "installation_manual",
  "safety_datasheet",
  "warranty",
  "compliance",
  "cad_drawing",
  "technical_drawing",
  "test_report",
  "factory_document",
  "quality_document",
  "insurance",
  "business_license",
  "identity",
  "address_proof",
  "other",
] as const;
