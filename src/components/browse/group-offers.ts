// src/components/browse/group-offers.ts
// Results show each item once: the same product from several suppliers collapses into one "offer group"
// (cheapest first), so buyers compare suppliers instead of scrolling past duplicates.
// ponytail: groups by normalised English name within one results page; replace with X360 offer records (D13).

import type { ProductLike, VendorLike } from "@/components/products/product-helpers";

export type Offer = ProductLike & { vendorId?: VendorLike | unknown };
export type OfferGroup = { key: string; offers: Offer[] };

export function offerKey(p: Offer): string {
  return String(p.name?.en || p.name?.ar || p._id)
    .toLowerCase()
    .replace(/\(demo\)/g, "")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();
}

/** Lead times are free text ("10-15 days"); the first number is good enough to find the fastest. */
export function leadDays(text?: string): number {
  const m = String(text || "").match(/\d+/);
  if (!m) return Infinity;
  const n = Number(m[0]);
  return /week/i.test(String(text)) ? n * 7 : n;
}

export function groupOffers(products: Offer[], sort?: "price"): OfferGroup[] {
  const map = new Map<string, Offer[]>();
  for (const p of products) {
    const k = offerKey(p);
    map.set(k, [...(map.get(k) || []), p]);
  }
  const groups = [...map].map(([key, offers]) => ({
    key,
    offers: [...offers].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)),
  }));
  return sort === "price"
    ? groups.sort((a, b) => (a.offers[0].price ?? Infinity) - (b.offers[0].price ?? Infinity))
    : groups;
}
