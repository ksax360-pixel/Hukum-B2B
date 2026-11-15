import mongoose, { Schema, models, model, InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "" },
    mobile: { type: String, default: "" },
    preferredLanguage: { type: String, enum: ["en", "ar"], default: "en" },
    roles: { type: [String], default: ["buyer"] },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    emailVerified: { type: Boolean, default: false },
    mobileVerified: { type: Boolean, default: false },
    resetToken: String,
    resetTokenExpires: Date,
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };
export const User = models.User || model("User", UserSchema);
