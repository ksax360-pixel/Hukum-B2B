import { Vendor } from "@/modules/vendors/vendor.model";
import { User } from "@/modules/users/user.model";
import type { SessionUser } from "@/lib/auth";

type ResolveOpts = {
  /** When true, create a draft vendor for vendor_* roles if nothing is linked. */
  createIfMissing?: boolean;
};

/**
 * Resolve the Vendor document for a seller session.
 * Handles stale JWT vendorId, missing user.vendorId, and ownerUserId mismatches.
 */
export async function resolveSellerVendor(session: SessionUser, opts: ResolveOpts = {}) {
  const tried = new Set<string>();

  async function byId(id?: string | null) {
    if (!id || tried.has(id)) return null;
    tried.add(id);
    return Vendor.findById(id).lean();
  }

  // 1) Session claim
  let vendor = await byId(session.vendorId);

  // 2) User record (source of truth)
  const user = await User.findById(session.id).select("vendorId email roles name").lean();
  if (!vendor && user?.vendorId) {
    vendor = await byId(String(user.vendorId));
  }

  // 3) Owned vendors
  if (!vendor) {
    vendor = await Vendor.findOne({ ownerUserId: session.id }).sort({ updatedAt: -1 }).lean();
  }

  // 4) Email match (demo / legacy rows)
  const email = String(session.email || user?.email || "")
    .trim()
    .toLowerCase();
  if (!vendor && email) {
    vendor = await Vendor.findOne({ email }).sort({ updatedAt: -1 }).lean();
  }

  // 5) Auto-provision draft vendor for seller roles (stops "Vendor profile not found")
  const roles = session.roles || [];
  const isSeller = roles.some((r) => String(r).startsWith("vendor"));
  if (!vendor && opts.createIfMissing !== false && isSeller) {
    const company = (user?.name || email.split("@")[0] || "My Company").trim();
    const slugBase = company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || `vendor-${String(session.id).slice(-6)}`;
    const created = await Vendor.create({
      ownerUserId: session.id,
      legalName: { en: company, ar: "" },
      tradeName: company,
      email: email || undefined,
      status: "draft",
      verificationStatus: "unverified",
      slug: { en: `${slugBase}-${Date.now().toString(36)}`, ar: "" },
      location: { country: "SA", city: "Riyadh" },
    });
    vendor = created.toObject();
  }

  // 6) Re-link user.vendorId when we found/created a vendor but user was stale
  if (vendor && user && String(user.vendorId || "") !== String(vendor._id)) {
    await User.updateOne({ _id: session.id }, { $set: { vendorId: vendor._id } }).catch(() => undefined);
  }

  return vendor;
}
