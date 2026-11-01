import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/config";
import { HukumPageHeader } from "@/components/layout/HukumPageHeader";
import { staticPageMetadata } from "@/modules/seo/static-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return staticPageMetadata(params, "/vendors/brands", "ignored", undefined, { seoKey: "vendors-brands" });
}

export default async function VendorBrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const checks = isAr
    ? [
        ["تحقق من الصفة", "اطلب خطاب تفويض حديثاً أو استخدم أداة التحقق الرسمية للعلامة إن توفرت."],
        ["طابق نطاق المنتجات", "قد يغطي التفويض خطوط منتجات أو مناطق أو قنوات بيع محددة فقط."],
        ["راجع العرض", "تأكد من رقم الموديل والضمان وبلد المنشأ ومدة التوريد وخدمة ما بعد البيع."],
      ]
    : [
        ["Confirm the relationship", "Ask for a current authorization letter or use the brand’s official partner checker where available."],
        ["Match the authorized scope", "Authorization may cover only specific product lines, territories or sales channels."],
        ["Review the quotation", "Confirm model number, warranty, country of origin, lead time and after-sales support."],
      ];
  return (
    <div className="hukum-page">
      <div className="hukum-page__wrap">
        <HukumPageHeader
          locale={locale}
          eyebrow={isAr ? "مصادر التوريد" : "Supplier discovery"}
          title={isAr ? "العلامات والموزعون المعتمدون" : "Brands and authorised distributors"}
          arabic={isAr ? undefined : "العلامات والموزعون المعتمدون"}
          lead={isAr ? "ابحث عن المورد المناسب، ثم تحقق من علاقته بالعلامة ونطاق التفويض للمنتج الذي تشتريه." : "Find the right supplier, then verify its relationship with the brand and the authorization scope for the product you are buying."}
          crumbs={[{ label: isAr ? "الرئيسية" : "Home", href: `/${locale}` }, { label: isAr ? "الموردون" : "Vendors", href: `/${locale}/vendors` }, { label: isAr ? "العلامات والموزعون" : "Brands and distributors" }]}
          actions={<Link href={`/${locale}/vendors?type=distributor`} className="hukum-btn hukum-btn--primary">{isAr ? "تصفح الموزعين" : "Browse distributors"}</Link>}
        />

        <section className="grid gap-5 lg:grid-cols-3">
          {checks.map(([title, body], index) => (
            <article key={title} className="hukum-card p-6">
              <span className="hukum-badge-pill">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="mt-4 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--hukum-muted)]">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 rounded-[1.35rem] bg-[var(--hukum-surface)] p-6 md:grid-cols-2 md:p-8">
          <div>
            <h2 className="text-xl font-bold">{isAr ? "ماذا تعني صفة «موزع معتمد»؟" : "What does “authorised distributor” mean?"}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--hukum-muted)]">{isAr ? "تعني عادةً أن العلامة سمحت للمنشأة ببيع منتجات محددة ضمن نطاق معين. لا تفترض أن التفويض دائم أو شامل؛ اطلب دليلاً صالحاً لطلبك." : "It generally means a brand permits the business to sell specified products within a defined scope. Do not assume authorization is permanent or universal; request evidence relevant to your order."}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold">{isAr ? "ماذا لو لم أجد العلامة؟" : "What if the brand is not listed?"}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--hukum-muted)]">{isAr ? "ابحث باسم المنتج أو الموديل في دليل الموردين، أو أرسل طلب عرض يذكر قبول البدائل من عدمه." : "Search the vendor directory by product or model, or submit an RFQ that clearly states whether equivalent alternatives are acceptable."}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${locale}/vendors`} className="hukum-btn hukum-btn--secondary">{isAr ? "كل الموردين" : "All vendors"}</Link>
              <Link href={`/${locale}/rfq`} className="hukum-btn hukum-btn--primary">{isAr ? "اطلب عروضاً" : "Request quotes"}</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
