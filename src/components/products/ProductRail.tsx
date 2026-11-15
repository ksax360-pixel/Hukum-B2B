"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ProductCard } from "./ProductCard";
import { VendorProductCard } from "./VendorProductCard";
import type { ProductLike, VendorLike } from "./product-helpers";

export function ProductRail({
  locale,
  items,
  source,
  label,
  variant = "default",
}: {
  locale: Locale;
  items: Array<ProductLike & { vendorId?: VendorLike }>;
  source: string;
  label?: string;
  /** `vendor-more` = slim cards for “More from this vendor” only */
  variant?: "default" | "vendor-more";
}) {
  const ref = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  const scroll = (dir: -1 | 1) => {
    const rtl = locale === "ar";
    ref.current?.scrollBy({ left: dir * (rtl ? -280 : 280), behavior: "smooth" });
  };

  return (
    <div
      className={`kt-product-rail${variant === "vendor-more" ? " kt-product-rail--vendor-more" : ""}`}
      aria-label={label}
    >
      <button type="button" className="kt-product-rail__nav kt-product-rail__nav--prev" onClick={() => scroll(-1)} aria-label={locale === "ar" ? "تمرير" : "Scroll"}>
        {locale === "ar" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
      <div className="kt-product-rail__track" ref={ref}>
        {items.map((p) => (
          <div key={String(p._id)} className="kt-product-rail__item">
            {variant === "vendor-more" ? (
              <VendorProductCard
                locale={locale}
                product={p}
                vendorId={
                  p.vendorId && typeof p.vendorId === "object" && "_id" in p.vendorId
                    ? String((p.vendorId as VendorLike)._id)
                    : undefined
                }
                source={source}
              />
            ) : (
              <ProductCard locale={locale} product={p} vendor={p.vendorId as VendorLike} source={source} />
            )}
          </div>
        ))}
      </div>
      <button type="button" className="kt-product-rail__nav kt-product-rail__nav--next" onClick={() => scroll(1)} aria-label={locale === "ar" ? "تمرير" : "Scroll"}>
        {locale === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </div>
  );
}
