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

  return (
    <section className="hukum-popular">
      <div className="container-custom">
        <div className="hukum-popular__head">
          <div>
            <h2 className="hukum-popular__title">
              {isAr ? `الأكثر طلباً في ${titleName}` : `Popular in ${titleName}`}
            </h2>
            <p className="hukum-popular__subtitle" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>
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

        {products.length === 0 ? (
          <p className="hukum-popular__empty">{emptyLabel}</p>
        ) : (
          <div className="hukum-popular__grid">
            {products.map((item) => (
              <PopularProductCard key={item.id} locale={locale} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
