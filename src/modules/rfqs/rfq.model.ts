import { Schema, models, model } from "mongoose";
import { LocalizedStringSchema, CURRENCIES, UNITS } from "@/lib/schemas/common";

const RFQItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    name: LocalizedStringSchema,
    quantity: { type: Number, required: true },
    unit: { type: String, enum: UNITS, default: "piece" },
    specifications: String,
    attributeRequirements: { type: Map, of: Schema.Types.Mixed },
    targetPrice: Number,
    deliveryDate: Date,
  },
  { _id: false }
);

const RFQSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    title: LocalizedStringSchema,
    description: LocalizedStringSchema,
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    productTypeId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    items: [RFQItemSchema],
    quantity: Number,
    targetPrice: Number,
    requirementAttributes: { type: Map, of: Schema.Types.Mixed },
    requiredCertifications: [String],
    inheritTemplateKey: String,
    deliveryDate: Date,
    deliveryLocation: {
      country: { type: String, default: "SA" },
      city: String,
      region: String,
      address: String,
    },
    budget: Number,
    currency: { type: String, enum: CURRENCIES, default: "SAR" },
    paymentTerms: String,
    incoterms: String,
    additionalRequirements: String,
    attachments: [{ type: Schema.Types.ObjectId, ref: "Document" }],
    status: {
      type: String,
      enum: ["draft", "open", "matching", "quoted", "negotiation", "awarded", "closed", "cancelled"],
      default: "draft",
      index: true,
    },
    deadline: Date,
    aiUnderstanding: {
      productHints: [String],
      categoryHints: [String],
      locationHints: [String],
      quantityHints: [String],
      raw: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const RFQ = models.RFQ || model("RFQ", RFQSchema);

const RFQVendorSchema = new Schema(
  {
    rfqId: { type: Schema.Types.ObjectId, ref: "RFQ", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    status: {
      type: String,
      // Journey 4 invite path: invited → viewed → quoted (+ clarifying) | declined | no_response
      enum: [
        "invited",
        "viewed",
        "accepted",
        "declined",
        "clarification",
        "quoted",
        "no_response",
      ],
      default: "invited",
    },
    matchReasons: [String],
    matchScore: Number,
    viewedAt: Date,
    lastReminderAt: Date,
    reminderCount: { type: Number, default: 0 },
    escalatedAt: Date,
  },
  { timestamps: true }
);

RFQVendorSchema.index({ rfqId: 1, vendorId: 1 }, { unique: true });
export const RFQVendor = models.RFQVendor || model("RFQVendor", RFQVendorSchema);

const QuotationSchema = new Schema(
  {
    rfqId: { type: Schema.Types.ObjectId, ref: "RFQ", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    lines: [
      {
        name: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
        notes: String,
      },
    ],
    currency: { type: String, enum: CURRENCIES, default: "SAR" },
    subtotal: Number,
    tax: Number,
    shipping: Number,
    total: Number,
    deliveryTime: String,
    leadTime: String,
    paymentTerms: String,
    validity: Date,
    warranty: String,
    notes: String,
    attachments: [{ type: Schema.Types.ObjectId, ref: "Document" }],
    /** Journey 4 quotation lifecycle */
    status: {
      type: String,
      enum: [
        "draft",
        "submitted", // Quoted
        "clarifying",
        "revised",
        "shortlisted",
        "accepted",
        "deal_confirmed",
        "reviewed",
        "rejected", // Declined by buyer
        "expired",
        "withdrawn",
      ],
      default: "draft",
      index: true,
    },
    /** Explicit VAT disclosure — quotes must state if 15% VAT included */
    vatIncluded: { type: Boolean, default: false },
    vatRate: { type: Number, default: 15 },
    vatDisclaimer: {
      type: String,
      default:
        "This quotation on Hukum is not a binding offer. Prices must state whether 15% VAT is included.",
    },
    lifecycle: {
      requirementAt: Date,
      invitedAt: Date,
      viewedAt: Date,
      quotedAt: Date,
      clarifyingAt: Date,
      revisedAt: Date,
      shortlistedAt: Date,
      acceptedAt: Date,
      dealConfirmedAt: Date,
      reviewedAt: Date,
    },
    revision: { type: Number, default: 1 },
    lastReminderAt: Date,
    reminderKeys: [String],
  },
  { timestamps: true }
);

export const Quotation = models.Quotation || model("Quotation", QuotationSchema);
