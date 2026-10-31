import type { SearchFilters } from "@/modules/search/search.engine";
import { Vendor } from "@/modules/vendors/vendor.model";
import { Product } from "@/modules/products/product.model";

export type MatchCandidate = {
  vendorId: string;
  reasons: string[];
  score: number;
};

/** Minimum relevance: verified alone must never qualify. Category/product match ≈ 30+. */
export const MIN_MATCH_SCORE = 30;

/**
 * Vendor matching returns factual reasons. Score is internal only — never present as a guarantee.
 * Only sellers with category/product relevance (score ≥ MIN_MATCH_SCORE) are invited.
 */
export async function matchVendorsForRfq(input: {
  categoryId?: string;
  industryId?: string;
  city?: string;
  quantity?: number;
  requiredCertifications?: string[];
  textHints?: string[];
  productId?: string;
  preferredVendorId?: string;
}): Promise<MatchCandidate[]> {
  let categoryId = input.categoryId ? String(input.categoryId) : "";
  let preferredVendorId = input.preferredVendorId ? String(input.preferredVendorId) : "";

  if (input.productId) {
    const product = await Product.findById(input.productId)
      .select("categoryId vendorId name")
      .lean();
    if (product) {
      if (!categoryId && product.categoryId) categoryId = String(product.categoryId);
      if (!preferredVendorId && product.vendorId) preferredVendorId = String(product.vendorId);
    }
  }

  // Without a category (or preferred vendor), do not broadcast to every verified seller.
  if (!categoryId && !preferredVendorId && !(input.textHints && input.textHints.length)) {
    return [];
  }

  const vendorQuery: Record<string, unknown> = {
    verificationStatus: { $in: ["verified", "pending"] },
    status: { $nin: ["rejected", "suspended", "expired"] },
  };

  // Prefer category-scoped candidate set when we have one.
  if (categoryId) {
    const productVendorIds = await Product.distinct("vendorId", {
      categoryId,
      status: { $in: ["published", "approved", "active"] },
    });
    vendorQuery.$or = [
      { categories: categoryId },
      { _id: { $in: productVendorIds } },
      ...(preferredVendorId ? [{ _id: preferredVendorId }] : []),
    ];
  } else if (preferredVendorId) {
    vendorQuery._id = preferredVendorId;
  }

  if (input.industryId) vendorQuery.industries = input.industryId;

  const vendors = await Vendor.find(vendorQuery).limit(80).lean();
  const results: MatchCandidate[] = [];

  for (const v of vendors) {
    const reasons: string[] = [];
    let score = 0;
    let hasRelevance = false;

    const catMatch =
      categoryId &&
      (v.categories || []).some((c: unknown) => String(c) === String(categoryId));
    if (catMatch) {
      reasons.push("Supports requested category");
      score += 30;
      hasRelevance = true;
    }

    if (input.industryId && (v.industries || []).some((i: unknown) => String(i) === String(input.industryId))) {
      reasons.push("Operates in requested industry");
      score += 15;
      hasRelevance = true;
    }

    if (input.city && v.citiesServed?.some((c: string) => c.toLowerCase().includes(input.city!.toLowerCase()))) {
      reasons.push(`Serves ${input.city}`);
      score += 20;
    } else if (input.city && v.location?.city?.toLowerCase() === input.city.toLowerCase()) {
      reasons.push(`Based in ${input.city}`);
      score += 15;
    }

    // Verification is a bonus only — never enough on its own to invite.
    if (v.verificationStatus === "verified") {
      score += 10;
    }

    if (input.requiredCertifications?.length) {
      const has = input.requiredCertifications.filter((c: string) =>
        (v.certifications || []).some((vc: string) => vc.toLowerCase().includes(c.toLowerCase()))
      );
      if (has.length) {
        reasons.push(`Has certification: ${has.join(", ")}`);
        score += 15;
        hasRelevance = true;
      }
    }

    if (input.quantity && v.moq) {
      const moqNum = parseInt(String(v.moq).replace(/\D/g, ""), 10);
      if (!Number.isNaN(moqNum) && moqNum <= input.quantity) {
        reasons.push("Supports requested quantity");
        score += 10;
      }
    }

    const productCount = await Product.countDocuments({
      vendorId: v._id,
      status: { $in: ["published", "approved", "active"] },
      ...(categoryId ? { categoryId } : {}),
    });
    if (productCount > 0 && categoryId) {
      reasons.push("Has published products in this category");
      score += 25;
      hasRelevance = true;
    }

    if (preferredVendorId && String(v._id) === preferredVendorId) {
      reasons.push("Preferred supplier from product request");
      score += 40;
      hasRelevance = true;
    }

    if (input.textHints?.length && !categoryId) {
      const hintRe = input.textHints
        .map((h) => h.trim())
        .filter(Boolean)
        .slice(0, 5)
        .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      if (hintRe.length) {
        const hintHits = await Product.countDocuments({
          vendorId: v._id,
          status: { $in: ["published", "approved", "active"] },
          $or: hintRe.flatMap((h) => [
            { "name.en": new RegExp(h, "i") },
            { "name.ar": new RegExp(h, "i") },
          ]),
        });
        if (hintHits > 0) {
          reasons.push("Products match request keywords");
          score += 30;
          hasRelevance = true;
        }
      }
    }

    if (v.verificationStatus === "verified" && hasRelevance) {
      reasons.push("Verified vendor");
    }

    if (hasRelevance && score >= MIN_MATCH_SCORE) {
      results.push({ vendorId: String(v._id), reasons, score });
    }
  }

  // Always include preferred vendor if resolvable, even if outside category query miss.
  if (preferredVendorId && !results.some((r) => r.vendorId === preferredVendorId)) {
    const pref = await Vendor.findById(preferredVendorId)
      .select("_id verificationStatus status")
      .lean();
    if (
      pref &&
      !["rejected", "suspended", "expired"].includes(String(pref.status || "")) &&
      ["verified", "pending"].includes(String(pref.verificationStatus || ""))
    ) {
      results.push({
        vendorId: preferredVendorId,
        reasons: ["Preferred supplier from product request"],
        score: 40,
      });
    }
  }

  const hour = new Date().getUTCHours();
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ha = hashId(a.vendorId);
    const hb = hashId(b.vendorId);
    return ((ha + hour) % 97) - ((hb + hour) % 97);
  });

  return results.slice(0, 20).map((r, i) => ({
    ...r,
    reasons:
      i > 0 && results[i - 1]?.score === r.score
        ? [...r.reasons, "Fair rotation among equal-score matches"]
        : r.reasons,
  }));
}

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function parseSearchParams(sp: URLSearchParams): SearchFilters {
  const attributes: Record<string, string> = {};
  sp.forEach((value, key) => {
    if (key.startsWith("attr.")) attributes[key.slice(5)] = value;
  });
  return {
    q: sp.get("q") || undefined,
    industryId: sp.get("industryId") || undefined,
    categoryId: sp.get("categoryId") || undefined,
    vendorId: sp.get("vendorId") || undefined,
    city: sp.get("city") || undefined,
    brand: sp.get("brand") || undefined,
    minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    verified: sp.get("verified") === "true",
    attributes: Object.keys(attributes).length ? attributes : undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 20,
    locale: sp.get("locale") || "en",
  };
}
