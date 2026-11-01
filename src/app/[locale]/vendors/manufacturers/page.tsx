import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/vendors/manufacturers", "ignored", undefined, {
    seoKey: "vendors-manufacturers",
  });
}

export default async function ManufacturersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  const points = isAr
    ? [
        {
          title: "مصنع مقابل موزّع",
          body: "المصانع تنتج مباشرة. استخدم فلاتر نوع الشركة للوصول إلى من يصنّع فعلياً.",
        },
        {
          title: "التحقق أولاً",
          body: "فضّل الموردين بشارات فحص السجل التجاري أو الموثّق قبل طلب عينات أو عروض.",
        },
        {
          title: "حدد القطاع",
          body: "ابدأ من التصنيف الصحيح حتى تصل الطلبات إلى مصانع قادرة على التوريد.",
        },
      ]
    : [
        {
          title: "Manufacturer vs distributor",
          body: "Manufacturers produce directly. Use company-type filters to reach those who actually make the goods.",
        },
        {
          title: "Verification first",
          body: "Prefer CR-checked or Verified badges before requesting samples or quotations.",
        },
        {
          title: "Start in the right sector",
          body: "Open the correct category so your request reaches factories that can supply it.",
        },
      ];

  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "الموردون" : "Vendors"}
          title={isAr ? "المصانع" : "Manufacturers"}
          arabic={isAr ? undefined : "المصانع"}
          lead={
            isAr
              ? "اعثر على مصانع قادرة على الإنتاج والتوريد — ثم أرسل طلباً واحداً واضحاً."
              : "Find factories that can produce and supply — then send one clear request."
          }
          crumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "الموردون" : "Vendors", href: `/${locale}/vendors` },
            { label: isAr ? "المصانع" : "Manufacturers" },
          ]}
          actions={
            <>
              <Link
                href={`/${locale}/vendors?companyType=manufacturer`}
                className="hukum-btn hukum-btn--primary"
              >
                {isAr ? "عرض المصانع" : "Browse manufacturers"}
              </Link>
              <Link href={`/${locale}/rfq`} className="hukum-btn hukum-btn--secondary">
                {isAr ? "طلب عرض سعر" : "Request a quote"}
              </Link>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {points.map((item) => (
            <article key={item.title} className="hukum-card p-6">
              <h2 className="text-base font-bold text-[var(--hukum-ink)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--hukum-muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
