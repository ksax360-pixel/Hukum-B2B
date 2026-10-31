import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";

export type SectorItem = {
  id: string;
  href: string;
  nameEn: string;
  nameAr: string;
  image?: string;
  catalogKey?: string;
};

function sectorSrc(item: SectorItem) {
  if (item.image && String(item.image).trim()) return String(item.image).trim();
  if (item.catalogKey) return `/categories/${item.catalogKey}.jpg`;
  return "/categories/others.jpg";
}

export function BrowseBySector({
  locale,
  sectors,
  totalSectors,
}: {
  locale: Locale;
  sectors: SectorItem[];
  totalSectors: number;
}) {
  const isAr = locale === "ar";
  const allHref = `/${locale}/categories`;
  const countLabel = totalSectors.toLocaleString(isAr ? "ar-SA" : "en-US");

  return (
    <section className="hukum-sectors">
      <div className="container-custom">
        <div className="hukum-sectors__head">
          <div className="hukum-sectors__titles">
            <h2 className="hukum-sectors__title">
              {isAr ? "تصفّح حسب القطاع" : "Browse by sector"}
            </h2>
            <p className="hukum-sectors__subtitle" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
              {isAr ? "Browse by sector" : "تصفّح حسب القطاع"}
            </p>
          </div>
          <Link href={allHref} className="hukum-sectors__all">
            {isAr ? `كل ${countLabel} قطاعًا` : `All ${countLabel} sectors`}
            <ArrowRight size={14} strokeWidth={2.25} className="rtl:rotate-180" />
          </Link>
        </div>

        {sectors.length === 0 ? (
          <p className="hukum-sectors__empty">
            {isAr ? "لا توجد قطاعات بعد." : "No sectors available yet."}
          </p>
        ) : (
          <div className="hukum-sectors__grid">
            {sectors.map((item) => {
              const title = isAr ? item.nameAr || item.nameEn : item.nameEn || item.nameAr;
              const sub = isAr ? item.nameEn : item.nameAr;
              return (
                <Link key={item.id} href={item.href} className="hukum-sector-card group">
                  <div className="hukum-sector-card__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sectorSrc(item)} alt="" className="hukum-sector-card__img" loading="lazy" />
                  </div>
                  <div className="hukum-sector-card__body">
                    <h3 className="hukum-sector-card__name">{title}</h3>
                    {sub && sub !== title ? (
                      <p className="hukum-sector-card__name-ar" lang={isAr ? "en" : "ar"}>
                        {sub}
                      </p>
                    ) : null}
                    <span className="hukum-sector-card__cta">
                      <span>{isAr ? "عرض القطاع" : "View sector"}</span>
                      <span className="hukum-sector-card__arrow" aria-hidden>
                        <ArrowRight size={13} strokeWidth={2.25} className="rtl:rotate-180" />
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
