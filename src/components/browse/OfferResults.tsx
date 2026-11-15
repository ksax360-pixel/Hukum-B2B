// src/components/browse/OfferResults.tsx
// One results renderer for search, /products and category pages. Each item appears once; when several
// suppliers sell it, the card says so and opens the side-by-side offer table on the product page.
// Grid for browsing, list for scanning prices like a price sheet.

import Link from "next/link";
import { BadgeCheck, Store } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { PopularProductCard } from "@/components/home/PopularProductCard";
import { toCardItem } from "@/components/products/to-card-item";
import { formatPrice, mediaList, productSlug, type VendorLike } from "@/components/products/product-helpers";
import { formatMoney, localizeDuration, unitLabel } from "@/lib/money";
import { groupOffers, leadDays, type Offer, type OfferGroup } from "./group-offers";
import { CITY_AR } from "@/lib/cities";

export type ResultsView = "grid" | "list";


type Summary = {
  href: string;
  rfqHref: string;
  title: string;
  cover?: string;
  count: number;
  price: string;
  moq: string;
  lead: string;
  who: string;
  cities: string[];
  verified: boolean;
};

function summarise(g: OfferGroup, locale: Locale): Summary {
  const isAr = locale === "ar";
  const first = g.offers[0];
  const vendorOf = (o: Offer) => (o.vendorId && typeof o.vendorId === "object" ? (o.vendorId as VendorLike) : null);
  const prices = g.offers.map((o) => o.price).filter((n): n is number => n != null);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const moqs = g.offers.map((o) => o.moq).filter((n): n is number => n != null);
  const fastest = [...g.offers].sort((a, b) => leadDays(a.leadTime) - leadDays(b.leadTime))[0];
  const unit = unitLabel(first.unit, locale);
  const cities = [...new Set(g.offers.map((o) => vendorOf(o)?.location?.city).filter(Boolean) as string[])].map((c) =>
    isAr ? CITY_AR[c] || c : c
  );
  const v = vendorOf(first);
  const many = g.offers.length > 1;
  const name = (isAr ? first.name?.ar || first.name?.en : first.name?.en || first.name?.ar) || "";
  const from = isAr ? "من" : "From";

  return {
    href: `/${locale}/products/${productSlug(first)}${many ? "#offers" : ""}`,
    rfqHref: `/${locale}/rfq?${new URLSearchParams({ q: first.name?.en || name, ...(first.moq ? { qty: String(first.moq) } : {}) })}`,
    title: name,
    cover: mediaList(first)[0]?.url,
    count: g.offers.length,
    price: !prices.length
      ? isAr ? "اطلب السعر" : "Request price"
      : many && hi > lo
        ? `${formatMoney(lo, locale)} – ${hi.toLocaleString("en-US")}`
        : formatPrice(first, locale).label,
    moq: moqs.length ? `${many ? `${from} ` : ""}${Math.min(...moqs).toLocaleString("en-US")} ${unit}`.trim() : isAr ? "حسب الاتفاق" : "Negotiable",
    lead: localizeDuration(fastest.leadTime, locale) || (isAr ? "حسب الطلب" : "On request"),
    who: many
      ? isAr ? `${g.offers.length} موردين` : `${g.offers.length} suppliers`
      : v?.tradeName || (isAr ? v?.legalName?.ar || v?.legalName?.en : v?.legalName?.en) || "",
    cities,
    verified: g.offers.some((o) => vendorOf(o)?.verificationStatus === "verified"),
  };
}

function GroupCard({ s, locale }: { s: Summary; locale: Locale }) {
  const isAr = locale === "ar";
  return (
    <article className="hukum-pop-card ofr-card is-linked">
      <Link href={s.href} className="hukum-pop-card__media" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {s.cover ? <img src={s.cover} alt="" className="hukum-pop-card__img" loading="lazy" /> : null}
        <span className="ofr-card__count"><Store size={13} aria-hidden /> {s.who}</span>
      </Link>
      <div className="hukum-pop-card__body">
        <Link href={s.href} className="hukum-pop-card__title">{s.title}</Link>
        <p className="hukum-pop-card__company">{s.cities.join(isAr ? "، " : ", ")}</p>
        <dl className="hukum-pop-card__specs">
          <div><dt>{isAr ? "الحد الأدنى" : "MOQ"}</dt><dd>{s.moq}</dd></div>
          <div><dt>{isAr ? "السعر" : "Price"}</dt><dd>{s.price}</dd></div>
          <div><dt>{isAr ? "الأسرع" : "Fastest"}</dt><dd>{s.lead}</dd></div>
        </dl>
        <span className="hukum-pop-card__quote" aria-hidden>
          {isAr ? `قارن ${s.count} عروض` : `Compare ${s.count} offers`}
        </span>
        <div className="hukum-pop-card__footer">
          <Link href={s.rfqHref} className="hukum-pop-card__details">{isAr ? "اطلب عروض أسعار منهم" : "Request quotes from all"}</Link>
        </div>
      </div>
    </article>
  );
}

export function OfferResults({
  locale,
  products,
  view = "grid",
  sort,
}: {
  locale: Locale;
  products: Offer[];
  view?: ResultsView;
  sort?: "price";
}) {
  const isAr = locale === "ar";
  const groups = groupOffers(products, sort);

  if (view === "list") {
    return (
      <div className="ofr-list" role="table" aria-label={isAr ? "النتائج" : "Results"}>
        <div className="ofr-list__row ofr-list__row--head" role="row">
          <span role="columnheader">{isAr ? "المنتج" : "Product"}</span>
          <span role="columnheader">{isAr ? "السعر" : "Price"}</span>
          <span role="columnheader">{isAr ? "الحد الأدنى" : "Min. order"}</span>
          <span role="columnheader">{isAr ? "التوريد" : "Lead time"}</span>
          <span role="columnheader"><span className="sr-only">{isAr ? "إجراء" : "Action"}</span></span>
        </div>
        {groups.map((g) => {
          const s = summarise(g, locale);
          return (
            <div key={g.key} className="ofr-list__row" role="row">
              <span role="cell" className="ofr-list__item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.cover ? <img src={s.cover} alt="" loading="lazy" /> : <i aria-hidden />}
                <span>
                  <Link href={s.href}>{s.title}</Link>
                  <small>
                    <span className="who">{s.who}</span>
                    {s.verified ? <BadgeCheck size={13} aria-label={isAr ? "موثّق" : "Verified"} /> : null}
                    {s.cities.length ? <span className="where">{s.cities.slice(0, 3).join(isAr ? "، " : ", ")}</span> : null}
                  </small>
                </span>
              </span>
              <span role="cell" className="ofr-list__price">{s.price}</span>
              <span role="cell" data-label={isAr ? "الحد الأدنى" : "Min. order"}>{s.moq}</span>
              <span role="cell" data-label={isAr ? "التوريد" : "Lead time"}>{s.lead}</span>
              <span role="cell" className="ofr-list__act">
                <Link href={s.count > 1 ? s.href : s.rfqHref}>
                  {s.count > 1 ? (isAr ? `قارن ${s.count}` : `Compare ${s.count}`) : isAr ? "اطلب سعر" : "Get quote"}
                </Link>
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="brw__grid">
      {groups.map((g) =>
        g.offers.length > 1 ? (
          <GroupCard key={g.key} s={summarise(g, locale)} locale={locale} />
        ) : (
          <PopularProductCard key={g.key} locale={locale} item={toCardItem(g.offers[0], locale)} />
        )
      )}
    </div>
  );
}
