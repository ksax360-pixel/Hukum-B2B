import { Schema, models, model } from "mongoose";
import { LocalizedStringSchema, SeoSchema, CustomizationSchema } from "@/lib/schemas/common";

const COMPANY_TYPES = [
  "manufacturer",
  "distributor",
  "wholesaler",
  "retailer",
  "importer",
  "exporter",
  "service_provider",
  "contractor",
  "trading_company",
  "oem",
  "odm",
  "brand_owner",
  "agent",
  "other",
] as const;

const LegalSchema = new Schema(
  {
    registrationCountry: String,
    legalEntityType: String,
    licenseInfo: String,
    chamberRegistration: String,
    registeredAddress: String,
    operatingAddress: String,
    authorizedRepresentative: String,
  },
  { _id: false }
);

const ManufacturerProfileSchema = new Schema(
  {
    factoryLocations: [String],
    factorySize: String,
    productionCapacity: String,
    productionLines: Number,
    machinery: [String],
    processes: [String],
    qualityControl: String,
    factoryImages: [String],
    factoryVideos: [String],
    exportMarkets: [String],
    oem: { type: Boolean, default: false },
    odm: { type: Boolean, default: false },
    customization: { type: Boolean, default: false },
    privateLabel: { type: Boolean, default: false },
  },
  { _id: false }
);

const DistributorProfileSchema = new Schema(
  {
    brandsRepresented: [String],
    territories: [String],
    authorizedDistributor: { type: Boolean, default: false },
    warehouse: String,
    stockCapacity: String,
  },
  { _id: false }
);

const CapabilitiesProfileSchema = new Schema(
  {
    productsSupplied: [String],
    industriesServed: [String],
    marketsServed: [String],
    countriesExported: [String],
    moqRange: String,
    productionCapacity: String,
    customization: { type: Boolean, default: false },
    privateLabel: { type: Boolean, default: false },
    oem: { type: Boolean, default: false },
    odm: { type: Boolean, default: false },
    sampleAvailability: { type: Boolean, default: false },
    leadTime: String,
    packaging: String,
    logistics: String,
    paymentTerms: String,
  },
  { _id: false }
);

const ContactSettingsSchema = new Schema(
  {
    whatsappEnabled: { type: Boolean, default: true },
    phoneEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    addressVisible: { type: Boolean, default: true },
    directionsEnabled: { type: Boolean, default: true },
    rfqEnabled: { type: Boolean, default: true },
    inquiryEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

/** Public microsite look-and-feel — live copy is `published`; seller edits go to `pending` until admin approves. */
const StorefrontDesignSchema = new Schema(
  {
    headline: LocalizedStringSchema,
    tagline: LocalizedStringSchema,
    about: LocalizedStringSchema,
    bannerText: LocalizedStringSchema,
    ctaLabel: LocalizedStringSchema,
    primaryColor: { type: String, default: "#0F766E" },
    accentColor: { type: String, default: "#C4A35A" },
    layout: {
      type: String,
      enum: ["classic", "modern", "bold"],
      default: "classic",
    },
    coverImage: String,
    /** Hero banners for the public storefront — max 2 images (seller upload). */
    bannerImages: { type: [String], default: [] },
    logo: String,
    showProducts: { type: Boolean, default: true },
    showCertifications: { type: Boolean, default: true },
    showContactCta: { type: Boolean, default: true },
  },
  { _id: false }
);

const StorefrontSchema = new Schema(
  {
    published: { type: StorefrontDesignSchema, default: undefined },
    pending: { type: StorefrontDesignSchema, default: undefined },
    status: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
      index: true,
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, default: "" },
  },
  { _id: false }
);

const VendorSchema = new Schema(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    legalName: LocalizedStringSchema,
    tradeName: { type: String, default: "" },
    companyType: {
      type: String,
      enum: COMPANY_TYPES,
      default: "trading_company",
    },
    companyRoles: [{ type: String, enum: COMPANY_TYPES }],
    crNumber: String,
    vatNumber: String,
    website: String,
    /** Premium custom domain mapped to this storefront (persisted in Mongo, not localStorage). */
    customDomain: String,
    email: String,
    phone: String,
    whatsapp: String,
    alternativeContact: String,
    businessHours: String,
    timezone: String,
    yearEstablished: Number,
    description: LocalizedStringSchema,
    logo: String,
    coverImage: String,
    /** Seller dashboard/storefront design with Super Admin approval gate */
    storefront: { type: StorefrontSchema, default: () => ({ status: "none" }) },
    industries: [{ type: Schema.Types.ObjectId, ref: "Industry" }],
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    productTypeIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    marketsServed: [String],
    citiesServed: [String],
    exportMarkets: [String],
    moq: String,
    leadTime: String,
    paymentTerms: String,
    capabilities: [String],
    capabilitiesProfile: CapabilitiesProfileSchema,
    certifications: [String],
    legal: LegalSchema,
    manufacturerProfile: ManufacturerProfileSchema,
    distributorProfile: DistributorProfileSchema,
    contactSettings: ContactSettingsSchema,
    customization: CustomizationSchema,
    socialLinks: { type: Map, of: String },
    location: {
      country: { type: String, default: "SA" },
      region: String,
      city: String,
      address: String,
      postalCode: String,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "ai_processing", "documents_required", "under_review", "verified", "rejected", "suspended", "expired"],
      default: "draft",
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected", "suspended"],
      default: "unverified",
      index: true,
    },
    /** Super Admin rejection note shown to seller (reupload / quality / mismatch). */
    verificationRejectionReason: { type: String, default: "" },
    verificationRejectedAt: Date,
    verificationReviewedAt: Date,
    verificationReviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    /** Soft-hide from active approval queue without changing verificationStatus. */
    verificationArchived: { type: Boolean, default: false, index: true },
    verificationArchivedAt: Date,
    completenessScore: { type: Number, default: 0 },
    seo: SeoSchema,
    slug: LocalizedStringSchema,
    featured: { type: Boolean, default: false },
    subscriptionPlanId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    /** free | gold | premium — mirrors SubscriptionPlan.key for fast entitlement checks. */
    subscriptionPlanKey: {
      type: String,
      enum: ["free", "gold", "premium"],
      default: "free",
      index: true,
    },
    /** Alias used by some seller UI — keep in sync with subscriptionPlanKey. */
    plan: { type: String, default: "free" },
    subscription: {
      planKey: String,
      status: { type: String, enum: ["none", "trialing", "active", "past_due", "cancelled"], default: "none" },
      renewsAt: Date,
      amount: Number,
      currency: { type: String, default: "SAR" },
      invoiceId: String,
      vatIncluded: Boolean,
    },
    /** Discover → Register attribution (utm / referral). */
    acquisition: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

VendorSchema.index({ "legalName.en": "text", "legalName.ar": "text", "description.en": "text", "description.ar": "text" });

// Recompile when schema evolves in dev (avoids stale cached model without storefront).
if (models.Vendor) {
  delete models.Vendor;
}
export const Vendor = model("Vendor", VendorSchema);
