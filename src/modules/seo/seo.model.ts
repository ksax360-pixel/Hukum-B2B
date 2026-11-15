import { Schema, models, model } from "mongoose";
import { LocalizedStringSchema } from "@/lib/schemas/common";

const SeoTemplateSchema = new Schema(
  {
    key: { type: String, unique: true, required: true },
    entityType: {
      type: String,
      enum: [
        "product",
        "category",
        "vendor",
        "manufacturer",
        "brand",
        "industry",
        "location",
        "application",
        "article",
        "page",
      ],
      index: true,
    },
    titleTemplate: LocalizedStringSchema,
    descriptionTemplate: LocalizedStringSchema,
    h1Template: LocalizedStringSchema,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SeoTemplate = models.SeoTemplate || model("SeoTemplate", SeoTemplateSchema);

const SeoRedirectSchema = new Schema(
  {
    fromPath: { type: String, required: true, index: true },
    toPath: { type: String, required: true },
    type: { type: Number, enum: [301, 302], default: 301 },
    entityType: String,
    entityId: String,
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    createdBy: String,
  },
  { timestamps: true }
);

SeoRedirectSchema.index({ fromPath: 1, status: 1 });

export const SeoRedirect = models.SeoRedirect || model("SeoRedirect", SeoRedirectSchema);

const SeoChangeLogSchema = new Schema(
  {
    entityType: String,
    entityId: String,
    field: String,
    previousValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    source: { type: String, enum: ["ai", "manual", "template", "system"], default: "manual" },
    userId: String,
    reason: String,
  },
  { timestamps: true }
);

export const SeoChangeLog = models.SeoChangeLog || model("SeoChangeLog", SeoChangeLogSchema);

const SeoSettingsSchema = new Schema(
  {
    key: { type: String, unique: true },
    robotsTxt: { type: String, default: "" },
    siteName: { type: String, default: "Hukum" },
    defaultOgImage: { type: String, default: "/og/hukum-share.jpg" },
    indexNowKey: String,
    allowPublicIndex: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SeoSettings = models.SeoSettings || model("SeoSettings", SeoSettingsSchema);
