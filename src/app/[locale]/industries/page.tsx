export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Industry } from "@/modules/categories/taxonomy.model";
import {
  MARKETPLACE_INDUSTRIES,
  getIndustryCategories,
} from "@/data/marketplace-industries";
import { IndustryIcon } from "@/components/industries/IndustryIcon";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/industries",
    isAr ? "القطاعات | Hukum" : "Industries | Hukum",
    isAr
      ? "استكشف القطاعات التي تغطيها Hukum."
      : "Explore every sector Hukum covers — from industrial and energy to IT and professional services."
  );
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const nameOf = (n: { en: string; ar: string }) => (isAr ? n.ar : n.en);

  const slugToId = new Map<string, string>();
  try {
    await connectDB();
    const db = await Industry.find({ status: "active" }).select("_id slug name").lean();
    for (const item of db) {
      const en = (item.slug as { en?: string } | undefined)?.en;
      const nameEn = (item.name as { en?: string } | undefined)?.en;
      if (en) slugToId.set(en, String(item._id));
      if (nameEn) slugToId.set(nameEn.toLowerCase(), String(item._id));
    }
  } catch {
    /* offline — catalog still renders */
  }

  const featured = MARKETPLACE_INDUSTRIES.slice(0, 4);
  const totalCategories = MARKETPLACE_INDUSTRIES.reduce((n, i) => n + i.categoryKeys.length, 0);

  const hrefFor = (slugEn: string, nameEn: string) => {
    const id = slugToId.get(slugEn) || slugToId.get(nameEn.toLowerCase());
    return id ? `/${locale}/industries/${slugEn}` : `/${locale}/industries/${slugEn}`;
  };

  return (
    <div className="kt-industries">
      <section className="kt-industries-hero">
        <div className="container-custom kt-industries-hero__inner">
          <div className="kt-industries-hero__copy">
            <p className="kt-industries-hero__eyebrow">{isAr ? "قطاعات المملكة" : "Kingdom sectors"}</p>
            <h1 className="kt-industries-hero__title">
              {isAr ? "قطاعات الأعمال في المملكة" : "Industries across the Kingdom"}
            </h1>
            <p className="kt-industries-hero__lead">
              {isAr
                ? "استكشف كل القطاعات التي يغطيها Hukum — من الصناعة والطاقة إلى تقنية المعلومات والخدمات المهنية وتأسيس الشركات."
                : "Explore every sector Hukum covers — from industrial and energy to IT, professional services, and company formation."}
            </p>
            <div className="kt-industries-hero__stats">
              <div>
                <strong>{MARKETPLACE_INDUSTRIES.length}</strong>
                <span>{isAr ? "قطاعاً" : "industries"}</span>
              </div>
              <div>
                <strong>{totalCategories}</strong>
                <span>{isAr ? "تصنيفاً" : "categories"}</span>
              </div>
              <div>
                <strong>B2B</strong>
                <span>{isAr ? "مشتريات مؤسسية" : "enterprise trade"}</span>
              </div>
            </div>
          </div>
          <div className="kt-industries-hero__mosaic" aria-hidden>
            {featured.map((ind) => (
              <div key={ind.key} className="kt-industries-hero__tile" style={{ background: ind.soft }}>
                <IndustryIcon industryKey={ind.key} className="kt-industries-hero__tile-icon" />
                <span>{nameOf(ind.name)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-custom kt-industries-section">
        <div className="kt-industries-section__head">
          <p className="label-caps">{isAr ? "مميز" : "Featured"}</p>
          <h2>{isAr ? "قطاعات أساسية" : "Priority industries"}</h2>
          <p>
            {isAr
              ? "نقطة انطلاق للمشتريات عالية الطلب عبر المملكة."
              : "A refined starting point for high-demand procurement across Saudi Arabia."}
          </p>
        </div>

        <div className="kt-industries-featured">
          {featured.map((ind) => {
            const cats = getIndustryCategories(ind);
            return (
              <Link
                key={ind.key}
                href={hrefFor(ind.slug.en, ind.name.en)}
                className="kt-industry-feature"
                style={{ ["--ind-accent" as string]: ind.accent, ["--ind-soft" as string]: ind.soft }}
              >
                <div className="kt-industry-feature__visual">
                  <IndustryIcon industryKey={ind.key} className="kt-industry-feature__icon" />
                </div>
                <div className="kt-industry-feature__body">
                  <p className="kt-industry-feature__count">
                    {cats.length} {isAr ? "تصنيف" : cats.length === 1 ? "category" : "categories"}
                  </p>
                  <h3>{nameOf(ind.name)}</h3>
                  <p>{nameOf(ind.description)}</p>
                  <ul>
                    {cats.slice(0, 3).map((c) => (
                      <li key={c.key}>{nameOf(c.name)}</li>
                    ))}
                  </ul>
                  <span className="kt-industry-feature__cta">{isAr ? "استكشف القطاع" : "Explore industry"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-custom kt-industries-section kt-industries-section--all">
        <div className="kt-industries-section__head">
          <p className="label-caps">{isAr ? "الكتالوج الكامل" : "Full catalogue"}</p>
          <h2>{isAr ? "كل القطاعات" : "All industries"}</h2>
          <p>
            {isAr
              ? "كل قطاع مرتبط بتصنيفات السوق على المنصة — بما في ذلك خيار «أخرى»."
              : "Every sector mapped to live marketplace categories — including Others when nothing else fits."}
          </p>
        </div>

        <div className="kt-industries-grid">
          {MARKETPLACE_INDUSTRIES.map((ind) => {
            const cats = getIndustryCategories(ind);
            return (
              <Link
                key={ind.key}
                href={hrefFor(ind.slug.en, ind.name.en)}
                className="kt-industry-card"
                style={{ ["--ind-accent" as string]: ind.accent, ["--ind-soft" as string]: ind.soft }}
              >
                <div className="kt-industry-card__top">
                  <span className="kt-industry-card__mark">
                    <IndustryIcon industryKey={ind.key} />
                  </span>
                  <span className="kt-industry-card__meta">
                    {cats.length} {isAr ? "تصنيف" : cats.length === 1 ? "cat." : "cats."}
                  </span>
                </div>
                <h3>{nameOf(ind.name)}</h3>
                <p>{nameOf(ind.description)}</p>
                <div className="kt-industry-card__tags">
                  {cats.slice(0, 4).map((c) => (
                    <span key={c.key}>{nameOf(c.name)}</span>
                  ))}
                  {cats.length > 4 ? <span>+{cats.length - 4}</span> : null}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-custom kt-industries-footer">
        <div className="kt-industries-footer__panel">
          <div>
            <h2>{isAr ? "لم تجد قطاعك؟" : "Don’t see your industry?"}</h2>
            <p>
              {isAr
                ? "استخدم تصنيف «أخرى» أو تواصل معنا لإضافة قطاعك إلى كتالوج المملكة."
                : "Use the Others category, or contact us to add your sector to the Hukum catalogue."}
            </p>
          </div>
          <div className="kt-industries-footer__actions">
            <Link href={`/${locale}/categories?c=others`} className="btn-primary">
              {isAr ? "تصفح أخرى" : "Browse Others"}
            </Link>
            <Link href={`/${locale}/products`} className="btn-secondary">
              {isAr ? "كل المنتجات" : "All products"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
