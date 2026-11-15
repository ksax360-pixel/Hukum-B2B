"use client";

import Link from "next/link";
import { ArrowUpRight, MessageCirclePlus, Send } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { HukumSectorCard } from "@/components/categories/HukumSectorCard";
import { HeroSearchBar } from "@/components/home/HeroSearchBar";
import { SectorTilesCarousel } from "@/components/browse/SectorTilesCarousel";

export type CatalogueSector = {
  slug: string;
  nameEn: string;
  nameAr: string;
  href: string;
  imageSrc: string;
  supplierCount: number;
};

export type CatalogueGroup = {
  id: string;
  nameEn: string;
  nameAr: string;
  sectors: CatalogueSector[];
};

export function CategoriesCatalogue({
  locale,
  popular,
  groups,
}: {
  locale: Locale;
  popular: CatalogueSector[];
  groups: CatalogueGroup[];
}) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const rfqHref = `/${locale}/rfq`;

  return (
    <div className="hukum-sectors hukum-sectors--catalogue hukum-page">
      <div className="hukum-page__wrap">
        <header className="hukum-page-header">
          <div className="hukum-page-header__main">
            <nav aria-label={isAr ? "مسار التنقل" : "Breadcrumb"}>
              <ol className="hukum-page-header__crumb">
                <li>
                  <Link href={`/${locale}`}>{isAr ? "الرئيسية" : "Home"}</Link>
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="hukum-page-header__crumb-sep" aria-hidden>
                    ›
                  </span>
                  <span>{isAr ? "التصنيفات" : "Categories"}</span>
                </li>
              </ol>
            </nav>
            <p className="hukum-page-header__eyebrow hukum-page-header__eyebrow--gold">
              <span className="hukum-page-header__eyebrow-rule" aria-hidden />
              <span>{isAr ? "فئات" : "Categories"}</span>
            </p>
            <h1 className="hukum-page-header__title">
              {isAr ? "تصفّح كل القطاعات" : "Categories in every sector"}
            </h1>
            <p className="hukum-page-header__lead">
              {isAr
                ? "تصفّح كل قطاعات السوق واختر التصنيف المناسب لمشترياتك."
                : "Browse every market sector and pick the category that fits your buy."}
            </p>
          </div>

          <div className="hukum-page-header__actions hukum-page-header__actions--search">
            <HeroSearchBar
              locale={locale}
              placeholder={
                isAr
                  ? "منتج، علامة، موديل أو مورد..."
                  : "Product, brand, model or supplier..."
              }
              aiLabel={isAr ? "بحث ذكي" : "AI search"}
            />
          </div>
        </header>

        {popular.length > 0 ? (
          <section className="cats-popular" aria-labelledby="popular-sectors-title">
            <h2 id="popular-sectors-title" className="hukum-sectors__title cats-popular__title">
              {isAr ? "قطاعات شائعة" : "Popular sectors"}
            </h2>
            <SectorTilesCarousel
              continuous
              ariaLabel={L("Popular sectors", "قطاعات شائعة")}
              rtl={isAr}
              items={popular.map((item) => ({
                slug: item.slug,
                href: item.href,
                label: isAr ? item.nameAr : item.nameEn,
                image: item.imageSrc,
              }))}
            />
          </section>
        ) : null}

        <hr className="cats-catalogue__rule" />

        <div className="cats-groups">
          {groups.map((group, groupIndex) => {
            const isLastGroup = groupIndex === groups.length - 1;
            return (
              <section key={group.id} className="cats-group" aria-labelledby={`group-${group.id}`}>
                <h2 id={`group-${group.id}`} className="cats-group__title">
                  <span>{isAr ? group.nameAr : group.nameEn}</span>
                  <span className="cats-group__title-sep" aria-hidden>
                    /
                  </span>
                  <span className="cats-group__title-alt" lang={isAr ? "en" : "ar"}>
                    {isAr ? group.nameEn : group.nameAr}
                  </span>
                </h2>
                <ul className="hukum-sectors__grid">
                  {group.sectors.map((item) => (
                    <li key={item.slug}>
                      <HukumSectorCard
                        href={item.href}
                        nameEn={item.nameEn}
                        nameAr={item.nameAr}
                        imageSrc={item.imageSrc}
                        locale={locale}
                      />
                    </li>
                  ))}
                  {isLastGroup ? (
                    <li>
                      <Link
                        href={rfqHref}
                        className="hukum-sector-card hukum-sector-card--others group"
                        aria-label={L(
                          "Others — tell us about a unique product and we’ll source it",
                          "أخرى — أخبرنا عن منتج فريد وسنوفّره لك"
                        )}
                      >
                        <span className="hukum-sector-card__media hukum-sector-card__media--others">
                          <MessageCirclePlus size={28} strokeWidth={1.6} aria-hidden />
                        </span>
                        <span className="hukum-sector-card__foot hukum-sector-card__foot--stack">
                          <span className="hukum-sector-card__copy">
                            <span className="hukum-sector-card__name">
                              {L("Others", "أخرى")}
                            </span>
                            <span className="hukum-sector-card__desc">
                              {L(
                                "Have a unique product that’s not listed? Tell us — we’ll source it for you.",
                                "عندك منتج فريد أو غير موجود؟ أخبرنا وسنوفّره لك."
                              )}
                            </span>
                          </span>
                          <span className="hukum-sector-card__arrow" aria-hidden>
                            <ArrowUpRight size={14} strokeWidth={1.75} />
                          </span>
                        </span>
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <div className="brw-below">
        <section className="brw-band brw-band--ask" aria-labelledby="cats-ask-title">
          <div className="brw-band__wrap">
            <hr className="brw-band__rule" />
            <div className="brw-ask">
              <div className="brw-ask__copy">
                <p className="brw-ask__eyebrow">{L("Private sourcing", "خدمات التوريد الخاصة")}</p>
                <h2 id="cats-ask-title" className="brw-ask__title">
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
