import { Schema, models, model, type InferSchemaType } from "mongoose";

const NeedSchema = new Schema(
  {
    category: String,
    specs: String,
    quantity: Number,
    unit: String,
    city: String,
    deadline: String,
    rawText: String,
    confidence: Number,
  },
  { _id: false }
);

const ShortlistSchema = new Schema(
  {
    productId: String,
    vendorId: String,
    name: String,
    slug: String,
    href: String,
    priceLabel: String,
    vendorName: String,
    city: String,
    verified: Boolean,
    score: Number,
    paidPriority: Boolean,
  },
  { _id: false }
);

const PendingOutboundSchema = new Schema(
  {
    id: String,
    vendorIds: [String],
    productIds: [String],
    draftMessage: String,
    status: {
      type: String,
      enum: ["awaiting_buyer_approval", "approved", "sent", "cancelled"],
      default: "awaiting_buyer_approval",
    },
    createdAt: String,
  },
  { _id: false }
);

const HukumSessionSchema = new Schema(
  {
    channel: { type: String, enum: ["web", "whatsapp", "qr"], default: "web", index: true },
    locale: { type: String, enum: ["en", "ar"], default: "en" },
    step: {
      type: String,
      enum: [
        "start",
        "identify",
        "understand",
        "clarify",
        "shortlist",
        "compare",
        "contact",
        "collect_quotes",
        "recommend",
        "decide",
        "escalated",
      ],
      default: "start",
      index: true,
    },
    /** WhatsApp / verified phone E.164 */
    phone: { type: String, index: true },
    phoneVerified: { type: Boolean, default: false },
    pdplConsent: { type: Boolean, default: false },
    pdplConsentAt: Date,
    name: String,
    company: String,
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    waId: { type: String, index: true },
    need: NeedSchema,
    shortlist: [ShortlistSchema],
    selectedProductIds: [String],
    pendingOutbound: PendingOutboundSchema,
    quotationIds: [String],
    revealCountToday: { type: Number, default: 0 },
    revealDayKey: String,
    lastWaInboundAt: Date,
    escalated: { type: Boolean, default: false },
    escalateReason: String,
    supportTicketId: { type: Schema.Types.ObjectId, ref: "SupportTicket" },
    supportConversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    /** WhatsApp marketing / sync opt-out */
    waOptOut: { type: Boolean, default: false },
    waOptOutAt: Date,
    memoryClearedAt: Date,
    history: [
      {
        role: { type: String, enum: ["user", "assistant", "system"] },
        content: String,
        at: { type: Date, default: Date.now },
      },
    ],
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

HukumSessionSchema.index({ updatedAt: -1 });

export type HukumSessionDoc = InferSchemaType<typeof HukumSessionSchema> & { _id: unknown };

export const HukumSession =
  models.HukumSession || model("HukumSession", HukumSessionSchema);
