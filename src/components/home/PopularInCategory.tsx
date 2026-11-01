import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import {
  PopularProductCard,
  type PopularProductItem,
} from "@/components/home/PopularProductCard";

export function PopularInCategory({
  locale,
  categoryNameEn,
  categoryNameAr,
  viewAllHref,
  products,
  emptyLabel,
}: {
  locale: Locale;
  categoryNameEn: string;
  categoryNameAr: string;
  viewAllHref: string;
  products: PopularProductItem[];
  emptyLabel: string;
}) {
  const isAr = locale === "ar";
  const titleName = isAr ? categoryNameAr || categoryNameEn : categoryNameEn || categoryNameAr;
  const subName = isAr ? categoryNameEn : categoryNameAr;
  const loop = products.length > 0 ? [...products, ...products] : [];

  return (
    <section className="hukum-popular">
      <div className="container-custom hukum-popular__wrap">
        <div className="hukum-popular__head">
          <div>
            <h2 className="hukum-popular__title">
              {isAr ? `الأكثر طلباً في ${titleName}` : `Popular in ${titleName}`}
            </h2>
            <p className="hukum-popular__subtitle" lang={isAr ? "en" : "ar"} dir="ltr">
              {isAr
                ? `Popular in ${subName || titleName}`
                : `الأكثر طلباً في ${subName || titleName}`}
            </p>
          </div>
          <Link href={viewAllHref} className="hukum-popular__all">
            {isAr ? `عرض كل ${titleName}` : `View all ${titleName.toLowerCase()}`}
            <ArrowRight size={14} strokeWidth={2.25} className="rtl:rotate-180" />
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="container-custom">
          <p className="hukum-popular__empty">{emptyLabel}</p>
        </div>
      ) : (
        <div className="hukum-popular__rail" aria-label={isAr ? "منتجات شائعة" : "Popular products"}>
          <div className="hukum-popular__track">
            {loop.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="hukum-popular__slide"
                aria-hidden={index >= products.length ? true : undefined}
              >
                <PopularProductCard locale={locale} item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
