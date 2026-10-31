"use client";

import Link from "next/link";
import { Mail, BadgeCheck } from "lucide-react";
import { track } from "@/lib/track-client";
import type { Locale } from "@/i18n/config";
import { t as loc } from "@/lib/utils";
import { InterestHeartButton } from "./InterestHeartButton";
import { SaveProductButton } from "./SaveProductButton";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";
import {
  formatPrice,
  mediaList,
  productSlug,
  type ProductLike,
  type VendorLike,
} from "./product-helpers";

function PriceBlock({
  product,
  locale,
  compact = false,
}: {
  product: ProductLike;
  locale: Locale;
  compact?: boolean;
}) {
  const price = formatPrice(product, locale);
  if (!price.public || price.amount == null) {
    return (
      <p className={`m-0 font-semibold text-[#1a1a1a] ${compact ? "text-sm" : "text-sm"}`}>
        {price.label}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-bold text-[#1a1a1a] ${compact ? "text-sm" : "text-[0.95rem]"}`}>
        {price.label}
      </span>
      {price.compareLabel ? (
        <span className="text-xs text-[#9a9a9a] line-through decoration-[#9a9a9a]">
          {price.compareLabel}
        </span>
      ) : null}
      {price.detail ? <span className="text-[11px] text-[#8a8a8a]">{price.detail}</span> : null}
    </div>
  );
}

export function ListingProductCard({
  locale,
  product,
  vendor,
  source = "category_listing",
  layout = "grid",
  rfqHref,
}: {
  locale: Locale;
  product: ProductLike & { vendorId?: VendorLike; featured?: boolean };
  vendor?: VendorLike | null;
  source?: string;
  layout?: "grid" | "list";
  rfqHref?: string;
}) {
  const isAr = locale === "ar";
  const id = String(product._id);
  const slug = productSlug(product);
  const href = `/${locale}/products/${slug}`;
  const images = mediaList(product);
  const primary = images[0];
  const v = vendor || (product.vendorId as VendorLike | undefined);
  const vendorId = v?._id ? String(v._id) : undefined;
  const vendorName = v ? loc(locale, v.legalName) || v.tradeName || "" : "";
  const name = loc(locale, product.name);
  const nameAr = product.name?.ar || "";
  const nameEn = product.name?.en || "";
  const secondaryName = isAr ? nameEn : nameAr;
  const city = v?.location?.city || "";
  const country =
    v?.location?.country === "SA" ? (isAr ? "السعودية" : "Saudi Arabia") : v?.location?.country || "";
  const place = [city, country].filter(Boolean).join(", ");
  const verified = v?.verificationStatus === "verified";
  const quoteHref =
    rfqHref ||
    `/${locale}/rfq?productId=${encodeURIComponent(id)}${vendorId ? `&vendorId=${encodeURIComponent(vendorId)}` : ""}`;

  const onClick = () => {
    void track({
      type: "product_click",
      productId: id,
      vendorId,
      meta: { source, slug, interaction: "listing_card" },
    });
  };

  if (layout === "list") {
    return (
      <article className="flex flex-col gap-4 rounded-xl border border-[#e6e2da] bg-transparent p-4 sm:flex-row sm:items-center">
        <Link
          href={href}
          onClick={onClick}
          className="relative h-[120px] w-full shrink-0 overflow-hidden rounded-lg bg-[#f0eeea] sm:w-[140px]"
        >
          {primary?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={primary.url} alt={name} className="h-full w-full object-contain p-2" />
          ) : null}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href} onClick={onClick} className="text-base font-semibold text-[#1a1a1a] hover:text-[#b8953d]">
            {name}
          </Link>
          {secondaryName && secondaryName !== name ? (
            <p className="mt-0.5 mb-0 text-sm text-[#5c5c5c]" dir={isAr ? "ltr" : "rtl"}>
              {secondaryName}
            </p>
          ) : null}
          <p className="mt-1 mb-0 text-sm text-[#6b6b6b]">
            {vendorName}
            {place ? ` · ${place}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            {verified ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#1b7a3d]">
                <BadgeCheck className="h-3.5 w-3.5" /> {isAr ? "موثّق" : "Verified"}
              </span>
            ) : null}
            {product.featured || (v as { featured?: boolean } | undefined)?.featured ? (
              <span className="inline-flex items-center rounded bg-[#c9a962]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6d2d]">
                {isAr ? "مميز / مدفوع" : "Featured"}
              </span>
            ) : null}
            <PriceBlock product={product} locale={locale} />
            <SaveProductButton locale={isAr ? "ar" : "en"} productId={id} />
            <AddToCompareButton
              locale={isAr ? "ar" : "en"}
              item={{
                id,
                slug,
                name,
                image: primary?.url,
                vendorName,
                priceLabel: formatPrice(product, locale).label,
                moq: product.moq,
                leadTime: product.leadTime,
                city,
                unit: product.unit,
                verified,
              }}
            />
          </div>
        </div>
        <Link
          href={quoteHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#c9a962] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b8953d]"
        >
          <Mail className="h-4 w-4" />
          {isAr ? "طلب عرض سعر" : "Request a Quote"}
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#e6e2da] bg-transparent transition hover:border-[#c9a962]/50 hover:shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="relative h-[168px] shrink-0 bg-[#f0eeea] sm:h-[180px]">
        <Link href={href} onClick={onClick} className="absolute inset-0 block" aria-label={name}>
          {primary?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primary.url}
              alt={loc(locale, primary.alt) || name}
              className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-[#c4bfb4]">
              {(name || "KT").slice(0, 1).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="absolute end-2.5 top-2.5 z-10 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <InterestHeartButton
            locale={locale === "ar" ? "ar" : "en"}
            productId={id}
            productName={name}
            vendorId={vendorId}
            size={14}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[#16a34a] hover:text-[#15803d]"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
        <Link
          href={href}
          onClick={onClick}
          className="line-clamp-2 text-sm font-semibold leading-snug text-[#1a1a1a] hover:text-[#b8953d]"
        >
          {name}
        </Link>
        {secondaryName && secondaryName !== name ? (
          <p
            className="m-0 line-clamp-1 text-[12px] font-medium text-[#5c5c5c]"
            dir={isAr ? "ltr" : "rtl"}
          >
            {secondaryName}
          </p>
        ) : null}

        <p className="m-0 truncate text-xs text-[#6b6b6b]">{vendorName || (isAr ? "مورد" : "Supplier")}</p>
        {place ? <p className="m-0 truncate text-[11px] text-[#8a8a8a]">{place}</p> : null}

        <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs">
          {verified ? (
            <span className="inline-flex items-center gap-0.5 font-medium text-[#22a06b]">
              <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
              {isAr ? "موثّق" : "Verified"}
            </span>
          ) : null}
          {product.featured || (v as { featured?: boolean } | undefined)?.featured ? (
            <span className="rounded bg-[#c9a962]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#8a6d2d]">
              {isAr ? "مميز" : "Featured"}
            </span>
          ) : null}
        </div>

        <div className="mt-1.5">
          <PriceBlock product={product} locale={locale} compact />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SaveProductButton locale={isAr ? "ar" : "en"} productId={id} />
          <AddToCompareButton
            locale={isAr ? "ar" : "en"}
            item={{
              id,
              slug,
              name,
              image: primary?.url,
              vendorName,
              priceLabel: formatPrice(product, locale).label,
              moq: product.moq,
              leadTime: product.leadTime,
              city,
              unit: product.unit,
              verified,
            }}
          />
        </div>

        <Link
          href={quoteHref}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#c9a962] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8953d]"
        >
          <Mail className="h-4 w-4" />
          {isAr ? "طلب عرض سعر" : "Request a Quote"}
        </Link>
      </div>
    </article>
  );
}
