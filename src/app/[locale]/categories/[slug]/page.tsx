export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { HukumSectorCard } from "@/components/categories/HukumSectorCard";
import { findMarketplaceSector } from "@/data/marketplace-sectors";
import { resolveChildImageSrc, resolveSectorImageSrc } from "@/lib/sector-images";
import { composeMetadata } from "@/modules/seo/engine";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd } from "@/modules/seo/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const sector = findMarketplaceSector(slug);
  const isAr = locale === "ar";
  const title = sector ? (isAr ? sector.nameAr : sector.nameEn) : isAr ? "فئة" : "Category";
  const description = isAr
    ? `تصفّح ${title} والموردين المرتبطين على Hukum.`
    : `Browse ${title} and related suppliers on Hukum.`;
  const nameEn = sector?.nameEn || title;
  const nameAr = sector?.nameAr || title;
  return composeMetadata({
    locale,
    path: `/categories/${slug}`,
    title: `${title} | Hukum`,
    description,
    ogTitle: `${nameEn} suppliers in Saudi Arabia | موردو ${nameAr} في السعودية`,
    ogDescription: `Find verified ${nameEn} suppliers and manufacturers on Hukum. | اعثر على موردي ومصنعي ${nameAr} الموثّقين على حكم.`,
  });
}

export default async function CategorySectorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const sector = findMarketplaceSector(slug);

  const title = sector
    ? isAr
      ? sector.nameAr
      : sector.nameEn
    : decodeURIComponent(slug).replace(/-/g, " ");

  const children =
    sector?.children?.map((child) => ({
      ...child,
      href: `/${locale}/c/${child.slug}`,
      imageSrc: resolveChildImageSrc(child.slug, child.legacyKeys, sector.slug),
    })) || [];

  return (
    <>
      <JsonLd
        data={breadcrumbLd(locale, [
          { name: isAr ? "الرئيسية" : "Home", path: "/" },
          { name: isAr ? "التصنيفات" : "Categories", path: "/categories" },
          { name: title },
        ])}
      />
      <div className="hukum-page hukum-sectors hukum-sectors--catalogue" style={{ borderTop: 0 }}>
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "التصنيفات" : "Categories"}
          goldEyebrow
          title={title}
          arabic={!isAr && sector ? sector.nameAr : undefined}
          lead={
            isAr
              ? "استكشف التصنيفات الفرعية أو انتقل إلى كتالوج المنتجات والموردين لهذا القطاع."
              : "Explore sub-categories, or open the product catalogue and suppliers for this sector."
          }
          crumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "التصنيفات" : "Categories", href: `/${locale}/categories` },
            { label: title },
          ]}
          actions={
            <>
              <Link href={`/${locale}/c/${encodeURIComponent(slug)}`} className="hukum-btn hukum-btn--primary">
                {isAr ? "فتح الكتالوج" : "Open catalogue"}
              </Link>
              <Link
                href={`/${locale}/rfq?category=${encodeURIComponent(slug)}`}
                className="hukum-btn hukum-btn--secondary"
              >
                {isAr ? "طلب عرض سعر" : "Request a quote"}
              </Link>
            </>
          }
        />

        {sector ? (
          <div className="mb-8 flex items-center gap-4 rounded-[1rem] bg-[#F4F4F4] p-4 sm:p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveSectorImageSrc(sector)}
              alt={sector.nameEn}
              width={96}
              height={96}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
            />
            <div className="min-w-0">
              <p className="font-semibold text-[var(--hukum-ink)]">{sector.nameEn}</p>
              <p className="text-sm text-[var(--hukum-muted)]" lang="ar">
                {sector.nameAr}
              </p>
            </div>
          </div>
        ) : null}

        {children.length > 0 ? (
          <section aria-labelledby="subcats-title">
            <h2 id="subcats-title" className="hukum-sectors__title mb-4">
              {isAr ? "تصنيفات فرعية" : "Sub-categories"}
            </h2>
            <ul className="hukum-sectors__grid">
              {children.map((child) => (
                <li key={child.slug}>
                  <HukumSectorCard
                    href={child.href}
                    nameEn={child.nameEn}
                    nameAr={child.nameAr}
                    imageSrc={child.imageSrc}
                    locale={locale}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="hukum-empty">
            <h2 className="hukum-empty__title">
              {isAr ? "تابع إلى الكتالوج" : "Continue to the catalogue"}
            </h2>
            <p className="hukum-empty__text">
              {isAr
                ? "لا توجد تصنيفات فرعية معروضة هنا بعد. يمكنك تصفح المنتجات أو إرسال طلب عرض سعر لهذا القطاع."
                : "No sub-categories are listed here yet. You can browse products or send an RFQ for this sector."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href={`/${locale}/c/${encodeURIComponent(slug)}`} className="hukum-btn hukum-btn--primary">
                {isAr ? "عرض المنتجات" : "View products"}
              </Link>
              <Link href={`/${locale}/categories`} className="hukum-btn hukum-btn--ghost">
                {isAr ? "كل القطاعات" : "All sectors"}
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
