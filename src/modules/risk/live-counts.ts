/**
 * Live marketplace counts only — never inflate or seed fake totals (risk C3).
 */

import { connectDB } from "@/lib/db";
import { Product } from "@/modules/products/product.model";
import { Vendor } from "@/modules/vendors/vendor.model";
import { RFQ } from "@/modules/rfqs/rfq.model";
import { User } from "@/modules/users/user.model";

export async function getLiveMarketplaceCounts() {
  await connectDB();
  const [products, vendorsVerified, vendorsTotal, rfqsOpen, buyers] = await Promise.all([
    Product.countDocuments({ status: { $in: ["published", "active", "approved"] } }),
    Vendor.countDocuments({ verificationStatus: "verified" }),
    Vendor.countDocuments({ status: { $nin: ["archived", "deleted"] } }),
    RFQ.countDocuments({ status: { $in: ["open", "matching", "quoted"] } }),
    User.countDocuments({ roles: "buyer", status: "active" }),
  ]);
  return {
    products,
    vendorsVerified,
    vendorsTotal,
    rfqsOpen,
    buyers,
    asOf: new Date().toISOString(),
    note: "Live MongoDB counts only — no demo inflation.",
  };
}

/** Badge rule: verified ONLY after admin verificationStatus === verified. */
export function isVendorVerifiedBadge(vendor?: { verificationStatus?: string } | null) {
  return vendor?.verificationStatus === "verified";
}
