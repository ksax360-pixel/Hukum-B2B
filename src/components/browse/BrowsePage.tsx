// src/components/browse/BrowsePage.tsx
// Category / sector / sub-category page. Products first, advanced sticky filters on the left,
// supplier marquee + concierge RFQ band above the footer.

import Link from "next/link";
import { rfqPromise } from "@/lib/rfq-promise";
import { BadgeCheck, ChevronRight, Send } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { BrowseNode, BrowseResult, BrowseFilters } from "@/modules/browse/browse.service";
import type { ResultsView } from "./OfferResults";
import { SectorTilesCarousel } from "./SectorTilesCarousel";
import { BrowseFiltersPanel } from "./BrowseFiltersPanel";
import { BrowseMobileFilterBar } from "./BrowseMobileFilterBar";
import { BrowseSupplierMarquee } from "./BrowseSupplierMarquee";
import { BrowseResultsSwitch } from "./BrowseResultsSwitch";
import type { Offer } from "./group-offers";
import { CITY_AR } from "@/lib/cities";

type Props = { locale: Locale; node: BrowseNode; result: BrowseResult; filters: BrowseFilters; view?: ResultsView };

function browseQuery(filters: BrowseFilters, view?: ResultsView, page?: number): string {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.city) p.set("city", filters.city);
  if (filters.verified) p.set("verified", "1");
  if (filters.saudi) p.set("saudi", "1");
  if (filters.iso) p.set("iso", "1");
  if (filters.type) p.set("type", filters.type);
  if (filters.availability) p.set("availability", filters.availability);
  if (filters.featured) p.set("featured", "1");
  if (filters.sort && filters.sort !== "relevant") p.set("sort", filters.sort);
  if (view === "list") p.set("view", "list");
  if (page && page > 1) p.set("page", String(page));
  return p.toString();
}

export function BrowsePage({ locale, node, result, filters, view = "grid" }: Props) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const nm = (x: { nameEn: string; nameAr: string }): string => (isAr ? x.nameAr : x.nameEn);
  const cityName = (c: string): string => (isAr ? CITY_AR[c] || c : c);
  const base = `/${locale}/categories/${node.slug}`;
  const pageHref = (n: number): string => {
    const qs = browseQuery(filters, view, n);
    return qs ? `${base}?${qs}` : base;
  };

  const rfq = new URLSearchParams({ q: filters.q || node.nameEn });
  if (filters.city) rfq.set("city", filters.city);
  const rfqHref = `/${locale}/rfq?${rfq}`;
  const verifiedCount = result.suppliers.filter((s) => s.verified).length;
  const isGroup = node.kind === "group";
  const toolbarParams = Object.fromEntries(new URLSearchParams(browseQuery(filters, view)));

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
            <p className="brw__alt" lang={isAr ? "en" : "ar"} dir={isAr ? "rtl" : "ltr"}>
              {isAr ? node.nameEn : node.nameAr}
            </p>
            <p className="brw__stats">
              <span><b>{result.total}</b> {L("products", "منتج")}</span>
              <span><b>{result.suppliers.length}</b> {L("suppliers", "مورد")}</span>
              {verifiedCount ? (
                <span className="brw__verified">
                  <BadgeCheck size={14} aria-hidden /> {verifiedCount} {L("verified", "موثّق")}
                </span>
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
            <img src={node.image} alt="" className="brw__head-img" width={220} height={220} aria-hidden />
          ) : null}
        </header>

        {node.children.length ? (
          <SectorTilesCarousel
            ariaLabel={isGroup ? L("Sectors", "القطاعات") : L("Sub-categories", "فئات فرعية")}
            rtl={isAr}
            items={node.children.map((c) => ({
              slug: c.slug,
              href: `/${locale}/categories/${c.slug}`,
              label: nm(c),
              image: c.image,
            }))}
          />
        ) : null}

        <hr className="brw__rule" />

        <BrowseMobileFilterBar
          locale={locale}
          action={base}
          filters={filters}
          cities={result.cities}
          view={view}
        />

        <div className="brw__body">
          <aside className="brw__rail">
            <BrowseFiltersPanel
              locale={locale}
              action={base}
              filters={filters}
              cities={result.cities}
              view={view}
            />
          </aside>

          <main className="brw__main">
            {result.products.length ? (
              <BrowseResultsSwitch
                locale={locale}
                base={base}
                params={toolbarParams}
                total={result.total}
                products={result.products as Offer[]}
                initialView={view}
                showSort={false}
              />
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
        </div>
      </div>

      <div className="brw-below">
        {result.suppliers.length ? (
          <section className="brw-band brw-band--suppliers" aria-labelledby="brw-suppliers-title">
            <div className="brw-band__wrap">
              <hr className="brw-band__rule" />
              <header className="brw-band__head">
                <div>
                  <p className="brw-band__eyebrow">{L("In this industry", "في هذا القطاع")}</p>
                  <h2 id="brw-suppliers-title" className="brw-band__title">
                    {L("Suppliers in this industry", "الموردون في هذا القطاع")}
                  </h2>
                </div>
                <Link href={`/${locale}/vendors`} className="brw-band__link">
                  {L("All suppliers", "كل الموردين")}
                  <ChevronRight size={14} aria-hidden />
                </Link>
              </header>
              <BrowseSupplierMarquee
                locale={locale}
                suppliers={result.suppliers.map((s) => ({
                  id: s.id,
                  name: s.name,
                  slug: s.slug,
                  cityLabel: s.city ? cityName(s.city) : L("Saudi Arabia", "السعودية"),
                  verified: s.verified,
                  logo: s.logo,
                  productCount: s.productCount,
                }))}
                productsLabel={L("products", "منتج")}
                verifiedLabel={L("Verified", "موثّق")}
              />
            </div>
          </section>
        ) : null}

        <section className="brw-band brw-band--ask" aria-labelledby="brw-ask-title">
          <div className="brw-band__wrap">
            <hr className="brw-band__rule" />
            <div className="brw-ask">
              <div className="brw-ask__copy">
                  <p className="brw-ask__eyebrow">خدمات التوريد الخاصة</p>
                <h2 id="brw-ask-title" className="brw-ask__title">
                  {L("Can't find the exact spec?", "ما لقيت المواصفات المطلوبة؟")}
                </h2>
                <p className="brw-ask__text">
                  {L(
                    "We'll get you verified quotations from 3 or more suppliers, in days, not weeks. Contact details stay private until you choose.",
                    "نجيب لك عروض أسعار من 3 موردين موثّقين أو أكثر، خلال أيام مو أسابيع. وبياناتك تبقى خاصة حتى تختار."
                  )}
                </p>
              </div>
              <Link href={rfqHref} className="brw-ask__cta">
                <Send size={15} aria-hidden />
                {L("Describe what you need", "اكتب ما تحتاجه")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
