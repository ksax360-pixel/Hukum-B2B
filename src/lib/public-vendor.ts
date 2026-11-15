const PUBLIC_VENDOR_KEYS = [
  "_id",
  "legalName",
  "tradeName",
  "slug",
  "verificationStatus",
  "logo",
  "coverImage",
  "description",
  "companyType",
  "certifications",
  "location",
  "citiesServed",
  "marketsServed",
  "exportMarkets",
  "capabilities",
  "moq",
  "leadTime",
  "paymentTerms",
  "yearEstablished",
  "featured",
  "createdAt",
  "legal",
  "storefront",
] as const;

/** Contact channels — never in anonymous page source or public API payloads. */
const CONTACT_KEYS = ["phone", "email", "whatsapp", "website", "crNumber", "vatNumber"] as const;

function publicLocation(loc: unknown) {
  if (!loc || typeof loc !== "object") return loc;
  const o = loc as Record<string, unknown>;
  return {
    city: o.city || "",
    region: o.region || "",
    country: o.country || "SA",
    // Street address stays gated with contacts
  };
}

/** Strip sensitive contact fields from vendor objects for anonymous public pages. */
export function stripVendorContacts<T extends Record<string, unknown>>(vendor: T | null | undefined): T | null {
  if (!vendor) return null;
  const hasContact = Boolean(
    vendor.phone || vendor.email || vendor.whatsapp || vendor.website
  );
  const next: Record<string, unknown> = { hasContact };
  for (const key of PUBLIC_VENDOR_KEYS) {
    if (key in vendor && vendor[key] !== undefined) {
      next[key] = key === "location" ? publicLocation(vendor[key]) : vendor[key];
    }
  }
  for (const key of CONTACT_KEYS) {
    delete next[key];
  }
  // Public visitors only see the approved (published) storefront design — never pending drafts.
  const sf = next.storefront as { published?: unknown } | undefined;
  if (sf && typeof sf === "object") {
    next.storefront = { published: sf.published || null, status: "approved" };
  }
  return next as T;
}

export function vendorHasContact(vendor: {
  phone?: string;
  email?: string;
  whatsapp?: string;
  website?: string;
  hasContact?: boolean;
} | null | undefined) {
  if (!vendor) return false;
  if (vendor.hasContact) return true;
  return Boolean(vendor.phone || vendor.email || vendor.whatsapp || vendor.website);
}

/** Map a list of vendors for anonymous public responses. */
export function stripVendorList<T extends Record<string, unknown>>(items: T[]): T[] {
  return items.map((v) => stripVendorContacts(v) as T).filter(Boolean);
}
