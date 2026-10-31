"use client";

import type { Locale } from "@/i18n/config";
import { VendorOfferCard } from "./VendorOfferCard";
import type { ProductLike, VendorLike } from "./product-helpers";

/** Full-width grid of other-vendor offers (larger than “More from this vendor”). */
export function VendorOfferRail({
  locale,
  items,
  source,
  label,
}: {
  locale: Locale;
  items: Array<ProductLike & { vendorId?: VendorLike }>;
  source: string;
  label?: string;
}) {
  if (!items.length) return null;

  return (
    <div className="kt-voffer-grid" aria-label={label}>
      {items.map((p) => (
        <VendorOfferCard
          key={String(p._id)}
          locale={locale}
          product={p}
          vendor={p.vendorId as VendorLike}
          source={source}
        />
      ))}
    </div>
  );
}
