// src/components/browse/BrowsePage.tsx
// Category / sector / sub-category page. Products first (buyers come to see what's sold and by whom),
// city + verified filters as one row of chips, suppliers alongside, and one request when nothing fits.

import Link from "next/link";
import { rfqPromise } from "@/lib/rfq-promise";
import { BadgeCheck, ChevronRight, MapPin, Send, Store } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { BrowseNode, BrowseResult, BrowseFilters } from "@/modules/browse/browse.service";
import { OfferResults, type ResultsView } from "./OfferResults";
import { ResultsToolbar } from "./ResultsToolbar";
import type { Offer } from "./group-offers";
import { CITY_AR } from "@/lib/cities";

type Props = { locale: Locale; node: BrowseNode; result: BrowseResult; filters: BrowseFilters; view?: ResultsView };


export function BrowsePage({ locale, node, result, filters, view = "grid" }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const nm = (x: { nameEn: string; nameAr: string }): string => (isAr ? x.nameAr : x.nameEn);
  const cityName = (c: string): string => (isAr ? CITY_AR[c] || c : c);
  const base = `/${locale}/categories/${node.slug}`;

  /** Same page with one filter changed; page resets. */
  const withParam = (key: "city" | "verified", value?: string): string => {
    const p = new URLSearchParams();
    if (filters.city && key !== "city") p.set("city", filters.city);
    if (filters.verified && key !== "verified") p.set("verified", "1");
    if (filters.sort && filters.sort !== "relevant") p.set("sort", filters.sort);
    if (view === "list") p.set("view", "list");
    if (value) p.set(key, value);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const pageHref = (n: number): string => {
    const p = new URLSearchParams();
    if (filters.city) p.set("city", filters.city);
    if (filters.verified) p.set("verified", "1");
    if (filters.sort && filters.sort !== "relevant") p.set("sort", filters.sort);
    if (view === "list") p.set("view", "list");
    if (n > 1) p.set("page", String(n));
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const rfq = new URLSearchParams({ q: node.nameEn });
  if (filters.city) rfq.set("city", filters.city);
  const rfqHref = `/${locale}/rfq?${rfq}`;
  const verifiedCount = result.suppliers.filter((s) => s.verified).length;
  const isGroup = node.kind === "group";

  return (
    <div className="brw" dir={isAr ? "rtl" : "ltr"}>
      <div className="brw__wrap">
        <nav className="brw__crumbs" aria-label={L("Breadcrumb", "مسار التنقل")}>
          <Link href={`/${locale}`}>{L("Home", "الرئيسية")}</Link>
          <ChevronRight size={13} aria-hidden className="brw__sep" />
          <Link href={`/${locale}/categories`}>{L("Categories", "الفئات")}</Link>
          {node.trail.map((t) => (
            <span key={t.slug} className="brw__crumb">
              <ChevronRight size={13} aria-hidden className="brw__sep" />
              <Link href={`/${locale}/categories/${t.slug}`}>{nm(t)}</Link>
            </span>
          ))}
        </nav>

        <header className="brw__head">
          <div className="brw__head-text">
            <h1>{nm(node)}</h1>
            <p className="brw__alt" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
              {isAr ? node.nameEn : node.nameAr}
            </p>
            <p className="brw__stats">
              <span><b>{result.total}</b> {L("products", "منتج")}</span>
              <span><b>{result.suppliers.length}</b> {L("suppliers", "مورد")}</span>
              {verifiedCount ? (
                <>
                  <span className="brw__verified">
                    <BadgeCheck size={14} aria-hidden /> {verifiedCount} {L("verified", "موثّق")}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div className="brw__head-cta">
            <Link href={rfqHref} className="brw__btn brw__btn--primary">
              <Send size={15} aria-hidden />
              {L("Request quotes", "اطلب عروض أسعار")}
            </Link>
            <span className="brw__hint">{rfqPromise(locale)}</span>
          </div>
          {node.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={node.image} alt="" className="brw__head-img" width={160} height={160} />
          ) : null}
        </header>

        {node.children.length ? (
          isGroup ? (
            <section className="brw__tiles" aria-label={L("Sectors", "القطاعات")}>
              {node.children.map((c) => (
                <Link key={c.slug} href={`/${locale}/categories/${c.slug}`} className="brw__tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.image ? <img src={c.image} alt="" loading="lazy" /> : <span className="brw__tile-ph" />}
                  <span>{nm(c)}</span>
                </Link>
              ))}
            </section>
          ) : (
            <div className="brw__subs" role="list" aria-label={L("Sub-categories", "فئات فرعية")}>
              {node.children.map((c) => (
                <Link key={c.slug} href={`/${locale}/categories/${c.slug}`} className="brw__sub" role="listitem">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.image ? <img src={c.image} alt="" loading="lazy" /> : null}
                  {nm(c)}
                </Link>
              ))}
            </div>
          )
        ) : null}

        <div className="brw__bar" role="toolbar" aria-label={L("Filters", "التصفية")}>
          <div className="brw__chips">
            <Link href={withParam("city")} className={`brw__chip${!filters.city ? " is-on" : ""}`}>
              {L("All cities", "كل المدن")}
            </Link>
            {result.cities.map((c) => (
              <Link
                key={c.city}
                href={withParam("city", c.city)}
                className={`brw__chip${filters.city?.toLowerCase() === c.city.toLowerCase() ? " is-on" : ""}`}
              >
                <MapPin size={13} aria-hidden />
                {cityName(c.city)} <small>{c.count}</small>
              </Link>
            ))}
            <span className="brw__div" aria-hidden />
            <Link href={withParam("verified", filters.verified ? undefined : "1")} className={`brw__chip${filters.verified ? " is-on" : ""}`}>
              <BadgeCheck size={13} aria-hidden />
              {L("Verified only", "الموثّقون فقط")}
            </Link>
          </div>
        </div>

        <div className="brw__body">
          <main className="brw__main">
            {result.products.length ? (
              <>
                <ResultsToolbar
                  locale={locale}
                  base={base}
                  params={{ city: filters.city, verified: filters.verified ? "1" : undefined, sort: filters.sort === "relevant" ? undefined : filters.sort, view: view === "list" ? "list" : undefined }}
                  total={result.total}
                />
                <OfferResults locale={locale} products={result.products as Offer[]} view={view} />
              </>
            ) : (
              <div className="brw__empty">
                <h2>{L(`No listed products in ${node.nameEn} yet`, `لا توجد منتجات معروضة في ${node.nameAr} حالياً`)}</h2>
                <p>
                  {L(
                    "Tell us what you need. We send it to suppliers in this sector and you compare their quotes.",
                    "أخبرنا بما تحتاجه، نرسله لموردي هذا القطاع وتقارن عروضهم."
                  )}
                </p>
                <Link href={rfqHref} className="brw__btn brw__btn--primary">
                  <Send size={15} aria-hidden />
                  {L("Request quotes", "اطلب عروض أسعار")}
                </Link>
                {node.siblings.length ? (
                  <div className="brw__empty-alt">
                    <span>{L("Or browse", "أو تصفّح")}</span>
                    {node.siblings.slice(0, 6).map((s) => (
                      <Link key={s.slug} href={`/${locale}/categories/${s.slug}`} className="brw__chip">
                        {nm(s)}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {result.pages > 1 ? (
              <nav className="brw__pager" aria-label={L("Pages", "الصفحات")}>
                {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={pageHref(n)} aria-current={n === result.page ? "page" : undefined}>
                    {n}
                  </Link>
                ))}
              </nav>
            ) : null}
          </main>

          <aside className="brw__rail">
            {result.suppliers.length ? (
              <section className="brw__card">
                <h2>{L(`Suppliers in ${node.nameEn}`, `موردو ${node.nameAr}`)}</h2>
                <ul className="brw__sups">
                  {result.suppliers.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <Link href={`/${locale}/vendors/${s.slug}`} className="brw__sup">
                        <span className="brw__sup-logo">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {s.logo ? <img src={s.logo} alt="" /> : <Store size={16} aria-hidden />}
                        </span>
                        <span className="brw__sup-text">
                          <b>
                            {s.name}
                            {s.verified ? <BadgeCheck size={14} className="brw__tick" aria-label={L("Verified", "موثّق")} /> : null}
                          </b>
                          <small>
                            <span>{s.city ? cityName(s.city) : L("Saudi Arabia", "السعودية")}</span>
                            <span>{s.productCount} {L("products", "منتج")}</span>
                          </small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={`/${locale}/vendors`} className="brw__more">
                  {L("All suppliers", "كل الموردين")} <ChevronRight size={14} aria-hidden />
                </Link>
              </section>
            ) : null}

            <section className="brw__card brw__card--ask">
              <h2>{L("Can't find the exact spec?", "ما لقيت المواصفات المطلوبة؟")}</h2>
              <p>
                {rfqPromise(locale)}.{" "}
                {L("Contact details stay private until you choose.", "وبياناتك تبقى خاصة حتى تختار.")}
              </p>
              <Link href={rfqHref} className="brw__btn brw__btn--dark">
                {L("Describe what you need", "اكتب ما تحتاجه")}
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
