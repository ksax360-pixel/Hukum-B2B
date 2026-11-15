import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/vendors/made-in-saudi", "ignored", undefined, {
    seoKey: "vendors-made-in-saudi",
  });
}

export default async function MadeInSaudiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  const cards = isAr
    ? [
        {
          title: "منشأ سعودي",
          body: "صفّ المنتجات والموردين حسب منشأ سعودي عند توفر البيانات في الكتالوج.",
          href: `/${locale}/products?origin=SA`,
          cta: "منتجات سعودية",
        },
        {
          title: "موردون داخل المملكة",
          body: "تصفّح الموردين حسب المدينة أو التحقق للوصول إلى شركاء محليين أسرع في التوريد.",
          href: `/${locale}/vendors/cities`,
          cta: "حسب المدينة",
        },
        {
          title: "طلب توريد محلي",
          body: "اذكر تفضيل التصنيع أو التوريد المحلي في طلب العرض ليصل إلى الموردين المناسبين.",
          href: `/${locale}/rfq`,
          cta: "إنشاء طلب",
        },
      ]
    : [
        {
          title: "Saudi origin",
          body: "Filter catalogue items by Saudi origin when origin data is available on the listing.",
          href: `/${locale}/products?origin=SA`,
          cta: "Saudi products",
        },
        {
          title: "Suppliers in the Kingdom",
          body: "Browse by city or verification to reach local partners with shorter fulfilment paths.",
          href: `/${locale}/vendors/cities`,
          cta: "By city",
        },
        {
          title: "Local sourcing request",
          body: "State a local manufacturing or supply preference in your RFQ so the right vendors are matched.",
          href: `/${locale}/rfq`,
          cta: "Create request",
        },
      ];

  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "المحتوى المحلي" : "Local content"}
          title={isAr ? "صنع في السعودية" : "Made in Saudi"}
          arabic={isAr ? undefined : "صنع في السعودية"}
          goldEyebrow
          lead={
            isAr
              ? "مسارات واضحة للوصول إلى منتجات وموردين محليين ضمن نفس تجربة Hukum."
              : "Clear paths to locally made products and Saudi-based suppliers inside the same Hukum experience."
          }
          crumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "الموردون" : "Vendors", href: `/${locale}/vendors` },
            { label: isAr ? "صنع في السعودية" : "Made in Saudi" },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.href} className="hukum-card flex flex-col p-6">
              <h2 className="text-lg font-bold text-[var(--hukum-ink)]">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-[var(--hukum-muted)]">{card.body}</p>
              <Link href={card.href} className="hukum-btn hukum-btn--secondary mt-5 w-fit">
                {card.cta}
                <span aria-hidden>→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
