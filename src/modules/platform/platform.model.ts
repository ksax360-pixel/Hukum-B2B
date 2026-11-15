import { Schema, models, model } from "mongoose";
import { LocalizedStringSchema } from "@/lib/schemas/common";

const ConversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
    rfqId: { type: Schema.Types.ObjectId, ref: "RFQ" },
    quotationId: { type: Schema.Types.ObjectId, ref: "Quotation" },
    /** One thread per supplier per need (buyer–supplier). */
    needKey: { type: String, index: true },
    subject: String,
    /** Hukum inbox: AI assistant | buyer–supplier | human support */
    threadType: {
      type: String,
      enum: ["ai_assistant", "buyer_supplier", "support"],
      default: "buyer_supplier",
      index: true,
    },
    status: { type: String, enum: ["open", "closed", "archived"], default: "open" },
    /** Contact Gate — raw contacts only after mutual accept / reveal */
    contactGate: {
      contactsShared: { type: Boolean, default: false },
      sharedAt: Date,
      sharedBy: { type: Schema.Types.ObjectId, ref: "User" },
      mode: { type: String, enum: ["relay", "revealed"], default: "relay" },
    },
    whatsapp: {
      linkedPhone: String,
      lastSyncedAt: Date,
      optOut: { type: Boolean, default: false },
      optOutAt: Date,
    },
    typing: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        at: Date,
      },
    ],
    /** Support SLA (shown on Hukum support threads) */
    sla: {
      dueAt: Date,
      status: { type: String, enum: ["ok", "at_risk", "breached", "met"], default: "ok" },
      assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
      handedOverFrom: { type: Schema.Types.ObjectId, ref: "User" },
      handedOverTo: { type: Schema.Types.ObjectId, ref: "User" },
      handedOverAt: Date,
      ticketId: { type: Schema.Types.ObjectId, ref: "SupportTicket" },
      hukumSessionId: { type: Schema.Types.ObjectId, ref: "HukumSession" },
    },
    lastMessageAt: Date,
    lastMessagePreview: String,
    retentionUntil: Date,
  },
  { timestamps: true }
);
ConversationSchema.index({ participants: 1, vendorId: 1, needKey: 1, threadType: 1 });

export const Conversation = models.Conversation || model("Conversation", ConversationSchema);

const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    /** system / hukum bot may omit sender */
    senderRole: { type: String, enum: ["user", "hukum", "system", "support"], default: "user" },
    body: { type: String, required: true },
    bodyTranslated: String,
    bodySourceLocale: { type: String, enum: ["en", "ar", "und"], default: "und" },
    kind: {
      type: String,
      enum: ["text", "quote_card", "system", "file", "voice"],
      default: "text",
    },
    channel: { type: String, enum: ["in_app", "whatsapp", "web"], default: "in_app" },
    attachments: [
      {
        url: String,
        name: String,
        mime: String,
        size: Number,
        scanStatus: {
          type: String,
          enum: ["pending", "clean", "blocked", "skipped"],
          default: "pending",
        },
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    waMessageId: { type: String, index: true },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed"],
      default: "sent",
    },
    moderationStatus: {
      type: String,
      enum: ["ok", "flagged", "blocked"],
      default: "ok",
    },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Message = models.Message || model("Message", MessageSchema);

const InboxBlockSchema = new Schema(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    blockedUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    blockedVendorId: { type: Schema.Types.ObjectId, ref: "Vendor", index: true },
    reason: String,
  },
  { timestamps: true }
);
InboxBlockSchema.index({ blockerId: 1, blockedUserId: 1 });
export const InboxBlock = models.InboxBlock || model("InboxBlock", InboxBlockSchema);

const MessageReportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    reason: { type: String, required: true },
    status: { type: String, enum: ["open", "reviewed", "actioned"], default: "open" },
  },
  { timestamps: true }
);
export const MessageReport = models.MessageReport || model("MessageReport", MessageReportSchema);

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: String,
    title: LocalizedStringSchema,
    body: LocalizedStringSchema,
    channel: { type: String, enum: ["in_app", "email", "sms", "whatsapp", "push"], default: "in_app" },
    read: { type: Boolean, default: false },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Notification = models.Notification || model("Notification", NotificationSchema);

