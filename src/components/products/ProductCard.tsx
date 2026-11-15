"use client";

import Link from "next/link";
import { track } from "@/lib/track-client";
import type { Locale } from "@/i18n/config";
import { t as loc } from "@/lib/utils";
import {
  formatPrice,
  mediaList,
  productSlug,
  toneForId,
  type ProductLike,
  type VendorLike,
} from "./product-helpers";

export function ProductCard({
  locale,
  product,
  vendor,
  categoryLabel,
  industryLabel,
  source = "listing",
}: {
  locale: Locale;
  product: ProductLike;
  vendor?: VendorLike | null;
  categoryLabel?: string;
  industryLabel?: string;
  source?: string;
}) {
  const isAr = locale === "ar";
  const id = String(product._id);
  const slug = productSlug(product);
  const href = `/${locale}/products/${slug}`;
  const images = mediaList(product);
  const primary = images[0];
  const price = formatPrice(product, locale);
  const vendorId = vendor?._id ? String(vendor._id) : undefined;
  const vendorName = vendor ? loc(locale, vendor.legalName) || vendor.tradeName || "" : "";
  const sector = industryLabel || categoryLabel || "";
  const name = loc(locale, product.name);

  const onClick = () => {
    void track({
      type: "product_click",
      productId: id,
      vendorId,
      meta: { source, slug, interaction: "card" },
    });
  };

  return (
    <article className="kt-pcard">
      <Link href={href} className="kt-pcard__media" onClick={onClick} aria-label={name}>
        {primary?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.url} alt={loc(locale, primary.alt) || name} className="kt-pcard__img" />
        ) : (
          <div className="kt-pcard__placeholder" style={{ background: toneForId(id) }}>
            <span>{(name || "KT").slice(0, 1).toUpperCase()}</span>
          </div>
        )}

        {sector ? <span className="kt-pcard__sector">{sector}</span> : null}

        <span className="kt-pcard__price-pill">{price.label}</span>
      </Link>

      <div className="kt-pcard__body">
        {product.brand ? <p className="kt-pcard__brand">{product.brand}</p> : null}

        <Link href={href} onClick={onClick} className="kt-pcard__title">
          {name}
        </Link>

        {vendorName ? (
          <p className="kt-pcard__vendor-line">
            <span className="kt-pcard__vendor-name">{vendorName}</span>
            {vendor?.verificationStatus === "verified" ? (
              <span className="kt-pcard__verified">{isAr ? "موثّق" : "Verified"}</span>
            ) : null}
          </p>
        ) : null}
      </div>
    </article>
  );
}
