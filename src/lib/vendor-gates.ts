import { Vendor } from "@/modules/vendors/vendor.model";

type SessionLike = {
  vendorId?: string;
  roles?: string[];
};

function isAdmin(session: SessionLike) {
  return (session.roles || []).some((r) =>
    ["admin", "super_admin", "product_admin", "vendor_verification_admin"].includes(r)
  );
}

/**
 * Sellers must be verificationStatus=verified before catalog/activity mutations.
 * Admins bypass. Returns vendor when allowed; throws Error with status 403 when blocked.
 */
export async function requireVerifiedVendorForActivity(session: SessionLike) {
  if (isAdmin(session)) return null;
  if (!session.vendorId) {
    const err = new Error("Vendor account required") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  const vendor = await Vendor.findById(session.vendorId)
    .select("verificationStatus verificationRejectionReason legalName tradeName")
    .lean();
  if (!vendor) {
    const err = new Error("Vendor not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  if (vendor.verificationStatus === "verified") return vendor;

  const reason = String(vendor.verificationRejectionReason || "").trim();
  let message =
    "Company not verified yet. You cannot add products or submit seller activity until Super Admin approves your company.";
  if (vendor.verificationStatus === "rejected") {
    message = reason
      ? `Verification rejected: ${reason}. Fix the issues, re-upload documents if needed, then resubmit for approval.`
      : "Verification rejected. Fix company details/documents and resubmit for approval before adding products.";
  } else if (vendor.verificationStatus === "pending") {
    message =
      "Your company is waiting for Super Admin approval. Product creation and activity submit stay locked until verified.";
  } else if (vendor.verificationStatus === "suspended") {
    message = "Your seller account is suspended. Contact support.";
  }

  const err = new Error(message) as Error & { status?: number; code?: string };
  err.status = 403;
  err.code = "VENDOR_NOT_VERIFIED";
  throw err;
}
