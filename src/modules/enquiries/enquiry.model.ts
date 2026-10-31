import { Schema, models, model } from "mongoose";

const EnquirySchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    enquiryType: {
      type: String,
      enum: ["general", "buyer", "supplier", "partnership", "support", "media", "other"],
      required: true,
      index: true,
    },
    fullName: { type: String, required: true },
    companyName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, default: "" },
    country: { type: String, default: "" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    /** Extra fields based on enquiry type */
    extras: { type: Schema.Types.Mixed, default: {} },
    attachmentMeta: {
      name: String,
      size: Number,
      type: String,
    },
    locale: { type: String, default: "en" },
    status: {
      type: String,
      enum: ["new", "reviewing", "replied", "closed", "spam"],
      default: "new",
      index: true,
    },
    source: { type: String, default: "contact_page" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Enquiry = models.Enquiry || model("Enquiry", EnquirySchema);
