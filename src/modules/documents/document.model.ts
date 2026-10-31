import { Schema, models, model } from "mongoose";
import { DOCUMENT_TYPES } from "@/lib/schemas/common";

const DocumentSchema = new Schema(
  {
    ownerType: { type: String, enum: ["vendor", "product", "rfq", "quotation", "user", "organization"], required: true },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      default: "other",
    },
    documentCode: String,
    name: String,
    fileUrl: { type: String, required: true },
    mimeType: String,
    size: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    expiryDate: Date,
    status: { type: String, enum: ["active", "expired", "archived"], default: "active" },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs_revision"],
      default: "pending",
    },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    source: {
      type: String,
      enum: ["upload", "ai_extracted", "vendor", "admin", "import", "api"],
      default: "upload",
    },
    version: { type: Number, default: 1 },
    visibility: { type: String, enum: ["private", "admin", "public"], default: "private" },
  },
  { timestamps: true }
);

export const Document = models.Document || model("Document", DocumentSchema);

const VerificationSchema = new Schema(
  {
    entityType: { type: String, enum: ["vendor", "product"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    status: {
      type: String,
      enum: [
        "submitted",
        "ai_processing",
        "documents_review",
        "information_review",
        "manual_review",
        "approved",
        "rejected",
        "needs_correction",
        "suspended",
        "expired",
      ],
      default: "submitted",
    },
    steps: [{ name: String, status: String, at: Date, by: Schema.Types.ObjectId }],
    notes: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Verification = models.Verification || model("Verification", VerificationSchema);

const AuditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: String,
    entity: String,
    entityId: String,
    previousValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: true }
);

export const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);
