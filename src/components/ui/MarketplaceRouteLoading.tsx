"use client";

import { useParams } from "next/navigation";

type Props = {
  labelEn?: string;
  labelAr?: string;
};

export function MarketplaceRouteLoading({
  labelEn = "Loading categories…",
  labelAr = "جاري تحميل التصنيفات…",
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
          <div className="mkt-route-loading__mark" aria-hidden>
            <span className="mkt-route-loading__halo" />
            <span className="mkt-route-loading__ring" />
            <span className="mkt-route-loading__pulse" />
            <span className="mkt-route-loading__glyph">ح</span>
          </div>
          <p className="mkt-route-loading__label">{text}</p>
          <div className="mkt-route-loading__dots" aria-hidden>
            <i />
            <i />
            <i />
          </div>
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
