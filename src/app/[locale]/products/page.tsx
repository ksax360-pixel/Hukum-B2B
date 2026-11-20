export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { searchCatalogProducts } from "@/modules/products/catalog-search";
import { loadPublishedTaxonomyFacets } from "@/modules/products/catalog-facets";
import { smartSearchProducts } from "@/modules/search/smart-search";
import type { UnderstoodQuery } from "@/modules/search/query-understanding";
import { SearchUnderstanding } from "@/components/search/SearchUnderstanding";
import { OfferResults } from "@/components/browse/OfferResults";
import { ResultsToolbar } from "@/components/browse/ResultsToolbar";
import type { Offer } from "@/components/browse/group-offers";
import { BadgeCheck, ChevronRight, MapPin, Send } from "lucide-react";
import { rfqPromise } from "@/lib/rfq-promise";
import { t as loc } from "@/lib/utils";
import { toPlain } from "@/components/products/product-helpers";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

const CITIES = [
  { en: "Riyadh", ar: "الرياض" }, { en: "Jeddah", ar: "جدة" }, { en: "Dammam", ar: "الدمام" },
  { en: "Khobar", ar: "الخبر" }, { en: "Mecca", ar: "مكة" }, { en: "Jubail", ar: "الجبيل" },
];

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const faceted = Object.keys(sp).some((k) => !["page"].includes(k));
  return staticPageMetadata(
    params,
    "/products",
    "ignored",
    undefined,
    { indexable: !faceted, seoKey: "products" }
  );
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const isAr = locale === "ar";

  let items: Array<Record<string, unknown>> = [];
  let total = 0;
  let understood: UnderstoodQuery | null = null;
  let matchedCats: Array<{ _id: string; name?: { en?: string; ar?: string } }> = [];
  let facets: Awaited<ReturnType<typeof loadPublishedTaxonomyFacets>> = {
    industries: [],
    categories: [],
    productTypes: [],
    selectedIndustryId: "",
    selectedCategoryId: "",
    selectedTypeId: "",
  };

  try {
    await connectDB();
    const filters = {
        q: sp.q,
        city: sp.city || sp.location,
        location: sp.location || sp.city,
        seller: sp.seller || sp.vendor,
        industryId: sp.industryId,
        categoryId: sp.categoryId,
        priceType: sp.priceType,
        availability: sp.availability,
        condition: sp.condition,
        unit: sp.unit,
        currency: sp.currency,
        origin: sp.origin,
        verified: sp.verified,
        featured: sp.featured,
        negotiable: sp.negotiable,
        requestQuote: sp.requestQuote,
        // Newest listings first unless buyer picks another sort.
        sort: sp.sort === "price" ? "price_asc" : sp.sort === "featured" ? "featured" : "newest",
        page: Number(sp.page || 1) || 1,
        limit: 12,
    };
    // Typed text goes through query understanding (typos, Arabic, quantity, city); plain browsing keeps the catalogue query.
    const search = sp.q?.trim() ? smartSearchProducts(filters) : searchCatalogProducts(filters);
    const [result, facetData] = await Promise.all([
      search,
      loadPublishedTaxonomyFacets({
        industryId: sp.industryId,
        categoryId: sp.categoryId,
      }),
    ]);
    items = toPlain(result.items) as Array<Record<string, unknown>>;
    total = result.total;
    facets = facetData;
    if ("understood" in result) {
      understood = result.understood;
      matchedCats = result.categories;
    }
  } catch {
    /* offline */
  }

  const PAGE = 12;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const page = Math.min(pages, Number(sp.page || 1) || 1);
  const view = sp.view === "list" ? "list" : "grid";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const base = `/${locale}/products`;
  /** Same URL with one param changed; the page resets unless it is the page itself. */
  const withParam = (key: string, value?: string): string => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== key && k !== "page") next.set(k, v);
    if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const city = sp.city || sp.location;
  const rfqHref = `/${locale}/rfq${sp.q ? `?${new URLSearchParams({ q: sp.q })}` : ""}`;
  const facetName = (c: { name?: { en?: string; ar?: string } }): string =>
    loc(locale, c.name || { en: "", ar: "" });

  /** Set taxonomy params; clears deeper levels when going up. */
  const withTaxonomy = (patch: { industryId?: string; categoryId?: string }): string => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (!v || k === "page" || k === "industryId" || k === "categoryId") continue;
      next.set(k, v);
    }
    if (patch.industryId) next.set("industryId", patch.industryId);
    if (patch.categoryId) next.set("categoryId", patch.categoryId);
    const qs = next.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const activeIndustry = facets.selectedIndustryId || sp.industryId || "";

  return (
    <div className="brw" dir={isAr ? "rtl" : "ltr"}>
      <div className="brw__wrap">
        <nav className="brw__crumbs" aria-label={L("Breadcrumb", "مسار التنقل")}>
          <Link href={`/${locale}`}>{L("Home", "الرئيسية")}</Link>
          <ChevronRight size={13} aria-hidden className="brw__sep" />
          <Link href={base}>{L("Products", "المنتجات")}</Link>
        </nav>

        <header className={`brw__head${understood ? " brw__head--plain" : ""}`}>
          <div className="brw__head-text">
            <h1>{sp.q ? L(`Results for “${sp.q}”`, `نتائج «${sp.q}»`) : L("All products", "كل المنتجات")}</h1>
            {understood ? null : (
              <p className="brw__stats">
                <span>{L("Filter by the same industry and category sellers use when they list products.", "صفِّ حسب نفس الصناعة والفئة اللي يستخدمها الموردون عند إضافة المنتجات.")}</span>
              </p>
            )}
          </div>
          {understood ? null : <div className="brw__head-cta">
            <Link href={rfqHref} className="brw__btn brw__btn--primary">
              <Send size={15} aria-hidden />
              {L("Request quotes", "اطلب عروض أسعار")}
            </Link>
            <span className="brw__hint">{rfqPromise(locale)}</span>
          </div>}
        </header>

        {understood ? (
          <SearchUnderstanding locale={locale} understood={understood} categories={matchedCats} params={sp} total={total} />
        ) : (
          <div className="space-y-3">
            {facets.industries.length ? (
              <div className="brw__subs" role="list" aria-label={L("Industry", "الصناعة")}>
                <Link href={withTaxonomy({})} className={`brw__sub${!activeIndustry ? " is-on" : ""}`} role="listitem">
                  {L("All industries", "كل الصناعات")}
                </Link>
                {facets.industries.map((c) => (
                  <Link
                    key={c._id}
                    href={withTaxonomy({
                      industryId: activeIndustry === c._id ? undefined : c._id,
                    })}
                    className={`brw__sub${activeIndustry === c._id ? " is-on" : ""}`}
                    role="listitem"
                  >
                    {facetName(c)}
                    <span className="ms-1 opacity-60">({c.count})</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {activeIndustry && facets.categories.length ? (
              <div className="brw__subs" role="list" aria-label={L("Category", "الفئة")}>
                <Link
                  href={withTaxonomy({ industryId: activeIndustry })}
                  className={`brw__sub${!facets.selectedCategoryId && !facets.selectedTypeId ? " is-on" : ""}`}
                  role="listitem"
                >
                  {L("All categories", "كل الفئات")}
                </Link>
                {facets.categories.map((c) => (
                  <Link
                    key={c._id}
                    href={withTaxonomy({
                      industryId: activeIndustry,
                      categoryId: facets.selectedCategoryId === c._id && !facets.selectedTypeId ? undefined : c._id,
                    })}
                    className={`brw__sub${facets.selectedCategoryId === c._id ? " is-on" : ""}`}
                    role="listitem"
                  >
                    {facetName(c)}
                    <span className="ms-1 opacity-60">({c.count})</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {facets.selectedCategoryId && facets.productTypes.length ? (
              <div className="brw__subs" role="list" aria-label={L("Product type", "نوع المنتج")}>
                <Link
                  href={withTaxonomy({ industryId: activeIndustry, categoryId: facets.selectedCategoryId })}
                  className={`brw__sub${!facets.selectedTypeId ? " is-on" : ""}`}
                  role="listitem"
                >
                  {L("All types", "كل الأنواع")}
                </Link>
                {facets.productTypes.map((c) => (
                  <Link
                    key={c._id}
                    href={withTaxonomy({
                      industryId: activeIndustry,
                      categoryId: facets.selectedTypeId === c._id ? facets.selectedCategoryId : c._id,
                    })}
                    className={`brw__sub${facets.selectedTypeId === c._id ? " is-on" : ""}`}
                    role="listitem"
                  >
                    {facetName(c)}
                    <span className="ms-1 opacity-60">({c.count})</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="brw__bar" role="toolbar" aria-label={L("Filters", "التصفية")}>
          <div className="brw__chips">
            <Link href={withParam("city")} className={`brw__chip${!city ? " is-on" : ""}`}>{L("All cities", "كل المدن")}</Link>
            {CITIES.map((c) => (
              <Link key={c.en} href={withParam("city", c.en)} className={`brw__chip${city?.toLowerCase() === c.en.toLowerCase() ? " is-on" : ""}`}>
                <MapPin size={13} aria-hidden />
                {isAr ? c.ar : c.en}
              </Link>
            ))}
            <span className="brw__div" aria-hidden />
            <Link href={withParam("verified", sp.verified === "true" ? undefined : "true")} className={`brw__chip${sp.verified === "true" ? " is-on" : ""}`}>
              <BadgeCheck size={13} aria-hidden />
              {L("Verified only", "الموثّقون فقط")}
            </Link>
          </div>
        </div>

        <div className="brw__main brw__main--full">
          {items.length ? (
            <>
              <ResultsToolbar locale={locale} base={base} params={sp} total={total} />
              <OfferResults locale={locale} products={items as Offer[]} view={view} sort={sp.sort === "price" ? "price" : undefined} />
            </>
          ) : (
            <div className="brw__empty">
              <h2>{sp.q ? L(`No listings for “${sp.q}” yet`, `ما فيه عروض لـ «${sp.q}» حالياً`) : L("No listings match these filters", "ما فيه عروض تطابق التصفية")}</h2>
              <p>{L("Send one request and we find suppliers who sell it. You compare their quotes side by side.", "أرسل طلباً واحداً ونوصله للموردين اللي يبيعونه، وتقارن عروضهم جنباً إلى جنب.")}</p>
              <Link href={rfqHref} className="brw__btn brw__btn--primary">
                <Send size={15} aria-hidden />
                {L("Request quotes", "اطلب عروض أسعار")}
              </Link>
              {Object.keys(sp).some((k) => k !== "q") ? <Link href={sp.q ? `${base}?${new URLSearchParams({ q: sp.q })}` : base} className="brw__more">{L("Clear filters", "مسح التصفية")}</Link> : null}
            </div>
          )}

          {pages > 1 ? (
            <nav className="brw__pager" aria-label={L("Pages", "الصفحات")}>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={n === 1 ? withParam("page") : withParam("page", String(n))} aria-current={n === page ? "page" : undefined}>
                  {n}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
