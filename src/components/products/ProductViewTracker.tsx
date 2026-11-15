"use client";

import { useEffect } from "react";
import { pushRecentlyViewed, track } from "@/lib/track-client";

export function ProductViewTracker({
  productId,
  vendorId,
  slug,
  name,
  brand,
  image,
  locale,
  category,
}: {
  productId: string;
  vendorId?: string;
  slug: string;
  name: string;
  brand?: string;
  image?: string;
  locale: string;
  category?: string;
}) {
  useEffect(() => {
    void track({
      type: "product_view",
      productId,
      vendorId,
      meta: { slug, category, source: "product_detail" },
    });
    pushRecentlyViewed({ id: productId, slug, name, brand, image, locale });
  }, [productId, vendorId, slug, name, brand, image, locale, category]);

  return null;
}
