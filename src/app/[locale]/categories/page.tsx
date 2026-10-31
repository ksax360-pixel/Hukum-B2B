export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { CategoryVisual } from "@/components/categories/CategoryVisual";
import { softColorForCategoryKey } from "@/lib/category-soft";
import { connectDB } from "@/lib/db";
import { Category, Industry } from "@/modules/categories/taxonomy.model";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const isAr = raw === "ar";
  return staticPageMetadata(
    params,
    "/categories",
    isAr ? "التصنيفات | Hukum" : "Categories | Suppliers & Manufacturers",
    isAr
      ? "تصفح تصنيفات المنتجات الصناعية والموردين على Hukum."
      : "Browse industrial product categories and find verified suppliers on Hukum."
  );
}

type LeanCat = {
  _id: unknown;
  industryId?: unknown;
  catalogKey?: string;
  icon?: string;
  image?: string;
  name?: { en?: string; ar?: string };
  slug?: { en?: string; ar?: string };
  order?: number;
};

type LeanIndustry = {
  _id: unknown;
  name?: { en?: string; ar?: string };
  description?: { en?: string; ar?: string };
  order?: number;
};

export default async function CategoriesPage({
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
  const selectedKey = sp.c || "";
  const isAr = locale === "ar";
  const nameOf = (n?: { en?: string; ar?: string }) => (isAr ? n?.ar || n?.en : n?.en || n?.ar) || "";

  let industries: LeanIndustry[] = [];
  let categories: LeanCat[] = [];

  try {
    await connectDB();
    [industries, categories] = await Promise.all([
      Industry.find({ status: "active" }).sort({ order: 1 }).lean() as Promise<LeanIndustry[]>,
      Category.find({
        status: "active",
        level: 1,
        $or: [{ parentId: null }, { parentId: { $exists: false } }],
      })
        .sort({ order: 1 })
        .lean() as Promise<LeanCat[]>,
    ]);
  } catch {
    /* offline */
  }

  if (selectedKey) {
    const hit = categories.find(
      (c) => c.catalogKey === selectedKey || c.icon === selectedKey || c.slug?.en === selectedKey
    );
    if (hit) {
      redirect(`/${locale}/c/${hit.slug?.en || hit.catalogKey || selectedKey}`);
    }
  }

  const byIndustry = industries
    .map((ind) => ({
      industry: ind,
      categories: categories.filter((c) => String(c.industryId) === String(ind._id)),
    }))
    .filter((row) => row.categories.length > 0);

  const orphan = categories.filter(
    (c) => !industries.some((ind) => String(ind._id) === String(c.industryId))
  );
  if (orphan.length) {
    byIndustry.push({
      industry: {
        _id: "other",
        name: { en: "Other", ar: "أخرى" },
        description: { en: "Additional categories", ar: "تصنيفات إضافية" },
      },
      categories: orphan,
    });
  }

  const focusSegment = sp.segment || "";

  return (
    <div className="cats-page">
      <div className="container-custom cats-page__inner">
        <header className="cats-page__intro">
          <p className="cats-page__eyebrow">{isAr ? "السوق" : "Marketplace"}</p>
          <h1 className="cats-page__title">{isAr ? "التصنيفات" : "Categories"}</h1>
          <p className="cats-page__copy">
            {isAr
              ? "ابدأ باختيار القطاع، ثم تصفّح التصنيفات المرتبطة به — دون الضياع بين كل الخيارات دفعة واحدة."
              : "Start with an industry, then browse its categories — so you’re never lost in one long wall of options."}
          </p>
        </header>

        <nav className="cats-page__jump" aria-label={isAr ? "القطاعات" : "Industries"}>
          {byIndustry.map(({ industry, categories: cats }) => {
            const id = String(industry._id);
            const active = focusSegment === id;
            return (
              <a
                key={id}
                href={`#segment-${id}`}
                className={`cats-page__jump-chip${active ? " is-active" : ""}`}
              >
                <span>{nameOf(industry.name)}</span>
                <em>{cats.length}</em>
              </a>
            );
          })}
        </nav>

        <div className="cats-page__segments">
          {byIndustry.map(({ industry, categories: cats }) => {
            const id = String(industry._id);
            return (
              <section
                key={id}
                id={`segment-${id}`}
                className={`cats-page__segment${focusSegment === id ? " is-focus" : ""}`}
              >
                <header className="cats-page__segment-head">
                  <div className="cats-page__segment-copy">
                    <p className="cats-page__eyebrow">{isAr ? "قطاع" : "Industry"}</p>
                    <h2 className="cats-page__segment-title">{nameOf(industry.name)}</h2>
                    <p className="cats-page__segment-desc">{nameOf(industry.description)}</p>
                  </div>
                  <p className="cats-page__segment-count">
                    <strong>{cats.length}</strong>{" "}
                    {isAr ? "تصنيف" : cats.length === 1 ? "category" : "categories"}
                  </p>
                </header>

                <div className="cats-page__grid">
                  {cats.map((cat) => {
                    const key = cat.catalogKey || cat.icon || cat.slug?.en || "";
                    const active = selectedKey === key;
                    return (
                      <Link
                        key={String(cat._id)}
                        href={`/${locale}/c/${cat.slug?.en || key}`}
                        className={`cats-page__card${active ? " is-active" : ""}`}
                      >
                        <span
                          className="cats-page__card-icon"
                          style={{ background: softColorForCategoryKey(key) }}
                        >
                          <CategoryVisual
                            categoryKey={key}
                            image={cat.image}
                            className="h-10 w-10 md:h-11 md:w-11"
                            size={44}
                          />
                        </span>
                        <span className="cats-page__card-name">{nameOf(cat.name)}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <section className="cats-concierge home-band--black">
        <div className="container-custom">
          <div className="home-trust">
            <p className="home-trust__eyebrow">{isAr ? "خدمة مخصّصة" : "Concierge sourcing"}</p>
            <h2 className="home-trust__title">
              {isAr ? "لم تجد التصنيف المناسب؟" : "Can’t find the right category?"}
            </h2>
            <span className="home-trust__rule" aria-hidden />
            <p className="home-trust__copy">
              {isAr
                ? "فريقنا يتواصل معك، يفهم متطلباتك، يجد المورد المناسب، ويتابع حتى يصل العرض إلى بابك."
                : "Our team gets in touch, captures your requirements, finds the right vendors, and follows through until they reach your doorstep."}
            </p>
            <div className="home-trust__actions">
              <Link href={`/${locale}/contact`} className="home-trust__primary">
                {isAr ? "اطلب خدمة التوريد" : "Request sourcing help"}
              </Link>
              <Link href={`/${locale}/rfq`} className="home-trust__secondary">
                {isAr ? "إنشاء طلب عرض سعر" : "Create RFQ"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
