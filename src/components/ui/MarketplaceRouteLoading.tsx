"use client";

import { useParams } from "next/navigation";

type Props = {
  labelEn?: string;
  labelAr?: string;
};

export function MarketplaceRouteLoading({
  labelEn = "Loading category and products…",
  labelAr = "جاري تحميل التصنيف والمنتجات…",
}: Props) {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const isAr = locale === "ar";
  const text = isAr ? labelAr : labelEn;

  return (
    <div className="mkt-route-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="mkt-route-loading__inner">
        <div className="mkt-route-loading__hero skeleton" aria-hidden />
        <div className="mkt-route-loading__stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dash/Searching.gif"
            alt=""
            width={160}
            height={160}
            className="mkt-route-loading__gif"
          />
          <p className="mkt-route-loading__label">{text}</p>
        </div>
        <div className="mkt-route-loading__grid" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mkt-route-loading__card skeleton" />
          ))}
        </div>
      </div>
    </div>
  );
}
