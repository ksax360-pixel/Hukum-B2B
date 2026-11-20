"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PopularProductItem } from "@/components/home/PopularProductCard";

function ArrowIcon() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden="true">
      <path
        d="M1 5.5H13M13 5.5L8.5 1M13 5.5L8.5 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Dannii-style horizontal product row for supplier microsite catalogues. */
export function VendorProductRow({
  locale,
  item,
}: {
  locale: Locale;
  item: PopularProductItem;
}) {
  const isAr = locale === "ar";
  const tags = [item.sku, item.brand, ...item.tags].map((t) => String(t || "").trim()).filter(Boolean);
  const uniqueTags = [...new Set(tags)].slice(0, 4);

  return (
    <li className="vms-row">
      <Link href={item.href} className="vms-row__media" aria-hidden tabIndex={-1}>
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover} alt="" loading="lazy" />
        ) : (
          <span className="vms-row__ph">{item.title.slice(0, 1)}</span>
        )}
      </Link>

      <div className="vms-row__main">
        <Link href={item.href} className="vms-row__name">
          {item.title}
        </Link>
        {item.sku ? (
          <p className="vms-row__meta">
            {isAr ? "رقم المنتج" : "SKU"}: {item.sku}
          </p>
        ) : item.brand ? (
          <p className="vms-row__meta">{item.brand}</p>
        ) : null}

        {uniqueTags.length ? (
          <div className="vms-row__tags">
            {uniqueTags.map((tag) => (
              <span key={tag} className="vms-row__tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="vms-row__specs">
          <span>
            <em>{isAr ? "الحد الأدنى" : "MOQ"}</em> {item.moqLabel}
          </span>
          <span>
            <em>{isAr ? "السعر" : "Price"}</em> {item.priceLabel}
          </span>
          <span>
            <em>{isAr ? "التوريد" : "Lead"}</em> {item.leadTimeLabel}
          </span>
        </div>
      </div>

      <Link href={item.href} className="vms-row__link">
        {isAr ? "عرض التفاصيل" : "View details"}
        <ArrowIcon />
      </Link>
    </li>
  );
}
