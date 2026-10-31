import { Schema, models, model } from "mongoose";
import { LocalizedStringSchema } from "@/lib/schemas/common";

const OrganizationSchema = new Schema(
  {
    name: LocalizedStringSchema,
    type: { type: String, enum: ["company", "enterprise", "government", "other"], default: "company" },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["admin", "procurement_manager", "procurement_executive", "finance", "operations", "management", "viewer"],
          default: "viewer",
        },
      },
    ],
    industryId: { type: Schema.Types.ObjectId, ref: "Industry" },
    city: String,
    country: { type: String, default: "SA" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Organization = models.Organization || model("Organization", OrganizationSchema);

const BuyerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    type: { type: String, enum: ["individual", "company", "procurement", "enterprise"], default: "company" },
    company: String,
    position: String,
    department: String,
    industryId: { type: Schema.Types.ObjectId, ref: "Industry" },
    city: String,
    country: { type: String, default: "SA" },
    procurementInterests: [String],
    /** Risk H4 — verified-buyer status before high-volume reveals. */
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
      index: true,
    },
    crNumber: String,
    vatNumber: String,
  },
  { timestamps: true }
);

export const Buyer = models.Buyer || model("Buyer", BuyerSchema);
