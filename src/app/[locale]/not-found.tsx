import Link from "next/link";
import { getLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";

export default async function NotFound() {
  const raw = await getLocale().catch(() => "en");
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const isAr = locale === "ar";

  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap hukum-page__wrap--narrow">
        <div className="hukum-empty" style={{ paddingBlock: "clamp(3rem, 8vw, 5rem)" }}>
          <p className="hukum-page-header__eyebrow hukum-page-header__eyebrow--gold" style={{ marginBottom: 0 }}>
            <span className="hukum-page-header__eyebrow-rule" aria-hidden />
            <span>404</span>
          </p>
          <h1 className="hukum-empty__title" style={{ fontSize: "clamp(1.65rem, 3vw, 2.1rem)" }}>
            {isAr ? "الصفحة غير موجودة" : "Page not found"}
          </h1>
          <p className="hukum-empty__text">
            {isAr
              ? "هذا الرابط غير متاح. ربما نُقل أو أُلغي نشره."
              : "This URL is not available. It may have been moved or unpublished."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}`} className="hukum-btn hukum-btn--primary">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <Link href={`/${locale}/products`} className="hukum-btn hukum-btn--secondary">
              {isAr ? "بحث المنتجات" : "Search products"}
            </Link>
            <Link href={`/${locale}/categories`} className="hukum-btn hukum-btn--ghost">
              {isAr ? "التصنيفات" : "Categories"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
