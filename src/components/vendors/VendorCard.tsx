"use client";

import Link from "next/link";
import { MapPin, BadgeCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t as loc } from "@/lib/utils";
import { vendorLogoUrl, type VendorLike } from "@/components/products/product-helpers";

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  manufacturer: { en: "Manufacturer", ar: "مصنّع" },
  distributor: { en: "Distributor", ar: "موزّع" },
  wholesaler: { en: "Wholesaler", ar: "تاجر جملة" },
  retailer: { en: "Retailer", ar: "تاجر تجزئة" },
  importer: { en: "Importer", ar: "مستورد" },
  exporter: { en: "Exporter", ar: "مصدّر" },
  service_provider: { en: "Service provider", ar: "مزوّد خدمة" },
  contractor: { en: "Contractor", ar: "مقاول" },
  trading_company: { en: "Trading company", ar: "شركة تجارية" },
  oem: { en: "OEM", ar: "تصنيع أصلي" },
  odm: { en: "ODM", ar: "تصميم وتصنيع" },
  brand_owner: { en: "Brand owner", ar: "مالك علامة" },
  agent: { en: "Agent", ar: "وكيل" },
  other: { en: "Other", ar: "أخرى" },
};

export function VendorCard({
  locale,
  vendor,
  industryLabel,
}: {
  locale: Locale;
  vendor: VendorLike;
  industryLabel?: string;
}) {
  const isAr = locale === "ar";
  const id = String(vendor._id);
  const href = `/${locale}/vendors/${vendor.slug?.en || id}`;
  const name = loc(locale, vendor.legalName) || vendor.tradeName || "Vendor";
  const city = vendor.location?.city || "";
  const country = vendor.location?.country || "";
  const place = [city, country].filter(Boolean).join(", ") || (isAr ? "السعودية" : "Saudi Arabia");
  const typeKey = vendor.companyType || "";
  const typeLabel = TYPE_LABELS[typeKey]
    ? isAr
      ? TYPE_LABELS[typeKey].ar
      : TYPE_LABELS[typeKey].en
    : typeKey.replace(/_/g, " ");

  return (
    <article className="kt-vcard">
      <Link href={href} className="kt-vcard__media" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={vendorLogoUrl(vendor)} alt="" className="kt-vcard__logo" />
        {vendor.verificationStatus === "verified" ? (
          <span className="kt-vcard__badge">
            <BadgeCheck size={12} strokeWidth={2} />
            {isAr ? "موثّق" : "Verified"}
          </span>
        ) : null}
      </Link>

      <div className="kt-vcard__body">
        {industryLabel || typeLabel ? (
          <p className="kt-vcard__meta">
            {[industryLabel, typeLabel].filter(Boolean).join(" · ")}
          </p>
        ) : null}

        <Link href={href} className="kt-vcard__title">
          {name}
        </Link>

        {vendor.tradeName && vendor.tradeName !== name ? (
          <p className="kt-vcard__trade">{vendor.tradeName}</p>
        ) : null}

        <p className="kt-vcard__place">
          <MapPin size={12} strokeWidth={1.75} />
          {place}
        </p>
      </div>
    </article>
  );
}
