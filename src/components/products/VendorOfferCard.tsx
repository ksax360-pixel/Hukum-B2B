"use client";

import Link from "next/link";
import { MapPin, BadgeCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t as loc } from "@/lib/utils";
import {
  formatPrice,
  mediaList,
  productSlug,
  toneForId,
  vendorLogoUrl,
  type ProductLike,
  type VendorLike,
} from "./product-helpers";

/** Larger comparison card — same/similar product from another vendor. */
export function VendorOfferCard({
  locale,
  product,
  vendor,
  source = "same_product_vendors",
}: {
  locale: Locale;
  product: ProductLike;
  vendor?: VendorLike | null;
  source?: string;
}) {
  const isAr = locale === "ar";
  const id = String(product._id);
  const slug = productSlug(product);
  const href = `/${locale}/products/${slug}`;
  const images = mediaList(product);
  const primary = images[0];
  const price = formatPrice(product, locale);
  const productName = loc(locale, product.name);
  const vendorName = vendor ? loc(locale, vendor.legalName) || vendor.tradeName || "" : "";
  const city = vendor?.location?.city || "";
  const country = vendor?.location?.country || "";
  const place = [city, country].filter(Boolean).join(", ");

  return (
    <article className="kt-voffer">
      <Link href={href} className="kt-voffer__media" aria-label={productName} data-source={source}>
        {primary?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.url} alt="" className="kt-voffer__img" />
        ) : (
          <div className="kt-voffer__placeholder" style={{ background: toneForId(id) }}>
            <span>{(productName || "KT").slice(0, 1).toUpperCase()}</span>
          </div>
        )}
        <span className="kt-voffer__tag">{isAr ? "مورد بديل" : "Other vendor"}</span>
      </Link>

      <div className="kt-voffer__body">
        <div className="kt-voffer__vendor">
          <span className="kt-voffer__mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={vendorLogoUrl(vendor)} alt="" />
          </span>
          <div className="min-w-0">
            <p className="kt-voffer__vendor-name">
              {vendorName || (isAr ? "مورد" : "Vendor")}
              {vendor?.verificationStatus === "verified" ? (
                <BadgeCheck
                  size={15}
                  strokeWidth={1.75}
                  className="kt-voffer__verified"
                  aria-label={isAr ? "موثّق" : "Verified"}
                />
              ) : null}
            </p>
            {place ? (
              <p className="kt-voffer__place">
                <MapPin size={12} strokeWidth={1.75} />
                {place}
              </p>
            ) : null}
          </div>
        </div>

        <p className="kt-voffer__product">{productName}</p>

        <div className="kt-voffer__foot">
          <div>
            <p className="kt-voffer__price">{price.label}</p>
            {product.moq != null ? (
              <p className="kt-voffer__moq">
                {isAr ? "الحد الأدنى" : "MOQ"} {product.moq}
                {product.unit ? ` ${product.unit}` : ""}
              </p>
            ) : null}
          </div>
          <Link href={href} className="kt-voffer__cta" data-source={source}>
            {isAr ? "قارن العرض" : "Compare offer"}
          </Link>
        </div>
      </div>
    </article>
  );
}
