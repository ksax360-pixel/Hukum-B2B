import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
  const key = String(item.catalogKey || "").toLowerCase();
  const name = `${item.nameEn} ${item.nameAr}`.toLowerCase();
  if (key === "safety-equipment" || /safety equipment|معدات السلامة/.test(name)) {
    return "/categories/safety-equipment.jpg";
  }
  if (key === "building-materials" || /building material|مواد البناء/.test(name)) {
    return "/categories/building-materials.jpg";
  }
  if (key === "medical-equipment" || /medical equipment|المعدات الطبية|معدات طبية/.test(name)) {
    return "/categories/medical-equipment.jpg";
  }
  if (key === "fmcg" || /\bfmcg\b|سلع استهلاكية/.test(name)) {
    return "/categories/fmcg.jpg";
  }
  if (key === "lab-scientific" || /lab.?scientific|laboratory|مختبر/.test(name)) {
    return "/categories/lab-scientific.jpg";
  }
  if (key === "textiles" || /textile|منسوجات|أقمشة/.test(name)) {
    return "/categories/textiles.jpg";
  }
  if (key === "oil-gas" || /oil\s*&\s*gas|نفط|غاز/.test(name)) {
    return "/categories/oil-gas.jpg";
  }
  if (key === "stationery" || /stationer|قرطاسية/.test(name)) {
    return "/categories/stationery.jpg";
  }
  if (key === "furniture-fitout" || /furniture|أثاث|اثاث/.test(name)) {
    return "/categories/furniture-fitout.jpg";
  }
  if (key === "electrical" || /electric|كهرب/.test(name)) {
    return "/categories/electrical.jpg";
  }
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
    <section className="hukum-sectors" aria-labelledby="hukum-sectors-title">
      <div className="container-custom hukum-sectors__wrap">
        <header className="hukum-sectors__head">
          <div className="hukum-sectors__titles">
            <h2 id="hukum-sectors-title" className="hukum-sectors__title">
              Browse by category
            </h2>
            <p className="hukum-sectors__subtitle" lang="ar" dir="ltr">
              تصفّح حسب التصنيف
            </p>
          </div>

          <Link href={allHref} className="hukum-sectors__all">
            <span>{isAr ? `كل ${countLabel} تصنيفًا` : `All ${countLabel} categories`}</span>
            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
          </Link>
        </header>

        {sectors.length === 0 ? (
          <p className="hukum-sectors__empty">
            {isAr ? "لا توجد تصنيفات بعد." : "No categories available yet."}
          </p>
        ) : (
          <ul className="hukum-sectors__grid">
            {sectors.map((item) => {
              const title = isAr ? item.nameAr || item.nameEn : item.nameEn || item.nameAr;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="hukum-sector-card group"
                    aria-label={title}
                  >
                    <span className="hukum-sector-card__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sectorSrc(item)}
                        alt=""
                        className="hukum-sector-card__img"
                        loading="lazy"
                      />
                    </span>
                    <span className="hukum-sector-card__foot">
                      <span className="hukum-sector-card__name">{title}</span>
                      <span className="hukum-sector-card__arrow" aria-hidden>
                        <ArrowUpRight size={14} strokeWidth={1.75} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
