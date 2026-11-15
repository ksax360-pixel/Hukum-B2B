import { Schema, models, model } from "mongoose";

const PhoneOtpSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, default: "product_interest", index: true },
    productId: { type: String, default: "" },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

PhoneOtpSchema.index({ phone: 1, purpose: 1, productId: 1 });

export const PhoneOtp = models.PhoneOtp || model("PhoneOtp", PhoneOtpSchema);
