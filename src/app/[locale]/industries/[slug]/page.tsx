export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { connectDB } from "@/lib/db";
import { Industry, Category } from "@/modules/categories/taxonomy.model";
import { t } from "@/lib/utils";
import mongoose from "mongoose";
import {
  getIndustryBySlug,
  getIndustryCategories,
  MARKETPLACE_INDUSTRIES,
} from "@/data/marketplace-industries";
import { IndustryIcon } from "@/components/industries/IndustryIcon";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { composeMetadata, generateFromEntity } from "@/modules/seo/engine";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const catalog = getIndustryBySlug(slug);
  const name = catalog ? (locale === "ar" ? catalog.name.ar : catalog.name.en) : slug;
  const gen = generateFromEntity("industry", locale, { name });
  return composeMetadata({
    locale,
    path: `/industries/${slug}`,
    title: gen.title,
    description: catalog ? (locale === "ar" ? catalog.description.ar : catalog.description.en) : gen.description,
    seo: undefined,
  });
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const nameOf = (n: { en: string; ar: string }) => (isAr ? n.ar : n.en);

  const catalog = getIndustryBySlug(slug);

  let dbIndustry: Record<string, unknown> | null = null;
  let dbCategories: Array<Record<string, unknown>> = [];
  const catSlugToId = new Map<string, string>();

  try {
    await connectDB();
    const or: Record<string, unknown>[] = [{ "slug.en": slug }, { "slug.ar": slug }];
    if (mongoose.isValidObjectId(slug)) or.push({ _id: slug });

    // Prefer exact DB slug, else match by industry name from catalog.
    dbIndustry = (await Industry.findOne({ status: "active", $or: or }).lean()) as Record<
      string,
      unknown
    > | null;

    if (!dbIndustry && catalog) {
      dbIndustry = (await Industry.findOne({
        status: "active",
        $or: [{ "name.en": catalog.name.en }, { "slug.en": catalog.slug.en }],
      }).lean()) as Record<string, unknown> | null;
    }

    if (dbIndustry) {
      dbCategories = await Category.find({ status: "active", industryId: dbIndustry._id })
        .sort({ order: 1 })
        .lean();
    }

    const allCats = await Category.find({ status: "active", level: 1 }).select("_id slug").lean();
    for (const c of allCats) {
      const en = (c.slug as { en?: string } | undefined)?.en;
      if (en) catSlugToId.set(en, String(c._id));
    }
  } catch {
    /* offline */
  }

  if (!catalog && !dbIndustry) {
    return (
      <div className="container-custom section">
        <div className="empty-state">{isAr ? "القطاع غير موجود." : "Industry not found."}</div>
        <Link href={`/${locale}/industries`} className="btn-secondary mt-6 inline-flex">
          {isAr ? "العودة" : "Back to industries"}
        </Link>
      </div>
    );
  }

  const industry = catalog || {
    key: "general",
    name: (dbIndustry?.name as { en: string; ar: string }) || { en: slug, ar: slug },
    description: (dbIndustry?.description as { en: string; ar: string }) || {
      en: "",
      ar: "",
    },
    slug: { en: slug, ar: slug },
    accent: "#001730",
    soft: "#F1F5F9",
    order: 50,
    categoryKeys: [],
  };

  const catalogCategories = catalog ? getIndustryCategories(catalog) : [];
  const related = MARKETPLACE_INDUSTRIES.filter((i) => i.key !== industry.key).slice(0, 4);

  const title = catalog ? nameOf(catalog.name) : t(locale, dbIndustry?.name as { en?: string; ar?: string });
  const description = catalog
    ? nameOf(catalog.description)
    : t(locale, dbIndustry?.description as { en?: string; ar?: string });

  return (
    <div className="kt-industry-detail">
      <section
        className="kt-industry-detail__hero"
        style={{ ["--ind-accent" as string]: industry.accent, ["--ind-soft" as string]: industry.soft }}
      >
        <div className="container-custom kt-industry-detail__hero-inner">
          <nav className="kt-industry-detail__crumb">
            <Link href={`/${locale}`}>{isAr ? "الرئيسية" : "Home"}</Link>
            <span>/</span>
            <Link href={`/${locale}/industries`}>{isAr ? "القطاعات" : "Industries"}</Link>
            <span>/</span>
            <span>{title}</span>
          </nav>

          <div className="kt-industry-detail__hero-grid">
            <div className="kt-industry-detail__copy">
              <p className="label-caps">{isAr ? "قطاع" : "Industry"}</p>
              <h1>{title}</h1>
              {description ? <p className="kt-industry-detail__lead">{description}</p> : null}
              <div className="kt-industry-detail__actions">
                <Link
                  href={
                    dbIndustry
                      ? `/${locale}/products?industryId=${String(dbIndustry._id)}`
                      : `/${locale}/products?q=${encodeURIComponent(industry.name.en)}`
                  }
                  className="btn-primary"
                >
                  {isAr ? "تصفح المنتجات" : "Browse products"}
                </Link>
                <Link href={`/${locale}/categories`} className="btn-secondary">
                  {isAr ? "كل التصنيفات" : "All categories"}
                </Link>
              </div>
            </div>
            <div className="kt-industry-detail__mark">
              <IndustryIcon industryKey={industry.key} />
            </div>
          </div>
        </div>
      </section>

      <section className="container-custom kt-industry-detail__section">
        <div className="kt-industries-section__head">
          <p className="label-caps">{isAr ? "التصنيفات" : "Categories"}</p>
          <h2>{isAr ? "التصنيفات ضمن هذا القطاع" : "Categories in this industry"}</h2>
          <p>
            {isAr
              ? "كل التصنيفات المرتبطة بهذا القطاع في كتالوج Hukum."
              : "Every category mapped to this industry in the Hukum catalogue."}
          </p>
        </div>

        <div className="kt-industry-cats">
          {catalogCategories.length === 0 && dbCategories.length === 0 && (
            <div className="col-span-full empty-state">
              {isAr ? "لا توجد تصنيفات مرتبطة بعد." : "No linked categories yet."}
            </div>
          )}

          {catalogCategories.map((cat) => {
            const dbId = catSlugToId.get(cat.slug.en);
            return (
              <Link
                key={cat.key}
                href={
                  dbId
                    ? `/${locale}/products?categoryId=${dbId}`
                    : `/${locale}/categories?c=${cat.key}`
                }
                className="kt-industry-cat"
                style={{ ["--cat-soft" as string]: cat.soft, ["--cat-accent" as string]: cat.accent }}
              >
                <span className="kt-industry-cat__icon">
                  <CategoryIcon categoryKey={cat.key} className="h-12 w-12" />
                </span>
                <span className="kt-industry-cat__body">
                  <strong>{nameOf(cat.name)}</strong>
                  <em>{nameOf(cat.description)}</em>
                </span>
              </Link>
            );
          })}

          {catalogCategories.length === 0 &&
            dbCategories.map((c) => (
              <Link
                key={String(c._id)}
                href={`/${locale}/products?categoryId=${String(c._id)}`}
                className="kt-industry-cat"
              >
                <span className="kt-industry-cat__body">
                  <strong>{t(locale, c.name as { en?: string; ar?: string })}</strong>
                </span>
              </Link>
            ))}
        </div>
      </section>

      <section className="container-custom kt-industry-detail__section">
        <div className="kt-industries-section__head">
          <p className="label-caps">{isAr ? "المزيد" : "More"}</p>
          <h2>{isAr ? "قطاعات ذات صلة" : "Related industries"}</h2>
        </div>
        <div className="kt-industries-grid kt-industries-grid--compact">
          {related.map((ind) => (
            <Link
              key={ind.key}
              href={`/${locale}/industries/${ind.slug.en}`}
              className="kt-industry-card"
              style={{ ["--ind-accent" as string]: ind.accent, ["--ind-soft" as string]: ind.soft }}
            >
              <div className="kt-industry-card__top">
                <span className="kt-industry-card__mark">
                  <IndustryIcon industryKey={ind.key} />
                </span>
              </div>
              <h3>{nameOf(ind.name)}</h3>
              <p>{nameOf(ind.description)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
