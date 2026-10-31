"use client";

import Link from "next/link";
import { track } from "@/lib/track-client";
import type { Locale } from "@/i18n/config";
import { t as loc } from "@/lib/utils";
import { mediaList, productSlug, toneForId, type ProductLike } from "./product-helpers";

/** Compact card for “More from this vendor” — product only, no vendor/price clutter. */
export function VendorProductCard({
  locale,
  product,
  vendorId,
  source = "vendor_products",
}: {
  locale: Locale;
  product: ProductLike;
  vendorId?: string;
  source?: string;
}) {
  const isAr = locale === "ar";
  const id = String(product._id);
  const slug = productSlug(product);
  const href = `/${locale}/products/${slug}`;
  const images = mediaList(product);
  const primary = images[0];
  const name = loc(locale, product.name);

  const onClick = () => {
    void track({
      type: "product_click",
      productId: id,
      vendorId,
      meta: { source, slug, interaction: "vendor_more_card" },
    });
  };

  return (
    <article className="kt-vpcard">
      <Link href={href} className="kt-vpcard__media" onClick={onClick} aria-label={name}>
        {primary?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.url} alt={loc(locale, primary.alt) || name} className="kt-vpcard__img" />
        ) : (
          <div className="kt-vpcard__placeholder" style={{ background: toneForId(id) }}>
            <span>{(name || "KT").slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </Link>
      <div className="kt-vpcard__body">
        {product.brand ? <p className="kt-vpcard__brand">{product.brand}</p> : null}
        <Link href={href} onClick={onClick} className="kt-vpcard__title">
          {name}
        </Link>
        <span className="kt-vpcard__hint">{isAr ? "عرض" : "View"}</span>
      </div>
    </article>
  );
}
