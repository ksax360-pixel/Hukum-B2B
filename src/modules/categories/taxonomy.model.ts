import { Schema, models, model } from "mongoose";
import { LocalizedStringSchema, SeoSchema } from "@/lib/schemas/common";

const SynonymBagSchema = new Schema(
  {
    en: [String],
    ar: [String],
  },
  { _id: false }
);

const CategoryRelationSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    relation: {
      type: String,
      enum: ["related", "alternative", "complementary", "replacement"],
      default: "related",
    },
  },
  { _id: false }
);

const IndustrySchema = new Schema(
  {
    code: { type: String, index: true, sparse: true },
    name: LocalizedStringSchema,
    displayName: LocalizedStringSchema,
    description: LocalizedStringSchema,
    slug: LocalizedStringSchema,
    image: String,
    icon: String,
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "archived", "deprecated"],
      default: "active",
      index: true,
    },
    seo: SeoSchema,
    synonyms: SynonymBagSchema,
    buyerSearchTerms: SynonymBagSchema,
    complianceFlags: [String],
    relatedIndustryIds: [{ type: Schema.Types.ObjectId, ref: "Industry" }],
    attributeTemplateKey: String,
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

IndustrySchema.index({ "name.en": "text", "name.ar": "text", "slug.en": "text" });

export const Industry = models.Industry || model("Industry", IndustrySchema);

const CategorySchema = new Schema(
  {
    /** Stable permanent ID e.g. CAT-CON-BLD-001 — never use name as FK */
    code: { type: String, index: true, sparse: true, unique: true },
    industryId: { type: Schema.Types.ObjectId, ref: "Industry", index: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    /** Variable depth: 1=category, 2=subcategory, 3=product type, 4+=variant family */
    level: { type: Number, min: 1, max: 8, default: 1, index: true },
    path: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    pathSlugs: {
      en: [String],
      ar: [String],
    },
    name: LocalizedStringSchema,
    displayName: LocalizedStringSchema,
    description: LocalizedStringSchema,
    /** What belongs / does not belong / applications */
    scopeNotes: LocalizedStringSchema,
    slug: LocalizedStringSchema,
    image: String,
    icon: String,
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "archived", "deprecated"],
      default: "active",
      index: true,
    },
    /** Show in homepage "Popular categories" when active + level 1 */
    featured: { type: Boolean, default: false, index: true },
    /** Catalog key from marketplace-categories.ts for sync/migration */
    catalogKey: { type: String, index: true, sparse: true },
    attributeIds: [{ type: Schema.Types.ObjectId, ref: "Attribute" }],
    attributeTemplateKey: { type: String, index: true },
    filterKeys: [String],
    requiredAttributeKeys: [String],
    recommendedAttributeKeys: [String],
    optionalAttributeKeys: [String],
    allowedConditions: [String],
    synonyms: SynonymBagSchema,
    buyerSearchTerms: SynonymBagSchema,
    relatedCategories: [CategoryRelationSchema],
    relatedIndustryIds: [{ type: Schema.Types.ObjectId, ref: "Industry" }],
    faqTemplate: [
      {
        question: LocalizedStringSchema,
        answer: LocalizedStringSchema,
      },
    ],
    contentTemplate: LocalizedStringSchema,
    schemaOrgType: String,
    breadcrumbLabel: LocalizedStringSchema,
    qualityScore: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    migratedFromCode: String,
    seo: SeoSchema,
  },
  { timestamps: true }
);

CategorySchema.index({ industryId: 1, parentId: 1, order: 1 });
CategorySchema.index({ "slug.en": 1 });
CategorySchema.index({ "name.en": "text", "name.ar": "text", catalogKey: "text" });

export const Category = models.Category || model("Category", CategorySchema);

const AttributeOptionSchema = new Schema(
  {
    label: LocalizedStringSchema,
    value: String,
    synonyms: [String],
  },
  { _id: false }
);

const AttributeDependencySchema = new Schema(
  {
    whenAttributeKey: String,
    whenValues: [String],
    showAttributeKeys: [String],
    requireAttributeKeys: [String],
  },
  { _id: false }
);

const AttributeSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: LocalizedStringSchema,
    description: LocalizedStringSchema,
    group: {
      type: String,
      enum: [
        "general",
        "technical",
        "physical",
        "performance",
        "commercial",
        "logistics",
        "certification",
        "packaging",
        "warranty",
        "compliance",
        "regional",
        "customization",
      ],
      default: "general",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "long_text",
        "number",
        "decimal",
        "integer",
        "boolean",
        "dropdown",
        "multi_select",
        "radio",
        "checkbox",
        "date",
        "date_range",
        "range",
        "measurement",
        "measurement_range",
        "dimension",
        "weight",
        "volume",
        "currency",
        "percentage",
        "file",
        "image",
        "video",
        "asset_3d",
        "url",
        "address",
        "country",
        "region",
        "certification",
        "rich_text",
      ],
      default: "text",
    },
    options: [AttributeOptionSchema],
    unit: String,
    unitSystem: { type: String, enum: ["metric", "imperial", "both", "none"], default: "none" },
    allowedUnits: [String],
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      positive: Boolean,
      integer: Boolean,
      requiredMessage: LocalizedStringSchema,
    },
    required: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    seoIndexable: { type: Boolean, default: false },
    rfqInheritable: { type: Boolean, default: true },
    adminOnly: { type: Boolean, default: false },
    vendorEditable: { type: Boolean, default: true },
    buyerVisible: { type: Boolean, default: true },
    multiValue: { type: Boolean, default: false },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    templateKeys: [{ type: String, index: true }],
    dependencies: [AttributeDependencySchema],
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive", "archived"], default: "active" },
  },
  { timestamps: true }
);

export const Attribute = models.Attribute || model("Attribute", AttributeSchema);

/** Category ↔ Attribute template assignment with required/recommended flags */
const CategoryAttributeTemplateSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    templateKey: { type: String, required: true, index: true },
    attributeKey: { type: String, required: true, index: true },
    requirement: {
      type: String,
      enum: ["mandatory", "recommended", "optional", "conditional"],
      default: "optional",
    },
    filterable: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategoryAttributeTemplateSchema.index({ categoryId: 1, attributeKey: 1 }, { unique: true, sparse: true });
CategoryAttributeTemplateSchema.index({ templateKey: 1, attributeKey: 1 });

export const CategoryAttributeTemplate =
  models.CategoryAttributeTemplate || model("CategoryAttributeTemplate", CategoryAttributeTemplateSchema);

const TaxonomyMigrationSchema = new Schema(
  {
    fromCode: String,
    fromCatalogKey: String,
    toCode: String,
    toCatalogKey: String,
    confidence: { type: Number, min: 0, max: 1, default: 1 },
    status: {
      type: String,
      enum: ["pending", "auto_migrated", "needs_review", "completed", "rejected"],
      default: "pending",
    },
    notes: String,
  },
  { timestamps: true }
);

export const TaxonomyMigration =
  models.TaxonomyMigration || model("TaxonomyMigration", TaxonomyMigrationSchema);