const AIExtractionSchema = new Schema(
  {
    type: { type: String, enum: ["product", "vendor", "rfq", "document"], required: true },
    sourceDocumentId: { type: Schema.Types.ObjectId, ref: "Document" },
    sourceUrl: String,
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "needs_review"],
      default: "queued",
    },
    stages: [{ name: String, status: String, at: Date }],
    extracted: Schema.Types.Mixed,
    confidence: Number,
    duplicates: [Schema.Types.Mixed],
    errorMessages: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
  },
  { timestamps: true }
);

export const AIExtraction = models.AIExtraction || model("AIExtraction", AIExtractionSchema);

const PromptTemplateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    name: String,
    prompt: { type: String, required: true },
    version: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const PromptTemplate = models.PromptTemplate || model("PromptTemplate", PromptTemplateSchema);

const SubscriptionPlanSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    name: LocalizedStringSchema,
    price: Number,
    currency: { type: String, default: "SAR" },
    billingPeriod: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    features: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const SubscriptionPlan = models.SubscriptionPlan || model("SubscriptionPlan", SubscriptionPlanSchema);

const PaymentSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
    subscriptionPlanId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    amount: Number,
    currency: { type: String, default: "SAR" },
    provider: String,
    providerRef: String,
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Payment = models.Payment || model("Payment", PaymentSchema);

const InvoiceSchema = new Schema(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    number: String,
    amount: Number,
    currency: String,
    status: { type: String, enum: ["draft", "issued", "paid", "void"], default: "draft" },
    lines: [{ description: String, amount: Number }],
  },
  { timestamps: true }
);

export const Invoice = models.Invoice || model("Invoice", InvoiceSchema);

const ReviewSchema = new Schema(
  {
    targetType: { type: String, enum: ["vendor", "product"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    verifiedTransaction: { type: Boolean, default: false },
    moderationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const Review = models.Review || model("Review", ReviewSchema);

const SavedProductSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);
SavedProductSchema.index({ userId: 1, productId: 1 }, { unique: true });
export const SavedProduct = models.SavedProduct || model("SavedProduct", SavedProductSchema);

const SavedVendorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
  },
  { timestamps: true }
);
SavedVendorSchema.index({ userId: 1, vendorId: 1 }, { unique: true });
export const SavedVendor = models.SavedVendor || model("SavedVendor", SavedVendorSchema);

const SearchHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    query: String,
    locale: String,
    filters: Schema.Types.Mixed,
    resultsCount: Number,
  },
  { timestamps: true }
);

export const SearchHistory = models.SearchHistory || model("SearchHistory", SearchHistorySchema);

const AnalyticsEventSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const AnalyticsEvent = models.AnalyticsEvent || model("AnalyticsEvent", AnalyticsEventSchema);

const LocationSchema = new Schema(
  {
    country: { type: String, default: "SA" },
    region: LocalizedStringSchema,
    city: LocalizedStringSchema,
    district: LocalizedStringSchema,
    code: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Location = models.Location || model("Location", LocationSchema);

const CMSPageSchema = new Schema(
  {
    type: { type: String, enum: ["page", "blog", "faq", "banner", "landing"], default: "page" },
    title: LocalizedStringSchema,
    slug: LocalizedStringSchema,
    body: LocalizedStringSchema,
    excerpt: LocalizedStringSchema,
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    seo: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const CMSPage = models.CMSPage || model("CMSPage", CMSPageSchema);

const SystemSettingSchema = new Schema(
  {
    key: { type: String, unique: true, required: true },
    value: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const SystemSetting = models.SystemSetting || model("SystemSetting", SystemSettingSchema);

const SupportTicketSchema = new Schema(
  {
    ticketKey: { type: String, unique: true, required: true, index: true },
    topic: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },
    urgency: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    requester: { type: String, default: "" },
    category: { type: String, default: "General" },
    body: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    roleScope: { type: String, enum: ["admin", "vendor", "buyer"], default: "admin" },
    /** Hukum support thread + SLA */
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    hukumSessionId: { type: Schema.Types.ObjectId, ref: "HukumSession" },
    slaDueAt: Date,
    slaBreached: { type: Boolean, default: false },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    handedOverFrom: { type: Schema.Types.ObjectId, ref: "User" },
    handedOverTo: { type: Schema.Types.ObjectId, ref: "User" },
    handedOverAt: Date,
    contextSnapshot: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const SupportTicket =
  models.SupportTicket || model("SupportTicket", SupportTicketSchema);
